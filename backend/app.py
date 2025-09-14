# route_helper.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from pathlib import Path
from datetime import datetime
import os
import json
import time
import math
import requests
import re

# ---------- Config & env loader (same pattern you used) --------------------
from dotenv import load_dotenv
load_dotenv(dotenv_path=Path(__file__).parent / ".env")

GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise RuntimeError("GOOGLE_API_KEY not found in environment")

# Optional: you may already have gemini configured. If you want Gemini
# to rank/describe POIs, uncomment and configure it similarly to your old file:
# import google.generativeai as genai
# genai.configure(api_key=os.environ["GOOGLE_API_KEY"])
# model = genai.GenerativeModel(model_name="gemini-2.0-flash", generation_config={...})

# ---------- Flask app ------------------------------------------------------
app = Flask(__name__)
CORS(app)

# ---------- Utilities -----------------------------------------------------

def haversine_meters(a, b):
    """Return distance in meters between two (lat, lng) pairs."""
    lat1, lon1 = a
    lat2, lon2 = b
    R = 6371000.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    hav = math.sin(dphi/2.0)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2.0)**2
    return 2 * R * math.asin(math.sqrt(hav))

def decode_polyline(polyline_str):
    """Decodes a polyline that Google Directions returns into list of (lat, lng)."""
    # Implementation adapted from standard polyline decode algorithm
    index, lat, lng = 0, 0, 0
    coordinates = []
    changes = {'lat': 0, 'lng': 0}

    while index < len(polyline_str):
        for key in ('lat', 'lng'):
            shift = 0
            result = 0
            while True:
                byte = ord(polyline_str[index]) - 63
                index += 1
                result |= (byte & 0x1f) << shift
                shift += 5
                if byte < 0x20:
                    break
            d = ~(result >> 1) if (result & 1) else (result >> 1)
            if key == 'lat':
                lat += d
            else:
                lng += d
        coordinates.append((lat / 1e5, lng / 1e5))
    return coordinates

def sample_along_polyline(points, every_m=1500):
    """
    Return a list of sample points (lat,lng) spaced approximately every 'every_m' meters
    along the polyline defined by points (list of lat,lng).
    """
    if not points:
        return []
    samples = [points[0]]
    accumulated = 0.0
    prev = points[0]
    # Walk segments and emit samples when we accumulate distance >= every_m
    for p in points[1:]:
        seg_len = haversine_meters(prev, p)
        if seg_len == 0:
            prev = p
            continue
        # move along segment in proportion to where sample falls
        while accumulated + seg_len >= every_m:
            remain = every_m - accumulated
            frac = remain / seg_len
            lat = prev[0] + (p[0] - prev[0]) * frac
            lng = prev[1] + (p[1] - prev[1]) * frac
            samples.append((lat, lng))
            # new 'prev' becomes that sampled point; reduce seg_len & continue
            prev = (lat, lng)
            seg_len = haversine_meters(prev, p)
            accumulated = 0.0
        accumulated += seg_len
        prev = p
    return samples

# ---------- Google Maps API helpers ---------------------------------------

BASE_GEOCODE = "https://maps.googleapis.com/maps/api/geocode/json"
BASE_DIRECTIONS = "https://maps.googleapis.com/maps/api/directions/json"
BASE_PLACES_NEARBY = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
BASE_PLACE_DETAILS = "https://maps.googleapis.com/maps/api/place/details/json"

def geocode_address(address):
    """Return (lat, lng) for a given address string using Geocoding API."""
    params = {"address": address, "key": GOOGLE_API_KEY}
    r = requests.get(BASE_GEOCODE, params=params)
    r.raise_for_status()
    data = r.json()
    if data.get("status") != "OK" or not data.get("results"):
        return None
    loc = data["results"][0]["geometry"]["location"]
    return (loc["lat"], loc["lng"])

def directions_json(origin, destination, waypoints=None, departure_time=None):
    """
    origin/destination can be either "lat,lng" string or address string.
    waypoints: list of "lat,lng" or address strings (will be joined).
    Returns the raw directions JSON.
    """
    params = {"origin": origin, "destination": destination, "key": GOOGLE_API_KEY}
    if waypoints:
        # join waypoints with pipe, encode 'via:' if needed
        params["waypoints"] = "|".join(waypoints)
    if departure_time:
        params["departure_time"] = str(departure_time)
    r = requests.get(BASE_DIRECTIONS, params=params)
    r.raise_for_status()
    return r.json()

def places_near(lat, lng, radius=1000, place_type=None, keyword=None):
    """
    Call Places Nearby Search around (lat,lng). Returns list of places (raw).
    place_type: Google Places type string (e.g., 'cafe', 'restaurant', 'park').
    keyword: free-text keyword to match.
    """
    params = {
        "location": f"{lat},{lng}",
        "radius": int(radius),
        "key": GOOGLE_API_KEY,
    }
    if place_type:
        params["type"] = place_type
    if keyword:
        params["keyword"] = keyword
    r = requests.get(BASE_PLACES_NEARBY, params=params)
    r.raise_for_status()
    data = r.json()
    # handle pagination: if next_page_token exists, you may need to wait and call again.
    results = data.get("results", [])
    next_page = data.get("next_page_token")
    # naive support for one additional page (sleep required per Google docs)
    if next_page:
        time.sleep(2)  # short sleep; sometimes 2s is enough, sometimes you need 1-2s
        r2 = requests.get(BASE_PLACES_NEARBY, params={**params, "pagetoken": next_page})
        r2.raise_for_status()
        results.extend(r2.json().get("results", []))
    return results

def get_place_details(place_id, fields=None):
    params = {"place_id": place_id, "key": GOOGLE_API_KEY}
    if fields:
        params["fields"] = ",".join(fields)
    r = requests.get(BASE_PLACE_DETAILS, params=params)
    r.raise_for_status()
    return r.json().get("result")

# ---------- Core: suggest mid-journey stops --------------------------------

def normalize_location_input(loc):
    """
    Accept either:
      - dict with 'lat' and 'lng' floats
      - "lat,lng" string
      - plain address string
    Return a tuple (lat,lng) if possible else None and the original string for API usage.
    """
    if isinstance(loc, dict) and "lat" in loc and "lng" in loc:
        return (float(loc["lat"]), float(loc["lng"])), f"{loc['lat']},{loc['lng']}"
    if isinstance(loc, str):
        m = re.match(r"^\s*([-+]?\d+(\.\d+)?),\s*([-+]?\d+(\.\d+)?)\s*$", loc)
        if m:
            lat, lng = float(m.group(1)), float(m.group(3))
            return (lat, lng), f"{lat},{lng}"
        # else assume address string, try geocoding
        coords = geocode_address(loc)
        if coords:
            return coords, f"{coords[0]},{coords[1]}"
        else:
            return None, loc
    return None, str(loc)

def find_candidates_along_route(stops, desired_type=None, keyword=None, sample_every_m=1500, search_radius=1200, max_candidates=25):
    """
    stops: ordered list of destinations (strings addresses or lat,lng or dicts)
    desired_type: places type (e.g., 'cafe', 'restaurant', 'park')
    keyword: additional free-text filter (e.g., 'vegan', 'museum')
    Returns list of candidate POIs with metadata.
    """
    # Build directions for full route to obtain polyline(s).
    # We'll request directions between the first and last stop, using intermediate stops as waypoints.
    if len(stops) < 2:
        raise ValueError("At least two stops required to define a route")

    # Normalize inputs and create address strings for Directions API
    norm = [normalize_location_input(s) for s in stops]
    coords = [n[0] for n in norm]
    addr_strs = [n[1] for n in norm]
    if any(c is None for c in coords):
        raise ValueError("Unable to geocode one or more stops")

    origin = addr_strs[0]
    destination = addr_strs[-1]
    waypoints = addr_strs[1:-1] or None

    directions = directions_json(origin, destination, waypoints=waypoints)
    if directions.get("status") != "OK" or not directions.get("routes"):
        raise RuntimeError(f"Directions API failed: {directions.get('status')}")

    # Collect polylines from each leg/step to build full path
    route = directions["routes"][0]
    overview_polyline = route.get("overview_polyline", {}).get("points")
    if not overview_polyline:
        raise RuntimeError("No polyline in directions response")
    full_path = decode_polyline(overview_polyline)

    # Sample points along the polyline
    samples = sample_along_polyline(full_path, every_m=sample_every_m)

    # For each sample, call Places Nearby Search and collect unique places (by place_id)
    place_map = {}  # place_id -> place dict (combine fields)
    for pt in samples:
        lat, lng = pt
        try:
            results = places_near(lat, lng, radius=search_radius, place_type=desired_type, keyword=keyword)
        except Exception as e:
            # avoid hard failure for one sample point
            print(f"Places API error at sample {pt}: {e}")
            continue
        for p in results:
            pid = p.get("place_id")
            if not pid:
                continue
            # keep the closest geometry info, rating, user_ratings_total etc.
            if pid not in place_map:
                place_map[pid] = {
                    "place_id": pid,
                    "name": p.get("name"),
                    "vicinity": p.get("vicinity"),
                    "location": p.get("geometry", {}).get("location"),
                    "types": p.get("types", []),
                    "rating": p.get("rating"),
                    "user_ratings_total": p.get("user_ratings_total"),
                    "source_sample_point": {"lat": lat, "lng": lng},
                }
        # Avoid hitting rate limits aggressively
        time.sleep(0.1)

    # Trim to max_candidates
    candidates = list(place_map.values())[:max_candidates]
    return candidates, directions

def compute_total_time_with_insertion(stops_addr_list, insert_point_idx, candidate_loc_str):
    """
    Compute directions for the itinerary with candidate inserted between stops at index insert_point_idx and insert_point_idx+1.
    stops_addr_list: list of address strings passed to Google Directions API
    insert_point_idx: index of the stop AFTER which the candidate will be inserted (0-based)
      e.g. if insert_point_idx = 0, candidate inserted between stops[0] and stops[1]
    candidate_loc_str: "lat,lng" or address string
    Returns total_duration_seconds and the directions response.
    """
    if insert_point_idx < 0 or insert_point_idx >= len(stops_addr_list) - 1:
        raise IndexError("insert_point_idx out of valid range")

    # Build new stops list with candidate
    new_stops = stops_addr_list[:insert_point_idx + 1] + [candidate_loc_str] + stops_addr_list[insert_point_idx + 1:]
    # Use Directions between new_stops[0] and new_stops[-1], and pass intermediate waypoints
    origin = new_stops[0]
    destination = new_stops[-1]
    waypoints = new_stops[1:-1] or None
    resp = directions_json(origin, destination, waypoints=waypoints)
    if resp.get("status") != "OK":
        # bubble the error upwards
        return None, resp
    # Compute total duration across legs
    route = resp["routes"][0]
    total_seconds = 0
    for leg in route.get("legs", []):
        leg_dur = leg.get("duration", {}).get("value", 0)
        total_seconds += int(leg_dur)
    return total_seconds, resp

# ---------- Flask route ---------------------------------------------------

@app.route("/suggest_stops", methods=["POST"])
def suggest_stops():
    """
    Expects JSON body:
    {
      "stops": [ "address or lat,lng or {lat:..,lng:..}", ... ]   # ordered route stops, at least 2
      "desired_type": "cafe"   # optional Google Places type
      "keyword": "vegan"       # optional free text
      "sample_every_m": 1500,
      "search_radius": 1200,
      "max_candidates": 20,
      "time_constraint_seconds": 1800   # optional: max allowed added detour in seconds
    }
    Response:
    {
      "route_summary": { "total_duration_seconds": X, "distance_meters": Y, ... },
      "candidates": [
         {
            "place_id": "...",
            "name": "...",
            "vicinity": "...",
            "location": {"lat":..,"lng":..},
            "insert_between": [index_a, index_b],
            "total_travel_time_seconds": 12345,
            "added_time_seconds": 600,
            "directions_snapshot": { ... }   # directions JSON if requested (optional)
         },
         ...
      ]
    }
    """
    data = request.json or {}
    stops = data.get("stops")
    if not stops or not isinstance(stops, list) or len(stops) < 2:
        return jsonify({"error": "Provide at least 2 stops in 'stops' list"}), 400

    desired_type = data.get("desired_type")
    keyword = data.get("keyword")
    sample_every_m = int(data.get("sample_every_m", 1500))
    search_radius = int(data.get("search_radius", 1200))
    max_candidates = int(data.get("max_candidates", 20))
    time_constraint_seconds = data.get("time_constraint_seconds")  # optional

    # Normalize stops and geocode if needed
    normalized = []
    addr_strs = []
    for s in stops:
        coords, addr_str = normalize_location_input(s)
        if coords is None:
            return jsonify({"error": f"Unable to geocode stop: {s}"}), 400
        normalized.append(coords)
        addr_strs.append(addr_str)

    try:
        candidates, original_directions = find_candidates_along_route(
            stops,
            desired_type=desired_type,
            keyword=keyword,
            sample_every_m=sample_every_m,
            search_radius=search_radius,
            max_candidates=max_candidates,
        )
    except Exception as e:
        return jsonify({"error": f"Failed to find candidates: {str(e)}"}), 500

    # Compute baseline total travel time for original route
    if original_directions.get("status") != "OK":
        return jsonify({"error": "Directions API failed for original route"}), 500
    orig_total_seconds = 0
    orig_distance_m = 0
    for leg in original_directions["routes"][0].get("legs", []):
        orig_total_seconds += int(leg.get("duration", {}).get("value", 0))
        orig_distance_m += int(leg.get("distance", {}).get("value", 0))

    # For each candidate we estimate best insertion point (the leg whose midpoint is closest to the candidate),
    # then compute the full route time with that candidate inserted using Directions API.
    results = []
    # Pre-compute leg midpoints (lat,lng) for original legs
    legs = original_directions["routes"][0].get("legs", [])
    leg_midpoints = []
    for leg in legs:
        start = leg.get("start_location")
        end = leg.get("end_location")
        if start and end:
            mid = ((start["lat"] + end["lat"]) / 2.0, (start["lng"] + end["lng"]) / 2.0)
        else:
            mid = None
        leg_midpoints.append(mid)

    for c in candidates:
        c_loc = c.get("location")
        if not c_loc:
            continue
        c_lat, c_lng = c_loc["lat"], c_loc["lng"]
        # Find nearest leg midpoint
        best_idx = 0
        best_dist = float("inf")
        for i, mid in enumerate(leg_midpoints):
            if not mid:
                continue
            d = haversine_meters((c_lat, c_lng), mid)
            if d < best_dist:
                best_dist = d
                best_idx = i
        # We will insert between stops indices best_idx and best_idx+1
        try:
            total_seconds_with, dir_resp = compute_total_time_with_insertion(
                addr_strs, best_idx, f"{c_lat},{c_lng}"
            )
        except Exception as e:
            # if compute failed, skip candidate
            print(f"Candidate Directions error for {c.get('name')}: {e}")
            continue
        if total_seconds_with is None:
            # directions returned non-OK; skip
            continue
        added = int(total_seconds_with - orig_total_seconds)
        # Apply time constraint filter if requested
        if time_constraint_seconds is not None and added > int(time_constraint_seconds):
            continue

        result = {
            "place_id": c.get("place_id"),
            "name": c.get("name"),
            "vicinity": c.get("vicinity"),
            "location": c.get("location"),
            "types": c.get("types"),
            "rating": c.get("rating"),
            "user_ratings_total": c.get("user_ratings_total"),
            "insert_between": [best_idx, best_idx + 1],
            "insert_leg_distance_to_sample_m": int(best_dist),
            "total_travel_time_seconds": int(total_seconds_with),
            "added_time_seconds": int(added),
            # Optionally include snapshot of directions for this candidate
            # "directions_snapshot": dir_resp
        }
        results.append(result)
        # polite pause to avoid hitting rate limits
        time.sleep(0.08)

    # Sort by added travel time ascending
    results.sort(key=lambda x: x["added_time_seconds"])

    response = {
        "route_summary": {
            "original_total_travel_time_seconds": int(orig_total_seconds),
            "original_total_distance_meters": int(orig_distance_m),
            "stops": stops,
        },
        "candidates": results,
        "generated_at": datetime.utcnow().isoformat() + "Z",
    }
    return jsonify(response)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
