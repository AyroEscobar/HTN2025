"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

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

  const geocodePlace = async () => {
    if (!place.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch("http://127.0.0.1:5000/search_place", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: place.trim() })
      });
      
      const data = await res.json();

      if (data.status === "OK" && data.results && data.results.length > 0) {
        const result = data.results[0];
        const { lat, lng } = result.geometry.location;
        const name = result.name;
        
        // Add random travel time for demo purposes (5-25 minutes)
        const travelTime = Math.floor(Math.random() * 20) + 5;
        
        setStops([...stops, { lat, lng, name, travelTime }]);
        setPlace("");
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
              <h1 className="text-2xl font-bold text-accent">RouteIt</h1>
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
              {/* Advanced Search Link */}
              <div className="mt-2 text-center">
                <Link 
                  href="/homie" 
                  className="text-sm text-muted-foreground hover:text-accent transition-colors underline"
                >
                  Advanced Search
                </Link>
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
        </div>
      </header>

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
    </div>
  );
};

export default HomePage;
