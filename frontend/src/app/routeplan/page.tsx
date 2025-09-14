'use client';

import React from 'react';

interface Location {
  id: string;
  name: string;
  rating: number;
  category: string;
}

const locations: Location[] = [
  { id: '1', name: 'Central Park', rating: 4.8, category: 'Park' },
  { id: '2', name: 'Times Square', rating: 4.2, category: 'Landmark' },
  { id: '3', name: 'Brooklyn Bridge', rating: 4.7, category: 'Bridge' },
  { id: '4', name: 'Statue of Liberty', rating: 4.6, category: 'Monument' },
];

function LocationCard({ location, isStart = false, isEnd = false }: { 
  location: Location; 
  isStart?: boolean; 
  isEnd?: boolean; 
  
}) {
  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-xl shadow-sm border border-gray-200 min-w-[140px]">
      <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mb-2">
        <span className="text-white font-bold text-lg">
          {isStart ? 'A' : isEnd ? 'B' : '•'}
        </span>
      </div>
      <h3 className="text-darktext text-center mb-1">
        {location.name}
      </h3>
      <div className="flex items-center gap-1">
        <span className="text-yellow-500">★</span>
        <span className="text-xs text-gray-600">{location.rating}</span>
      </div>
      <span className="text-xs text-gray-500 mt-1">{location.category}</span>
    </div>
  );
}

function TravelArrow({ travelTime }: { travelTime: number }) {
  return (
    <div className="flex flex-col items-center py-2">
      <div className="flex items-center">
        <div className="w-px h-8 bg-gray-400"></div>
      </div>
      <div className="text-xs text-gray-600 font-medium bg-white px-2 py-1 rounded border">
        {travelTime} min
      </div>
      <div className="flex items-center">
        <div className="w-px h-8 bg-gray-400"></div>
      </div>
    </div>
  );
}


export default function RoutePlanPage() {
  // Calculate travel time between locations (mock calculation)
  const calculateTravelTime = (from: Location, to: Location): number => {
    // Simple mock calculation based on location names
    const baseTime = 15;
    const variation = Math.abs(from.id.charCodeAt(0) - to.id.charCodeAt(0)) * 2;
    return baseTime + variation;
  };

  return (
    <div className="flex flex-col items-center py-6 px-8 gap-4 bg-bglight rounded-2xl border border-cardborder">
      {locations.map((location, index) => (
        <React.Fragment key={location.id}>
          <LocationCard 
            location={location} 
            isStart={index === 0}
            isEnd={index === locations.length - 1}
          />
          
          {index < locations.length - 1 && (
            <TravelArrow
              travelTime={calculateTravelTime(location, locations[index + 1])}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}