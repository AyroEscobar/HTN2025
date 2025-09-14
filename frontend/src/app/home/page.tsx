"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Hardcoded restaurant data
const hardcodedRestaurants = [
  {
    id: 1,
    name: "The Golden Spoon",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=200&fit=crop",
    distance: 2.3,
    rating: 4.5,
    cost: 2,
    cuisine: "Italian"
  },
  {
    id: 2,
    name: "Burger Palace",
    image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=300&h=200&fit=crop",
    distance: 1.8,
    rating: 4.2,
    cost: 1,
    cuisine: "American"
  },
  {
    id: 3,
    name: "Sakura Sushi",
    image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=300&h=200&fit=crop",
    distance: 3.1,
    rating: 4.8,
    cost: 3,
    cuisine: "Japanese"
  },
  {
    id: 4,
    name: "Café Mocha",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=300&h=200&fit=crop",
    distance: 0.9,
    rating: 4.3,
    cost: 1,
    cuisine: "Café"
  }
];

const HomePage: React.FC = () => {
  const [place, setPlace] = useState("");
  const [stops, setStops] = useState<{ lat: number; lng: number; name: string; travelTime?: number }[]>([]);
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
<<<<<<< HEAD
        
        // Add random travel time for demo purposes (5-25 minutes)
        const travelTime = Math.floor(Math.random() * 20) + 5;
        
        setStops([...stops, { lat, lng, name, travelTime }]);
=======
        setStops((s) => [...s, { lat, lng, name }]);
>>>>>>> cuawithgoogle
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

<<<<<<< HEAD
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <span key={i} className="text-yellow-400">★</span>
        ))}
        {hasHalfStar && <span className="text-yellow-400">☆</span>}
        {[...Array(emptyStars)].map((_, i) => (
          <span key={i} className="text-gray-300">★</span>
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating})</span>
      </div>
    );
  };

  const renderCostDollars = (cost: number) => {
    return (
      <div className="flex items-center">
        {[...Array(cost)].map((_, i) => (
          <span key={i} className="text-green-600">$</span>
        ))}
        {[...Array(3 - cost)].map((_, i) => (
          <span key={i} className="text-gray-300">$</span>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-bglight">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-border">
        {/* Top row with logo, search, and add stop */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex-shrink-0">
              <h1 className="text-2xl font-bold text-accent">RouteStop</h1>
            </div>
            
            {/* Search Bar */}
            <div className="flex-1 max-w-2xl mx-8">
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter a place name to add as a stop"
                  className="flex-1"
                  disabled={isSearching}
                />
                <Button 
                  onClick={geocodePlace}
                  disabled={isSearching || !place.trim()}
                  className="bg-accent hover:bg-accent/90"
                >
                  {isSearching ? "Searching..." : "Add Stop"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters row */}
        <div className="bg-bgcontainer border-t border-border">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-darktext">Type:</label>
                <Input
                  type="text"
                  value={desiredType}
                  onChange={(e) => setDesiredType(e.target.value)}
                  placeholder="e.g. restaurant, cafe, gas_station"
                  className="w-48"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-darktext">Keyword:</label>
                <Input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="e.g. coffee, pizza, scenic"
                  className="w-48"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-darktext">Max Time (min):</label>
                <Input
                  type="number"
                  value={timeConstraintMinutes}
                  onChange={(e) =>
                    setTimeConstraintMinutes(e.target.value ? Number(e.target.value) : "")
                  }
                  placeholder="30"
                  className="w-24"
                />
              </div>
            </div>
          </div>
=======
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
>>>>>>> cuawithgoogle
        </div>
      </header>

<<<<<<< HEAD
      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Current Stops Section - Vertical Layout with Arrows */}
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-darktext mb-6">Current Stops ({stops.length})</h2>
          
          {stops.length === 0 ? (
            <div className="bg-white rounded-lg border border-cardborder p-8 shadow-sm">
              <p className="text-muted-foreground text-lg">No stops added yet</p>
              <p className="text-sm text-muted-foreground mt-2">Use the search bar above to add your first stop</p>
            </div>
          ) : (
            <div className="max-w-md mx-auto">
              {stops.map((stop, i) => (
                <div key={i} className="relative">
                  {/* Stop Card */}
                  <div className="bg-white rounded-lg border border-cardborder shadow-sm p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center font-semibold text-sm">
                          {i + 1}
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-darktext">{stop.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="destructive"
                        size="sm"
                        onClick={() => removeStop(i)}
                      >
                        Remove
                      </Button>
=======
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
>>>>>>> cuawithgoogle
                    </div>
                  </div>

                  {/* Arrow with travel time (only if not the last stop) */}
                  {i < stops.length - 1 && (
                    <div className="flex flex-col items-center mb-4">
                      <div className="w-0.5 h-4 bg-gray-300"></div>
                      <div className="bg-accent text-white px-3 py-1 rounded-full text-xs font-medium">
                        {stop.travelTime || Math.floor(Math.random() * 20) + 5} min
                      </div>
                      <div className="w-0.5 h-4 bg-gray-300"></div>
                      <div className="text-accent text-lg">↓</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
<<<<<<< HEAD

        {/* Hardcoded Restaurant Tiles */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-darktext mb-6 text-center">Recommended Restaurants</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {hardcodedRestaurants.map((restaurant) => (
              <div key={restaurant.id} className="bg-white rounded-lg border border-cardborder shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <img 
                  src={restaurant.image} 
                  alt={restaurant.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-darktext">{restaurant.name}</h3>
                    <span className="text-sm text-muted-foreground">{restaurant.distance} km</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">{restaurant.cuisine}</p>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col gap-1">
                      {renderStars(restaurant.rating)}
                      {renderCostDollars(restaurant.cost)}
                    </div>
                    <Button size="sm" className="bg-accent hover:bg-accent/90">
                      Add to Route
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Find Stops Along Route Section - Centered at bottom */}
        <div className="text-center">
          <div className="bg-white rounded-lg border border-cardborder p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-darktext mb-4">Find Stops Along Route</h2>
            <p className="text-muted-foreground mb-6">
              Add at least 2 stops above, then click below to discover interesting places along your route
            </p>
            
            <Button 
              onClick={handleSubmit}
              disabled={stops.length < 2}
              size="lg"
              className="bg-accent hover:bg-accent/90 text-white px-8 py-3"
            >
              {stops.length < 2 
                ? `Add ${2 - stops.length} more stop${2 - stops.length === 1 ? '' : 's'} to continue`
                : "Find Stops Along Route"
              }
            </Button>
          </div>
        </div>

        {/* Results Section */}
        {response && (
          <div className="mt-12">
            <div className="bg-white rounded-lg border border-cardborder shadow-sm p-6">
              <h2 className="text-2xl font-bold text-darktext mb-6 text-center">Suggested Stops</h2>
              
              {response.error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 font-semibold">Error: {response.error}</p>
                </div>
              ) : (
                <div>
                  <div className="bg-bgcontainer rounded-lg p-4 mb-6">
                    <p className="text-center text-darktext">
                      <span className="font-semibold">Original Route Time:</span> {Math.round(response.route_summary?.original_total_travel_time_seconds / 60)} minutes
                    </p>
                  </div>
                  
                  {response.candidates && response.candidates.length > 0 ? (
                    <div className="space-y-4">
                      {response.candidates.map((candidate: any, i: number) => (
                        <div key={i} className="border border-cardborder rounded-lg p-6 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="text-xl font-semibold text-darktext">{candidate.name}</h3>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">+{Math.round(candidate.added_time_seconds / 60)} min</p>
                              <p className="text-sm font-medium text-darktext">{Math.round(candidate.total_travel_time_seconds / 60)} min total</p>
                            </div>
                          </div>
                          
                          <p className="text-muted-foreground mb-2">{candidate.vicinity}</p>
                          
                          {candidate.rating && (
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex items-center">
                                <span className="text-yellow-500">★</span>
                                <span className="ml-1 font-medium">{candidate.rating}/5</span>
                              </div>
                              <span className="text-sm text-muted-foreground">({candidate.user_ratings_total} reviews)</span>
                            </div>
                          )}
                          
                          {candidate.types && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {candidate.types.slice(0, 5).map((type: string, idx: number) => (
                                <span key={idx} className="px-2 py-1 bg-bgcontainer text-xs rounded-full text-darktext">
                                  {type.replace(/_/g, ' ')}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No suitable stops found along your route.</p>
                      <p className="text-sm text-muted-foreground mt-2">Try adjusting your filters or adding different stops.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
=======
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
>>>>>>> cuawithgoogle
    </div>
  );
};
export default HomePage;
