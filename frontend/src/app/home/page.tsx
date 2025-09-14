"use client";
import React, { useState } from "react";

const App: React.FC = () => {
  const [place, setPlace] = useState("");
  const [stops, setStops] = useState<{ lat: number; lng: number; name: string }[]>([]);
  const [desiredType, setDesiredType] = useState("");
  const [keyword, setKeyword] = useState("");
  const [timeConstraintMinutes, setTimeConstraintMinutes] = useState<number | "">("");
  const [response, setResponse] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  const geocodePlace = async () => {
    if (!place.trim()) return;
    console.log("hi");

    setIsSearching(true);
    try {
      // Use your Flask backend instead of Google API directly
      const res = await fetch("http://127.0.0.1:5000/search_place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: place.trim() })
      });
      console.log("Geocoding response status:");
      const data = await res.json();
      console.log("Backend response:", data);

      if (data.status === "OK" && data.results && data.results.length > 0) {
        const result = data.results[0];
        const { lat, lng } = result.geometry.location;
        const name = result.name;
        
        setStops([...stops, { lat, lng, name }]);
        setPlace("");
        console.log("Added stop:", { lat, lng, name });
      } else {
        alert(`Place not found. Status: ${data.status || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Backend API error:", err);
      alert("Error reaching backend API. Make sure your Flask server is running on port 5000.");
    } finally {
      setIsSearching(false);
    }
  };

  const removeStop = (index: number) => {
    setStops(stops.filter((_, i) => i !== index));
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
      alert("Error reaching backend API");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      geocodePlace();
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px" }}>
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
        <button 
          type="button" 
          onClick={geocodePlace}
          disabled={isSearching || !place.trim()}
          style={{ padding: "8px 16px" }}
        >
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
                <button 
                  onClick={() => removeStop(i)}
                  style={{ marginLeft: "10px", padding: "2px 8px", color: "red" }}
                >
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
            <input
              type="text"
              value={desiredType}
              onChange={(e) => setDesiredType(e.target.value)}
              placeholder="e.g. restaurant, cafe, gas_station"
              style={{ marginLeft: "10px", padding: "4px", width: "200px" }}
            />
          </label>
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>
            Keyword:
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. coffee, pizza, scenic"
              style={{ marginLeft: "10px", padding: "4px", width: "200px" }}
            />
          </label>
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>
            Max Additional Time (minutes):
            <input
              type="number"
              value={timeConstraintMinutes}
              onChange={(e) =>
                setTimeConstraintMinutes(e.target.value ? Number(e.target.value) : "")
              }
              placeholder="e.g. 30"
              style={{ marginLeft: "10px", padding: "4px", width: "100px" }}
            />
          </label>
        </div>

        <button 
          type="submit" 
          style={{ padding: "10px 20px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px" }}
          disabled={stops.length < 2}
        >
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
              <p><strong>Original Route:</strong> {Math.round(response.route_summary?.original_total_travel_time_seconds / 60)} minutes</p>
              {response.candidates && response.candidates.length > 0 ? (
                <div>
                  <h4>Recommended Stops:</h4>
                  {response.candidates.map((candidate: any, i: number) => (
                    <div key={i} style={{ border: "1px solid #ccc", padding: "10px", margin: "10px 0", borderRadius: "4px" }}>
                      <h5>{candidate.name}</h5>
                      <p><strong>Location:</strong> {candidate.vicinity}</p>
                      <p><strong>Rating:</strong> {candidate.rating ? `${candidate.rating}/5 (${candidate.user_ratings_total} reviews)` : "No rating"}</p>
                      <p><strong>Additional Time:</strong> +{Math.round(candidate.added_time_seconds / 60)} minutes</p>
                      <p><strong>Total Trip Time:</strong> {Math.round(candidate.total_travel_time_seconds / 60)} minutes</p>
                      <p style={{ fontSize: "0.9em", color: "#666" }}>
                        <strong>Types:</strong> {candidate.types?.join(", ") || "N/A"}
                      </p>
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
    </div>
  );
};

export default App;