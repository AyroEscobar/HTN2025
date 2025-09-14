"use client";
import React, { useState } from 'react';
import { VapiButton } from '@/components/VapiButton';
import { PreferencesManager } from '@/components/PreferencesManager';
import { VapiOfferOptionsResponse } from '@/types/vapi';
import { CustomerPreferencesService } from '@/services/customerPreferences';

function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUserId] = useState('user_123'); // In real app, get from auth context

  // Hardcoded data as requested
  const previouslyVisited = [
    { id: 1, name: "Central Park", location: "New York, NY", lastVisited: "2 days ago" },
    { id: 2, name: "Golden Gate Bridge", location: "San Francisco, CA", lastVisited: "1 week ago" },
    { id: 3, name: "Times Square", location: "New York, NY", lastVisited: "3 days ago" },
    { id: 4, name: "Hollywood Sign", location: "Los Angeles, CA", lastVisited: "2 weeks ago" }
  ];

  const nearbyPlaces = [
    { id: 1, name: "Starbucks Coffee", location: "0.2 miles away", type: "Coffee Shop" },
    { id: 2, name: "McDonald's", location: "0.3 miles away", type: "Fast Food" },
    { id: 3, name: "Central Library", location: "0.5 miles away", type: "Library" },
    { id: 4, name: "City Park", location: "0.7 miles away", type: "Park" },
    { id: 5, name: "Gas Station", location: "0.4 miles away", type: "Gas Station" }
  ];

  const handleVapiResponse = (response: VapiOfferOptionsResponse) => {
    console.log("Received VAPI restaurant booking response:", response);
    // You can add additional handling here, like showing a notification
  };

  if (showProfile) {
    return (
      <div className="min-h-screen bg-bglight">
        <div className="bg-white shadow-sm p-4 flex items-center">
          <button 
            onClick={() => setShowProfile(false)}
            className="mr-4 p-2 hover:bg-gray-100 rounded-full"
          >
            ← Back
          </button>
          <h2>Profile & Settings</h2>
        </div>
        
        <div className="p-6 max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center mb-6">
              <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center text-white text-2xl font-bold mr-4">
                JD
              </div>
              <div>
                <h3>John Doe</h3>
                <p className="text-gray-600">john.doe@example.com</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h1 className="mb-2">Display Name</h1>
                <input 
                  type="text" 
                  defaultValue="John Doe"
                  className="w-full p-3 border border-gray-300 rounded-md bg-input"
                />
              </div>
              
              <div>
                <h1 className="mb-2">Email</h1>
                <input 
                  type="email" 
                  defaultValue="john.doe@example.com"
                  className="w-full p-3 border border-gray-300 rounded-md bg-input"
                />
              </div>
              
              <div>
                <h1 className="mb-2">Phone Number</h1>
                <input 
                  type="tel" 
                  defaultValue="+1 (555) 123-4567"
                  className="w-full p-3 border border-gray-300 rounded-md bg-input"
                />
              </div>
            </div>
            
            <div className="flex space-x-4 mt-6">
              <button className="bg-accent hover:bg-secondary text-white px-6 py-3 rounded-md">
                Save Changes
              </button>
              <button 
                onClick={() => setShowPreferences(true)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-md"
              >
                Dining Preferences
              </button>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="mb-4">Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Voice Assistant Notifications</span>
                <input type="checkbox" defaultChecked className="toggle" />
              </div>
              <div className="flex items-center justify-between">
                <span>Location Services</span>
                <input type="checkbox" defaultChecked className="toggle" />
              </div>
              <div className="flex items-center justify-between">
                <span>Dark Mode</span>
                <input type="checkbox" className="toggle" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bglight">
      {/* Header */}
      <header className="bg-white shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="mr-4 p-2 hover:bg-gray-100 rounded-md"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h2>TypeChuzz</h2>
        </div>
        
        <button 
          onClick={() => setShowProfile(true)}
          className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-white font-bold hover:bg-secondary transition-colors"
        >
          JD
        </button>
      </header>

      {/* Side Menu */}
      {isMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsMenuOpen(false)}
          />
          <div className="fixed left-0 top-0 h-full w-80 bg-white shadow-lg z-50 transform transition-transform">
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h2>Menu</h2>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">Menu items will be added here</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className="p-6 max-w-4xl mx-auto">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-4 pl-12 border border-gray-300 rounded-lg bg-input text-lg focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <svg 
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Voice Assistant */}
        <div className="mb-8 text-center">
          <VapiButton userId={currentUserId} onVapiResponse={handleVapiResponse} />
        </div>

        {/* Previously Visited Places */}
        <section className="mb-8">
          <h2 className="mb-4">Previously Visited</h2>
          <div className="flex overflow-x-auto space-x-4 pb-4">
            {previouslyVisited.map((place) => (
              <div key={place.id} className="flex-shrink-0 w-64 bg-white rounded-lg shadow-sm p-4 border border-gray-200">
                <h1 className="font-semibold mb-1">{place.name}</h1>
                <p className="text-gray-600 text-sm mb-2">{place.location}</p>
                <p className="text-accent text-xs">{place.lastVisited}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Nearby Suggestions */}
        <section>
          <h2 className="mb-4">Nearby Places</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nearbyPlaces.map((place) => (
              <div key={place.id} className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="font-semibold mb-1">{place.name}</h1>
                    <p className="text-gray-600 text-sm mb-1">{place.type}</p>
                    <p className="text-accent text-xs">{place.location}</p>
                  </div>
                  <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Preferences Manager Modal */}
      {showPreferences && (
        <PreferencesManager 
          userId={currentUserId} 
          onClose={() => setShowPreferences(false)} 
        />
      )}
    </div>
  );
}

export default HomePage;