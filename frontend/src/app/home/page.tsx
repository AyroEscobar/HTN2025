"use client";
import React, { useState } from "react";

type Stop = { lat: number; lng: number; name: string };

const App: React.FC = () => {
  const [place, setPlace] = useState("");
  const [stops, setStops] = useState<Stop[]>([]);
  const [desiredType, setDesiredType] = useState("");
  const [keyword, setKeyword] = useState("");
  const [timeConstraintMinutes, setTimeConstraintMinutes] = useState<number | "">("");
  const [response, setResponse] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [batchResults, setBatchResults] = useState<any[]>([]);

  const geocodePlace = async () => {
    if (!place.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/search_place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: place.trim() }),
      });
      const data = await res.json();

      if (data.status === "OK" && data.results && data.results.length > 0) {
        const result = data.results[0];
        const { lat, lng } = result.geometry.location;
        const name = result.name;
        setStops((s) => [...s, { lat, lng, name }]);
        setPlace("");
      } else {
        alert(`Place not found. Status: ${data.status || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Backend API error:", err);
      alert("Error reaching backend API. Make sure your Flask server is running on port 5000.");
    } finally {
      setIsSearching(false);
    }
  };

  const removeStop = (index: number) => {
    setStops((s) => s.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stops.length < 2) {
      alert("Please add at least two stops to create a route");
      return;
    }

    const payload = {
      stops: stops.map(({ lat, lng }) => ({ lat, lng })),
      desired_type: desiredType || undefined,
      keyword: keyword || undefined,
      sample_every_m: 1500,
      search_radius: 1200,
      max_candidates: 5,
      time_constraint_seconds: timeConstraintMinutes ? Number(timeConstraintMinutes) * 60 : undefined,
    };

    try {
      const res = await fetch("http://127.0.0.1:5000/suggest_stops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setResponse(data);
    } catch (err) {
      console.error("Error:", err);
      alert("Error reaching backend API (suggest_stops).");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      geocodePlace();
    }
  };

  // ---------- NEW: call FastAPI batch reservation endpoint ----------
  const handleBatchReservations = async () => {
    if (!response?.candidates?.length) {
      alert("No candidates to submit for batch reservation");
      return;
    }

    // Build places_data (match the FastAPI Pydantic PlaceData)
    const places_data = response.candidates.map((c: any) => ({
      name: c.name,
      vicinity: c.vicinity || c.formatted_address || "",
      place_id: c.place_id || null,
      rating: c.rating || null,
      types: c.types || null,
      location: c.location || c.geometry?.location || null, // be defensive
    }));

    const payload = {
      places_data,
      reservation_details: {
        party_size: 2,
        date: "2025-09-20",
        time: "7:00 PM",
        name: "Test User",
        phone: "(555) 123-4567",
        email: "test@example.com",
      },
    };

    try {
      // IMPORTANT: call FastAPI (port 8000) and the correct path /reservation/batch
     const res = await fetch("http://127.0.0.1:8000/reservation/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // If fetch failed at network level, this will be caught by catch()
      const data = await res.json();

      // Normalize to an array so .map never crashes
      const arr = Array.isArray(data) ? data : [data];
      setBatchResults(arr);

      if (!res.ok) {
        console.warn("Batch reservation API returned non-OK:", res.status, data);
        alert("Batch reservation returned an error. See console.");
      }
    } catch (err) {
      console.error("Batch error:", err);
      alert("Error reaching FastAPI batch reservation service. Check servers and CORS.");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "720px", margin: "0 auto" }}>
      <h1>Route Stop Suggestions</h1>

      {/* Stops input */}
      <h3>Add Stops</h3>
      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        <input
          type="text"
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter a place name"
          style={{ flex: 1, padding: "8px" }}
          disabled={isSearching}
        />
        <button type="button" onClick={geocodePlace} disabled={isSearching || !place.trim()} style={{ padding: "8px 16px" }}>
          {isSearching ? "Searching..." : "+ Add Stop"}
        </button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <strong>Current Stops ({stops.length}):</strong>
        {stops.length === 0 ? (
          <p style={{ fontStyle: "italic", color: "#666" }}>No stops added yet</p>
        ) : (
          <ul style={{ marginTop: "10px" }}>
            {stops.map((stop, i) => (
              <li key={i} style={{ marginBottom: "5px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>
                  <strong>{i + 1}.</strong> {stop.name} ({stop.lat.toFixed(4)}, {stop.lng.toFixed(4)})
                </span>
                <button onClick={() => removeStop(i)} style={{ marginLeft: "10px", padding: "2px 8px", color: "red" }}>
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: "20px" }}>
        <h3>Search Preferences</h3>

        <div style={{ marginBottom: "10px" }}>
          <label>
            Desired Type:
            <input type="text" value={desiredType} onChange={(e) => setDesiredType(e.target.value)} placeholder="e.g. restaurant"
                   style={{ marginLeft: "10px", padding: "4px", width: "220px" }} />
          </label>
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>
            Keyword:
            <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="e.g. pizza"
                   style={{ marginLeft: "10px", padding: "4px", width: "220px" }} />
          </label>
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>
            Max Additional Time (minutes):
            <input type="number" value={timeConstraintMinutes} onChange={(e) => setTimeConstraintMinutes(e.target.value ? Number(e.target.value) : "")}
                   placeholder="e.g. 30" style={{ marginLeft: "10px", padding: "4px", width: "120px" }} />
          </label>
        </div>

        <button type="submit" style={{ padding: "10px 20px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px" }}
                disabled={stops.length < 2}>
          Find Stops Along Route
        </button>
      </form>

      {/* Response */}
      {response && (
        <div style={{ marginTop: "20px" }}>
          <h3>Suggested Stops:</h3>
          {response.error ? (
            <div style={{ color: "red" }}>
              <strong>Error:</strong> {response.error}
            </div>
          ) : (
            <div>
              <p><strong>Original Route:</strong> {Math.round((response.route_summary?.original_total_travel_time_seconds || 0) / 60)} minutes</p>

              {response.candidates && response.candidates.length > 0 ? (
                <div>
                  <h4>Recommended Stops:</h4>
                  {response.candidates.map((candidate: any, i: number) => (
                    <div key={i} style={{ border: "1px solid #ccc", padding: "10px", margin: "10px 0", borderRadius: "4px" }}>
                      <h5>{candidate.name}</h5>
                      <p><strong>Location:</strong> {candidate.vicinity}</p>
                      <p><strong>Rating:</strong> {candidate.rating ? `${candidate.rating}/5 (${candidate.user_ratings_total} reviews)` : "No rating"}</p>
                      <p><strong>Additional Time:</strong> +{Math.round((candidate.added_time_seconds || 0) / 60)} minutes</p>
                      <p><strong>Total Trip Time:</strong> {Math.round((candidate.total_travel_time_seconds || 0) / 60)} minutes</p>
                      <p style={{ fontSize: "0.9em", color: "#666" }}><strong>Types:</strong> {candidate.types?.join(", ") || "N/A"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No suitable stops found along your route.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Batch Reservations Section */}
      <div style={{ marginTop: "30px" }}>
        <h3>Batch Reservations</h3>
        <button
          type="button"
          onClick={handleBatchReservations}
          style={{ padding: "10px 20px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "4px" }}
          disabled={!response?.candidates?.length}
        >
          Run Batch Reservations
        </button>

        <div style={{ marginTop: "20px" }}>
          <h3>Batch Results:</h3>
          {batchResults.length === 0 ? (
            <p style={{ fontStyle: "italic", color: "#666" }}>No batch results yet</p>
          ) : (
            batchResults.map((r, i) => (
              <div key={i} style={{ border: "1px solid #ddd", padding: "10px", margin: "10px 0" }}>
                <p><strong>{r.restaurant_name || r.restaurant?.name || "Unknown"}</strong> — {r.location || "Unknown location"}</p>
                <p>Status: {r.status || "N/A"}</p>
                {r.confirmation_number && <p>Confirmation #: {r.confirmation_number}</p>}
                {r.phone_for_manual_booking && <p>Call to book: {r.phone_for_manual_booking}</p>}
                {r.error && <p style={{ color: "red" }}>Error: {r.error}</p>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
