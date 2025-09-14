"use client";
import React, { useState, useEffect } from 'react';
import { CustomerPreferences, DayAvailability, TimePreference } from '@/types/vapi';
import { CustomerPreferencesService } from '@/services/customerPreferences';

interface PreferencesManagerProps {
  userId: string;
  onClose: () => void;
}

export const PreferencesManager: React.FC<PreferencesManagerProps> = ({ userId, onClose }) => {
  const [preferences, setPreferences] = useState<CustomerPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [userId]);

  const loadPreferences = () => {
    setLoading(true);
    let prefs = CustomerPreferencesService.getPreferences(userId);
    if (!prefs) {
      prefs = CustomerPreferencesService.createDefaultPreferences(userId);
    }
    setPreferences(prefs);
    setLoading(false);
  };

  const savePreferences = async () => {
    if (!preferences) return;
    
    setSaving(true);
    CustomerPreferencesService.savePreferences(preferences);
    setSaving(false);
  };

  const updatePreference = (key: keyof CustomerPreferences, value: any) => {
    if (!preferences) return;
    setPreferences({ ...preferences, [key]: value });
  };

  const updateDayAvailability = (dayIndex: number, updates: Partial<DayAvailability>) => {
    if (!preferences) return;
    const newAvailability = [...preferences.weekly_availability];
    newAvailability[dayIndex] = { ...newAvailability[dayIndex], ...updates };
    updatePreference('weekly_availability', newAvailability);
  };

  const addTimePreference = (dayIndex: number) => {
    if (!preferences) return;
    const newAvailability = [...preferences.weekly_availability];
    newAvailability[dayIndex].preferred_times.push({ start_time: '18:00', end_time: '20:00' });
    updatePreference('weekly_availability', newAvailability);
  };

  const removeTimePreference = (dayIndex: number, timeIndex: number) => {
    if (!preferences) return;
    const newAvailability = [...preferences.weekly_availability];
    newAvailability[dayIndex].preferred_times.splice(timeIndex, 1);
    updatePreference('weekly_availability', newAvailability);
  };

  const updateTimePreference = (dayIndex: number, timeIndex: number, updates: Partial<TimePreference>) => {
    if (!preferences) return;
    const newAvailability = [...preferences.weekly_availability];
    newAvailability[dayIndex].preferred_times[timeIndex] = {
      ...newAvailability[dayIndex].preferred_times[timeIndex],
      ...updates
    };
    updatePreference('weekly_availability', newAvailability);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-center">Loading preferences...</p>
        </div>
      </div>
    );
  }

  if (!preferences) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2>Dining Preferences</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              ×
            </button>
          </div>

          <div className="p-6 space-y-8">
            {/* Basic Preferences */}
            <section>
              <h1 className="mb-4">Basic Preferences</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Preferred Party Size</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={preferences.preferred_party_size}
                    onChange={(e) => updatePreference('preferred_party_size', parseInt(e.target.value))}
                    className="w-full p-3 border border-gray-300 rounded-md bg-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Booking Lead Time (days)</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={preferences.preferred_booking_lead_time_days}
                    onChange={(e) => updatePreference('preferred_booking_lead_time_days', parseInt(e.target.value))}
                    className="w-full p-3 border border-gray-300 rounded-md bg-input"
                  />
                </div>
              </div>
            </section>

            {/* Weekly Availability */}
            <section>
              <h1 className="mb-4">Weekly Availability</h1>
              <div className="space-y-4">
                {preferences.weekly_availability.map((day, dayIndex) => (
                  <div key={day.day} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={day.available}
                          onChange={(e) => updateDayAvailability(dayIndex, { available: e.target.checked })}
                          className="mr-3"
                        />
                        <span className="font-medium capitalize">{day.day}</span>
                      </div>
                      {day.available && (
                        <button
                          onClick={() => addTimePreference(dayIndex)}
                          className="text-accent hover:text-secondary text-sm"
                        >
                          + Add Time
                        </button>
                      )}
                    </div>
                    
                    {day.available && (
                      <div className="space-y-2">
                        {day.preferred_times.map((time, timeIndex) => (
                          <div key={timeIndex} className="flex items-center space-x-2">
                            <input
                              type="time"
                              value={time.start_time}
                              onChange={(e) => updateTimePreference(dayIndex, timeIndex, { start_time: e.target.value })}
                              className="p-2 border border-gray-300 rounded bg-input"
                            />
                            <span>to</span>
                            <input
                              type="time"
                              value={time.end_time}
                              onChange={(e) => updateTimePreference(dayIndex, timeIndex, { end_time: e.target.value })}
                              className="p-2 border border-gray-300 rounded bg-input"
                            />
                            {day.preferred_times.length > 1 && (
                              <button
                                onClick={() => removeTimePreference(dayIndex, timeIndex)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Cuisine & Dietary */}
            <section>
              <h1 className="mb-4">Cuisine & Dietary</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Preferred Cuisines</label>
                  <input
                    type="text"
                    placeholder="Italian, Mexican, Asian (comma separated)"
                    value={preferences.preferred_cuisine_types.join(', ')}
                    onChange={(e) => updatePreference('preferred_cuisine_types', 
                      e.target.value.split(',').map(s => s.trim()).filter(s => s)
                    )}
                    className="w-full p-3 border border-gray-300 rounded-md bg-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Dietary Restrictions</label>
                  <input
                    type="text"
                    placeholder="Vegetarian, Gluten-free (comma separated)"
                    value={preferences.dietary_restrictions.join(', ')}
                    onChange={(e) => updatePreference('dietary_restrictions', 
                      e.target.value.split(',').map(s => s.trim()).filter(s => s)
                    )}
                    className="w-full p-3 border border-gray-300 rounded-md bg-input"
                  />
                </div>
              </div>
            </section>

            {/* Location Preferences */}
            <section>
              <h1 className="mb-4">Location Preferences</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Preferred Cities</label>
                  <input
                    type="text"
                    placeholder="Toronto, New York, San Francisco"
                    value={preferences.preferred_cities.join(', ')}
                    onChange={(e) => updatePreference('preferred_cities', 
                      e.target.value.split(',').map(s => s.trim()).filter(s => s)
                    )}
                    className="w-full p-3 border border-gray-300 rounded-md bg-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Max Travel Distance (miles)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={preferences.max_travel_distance_miles}
                    onChange={(e) => updatePreference('max_travel_distance_miles', parseInt(e.target.value))}
                    className="w-full p-3 border border-gray-300 rounded-md bg-input"
                  />
                </div>
              </div>
            </section>

            {/* Booking Preferences */}
            <section>
              <h1 className="mb-4">Booking Preferences</h1>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Accept bookings requiring deposits</span>
                  <input
                    type="checkbox"
                    checked={preferences.accepts_deposits}
                    onChange={(e) => updatePreference('accepts_deposits', e.target.checked)}
                    className="toggle"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>Booking confirmations</span>
                  <input
                    type="checkbox"
                    checked={preferences.booking_confirmations}
                    onChange={(e) => updatePreference('booking_confirmations', e.target.checked)}
                    className="toggle"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>Reminder notifications</span>
                  <input
                    type="checkbox"
                    checked={preferences.reminder_notifications}
                    onChange={(e) => updatePreference('reminder_notifications', e.target.checked)}
                    className="toggle"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={savePreferences}
              disabled={saving}
              className="px-6 py-3 bg-accent hover:bg-secondary text-white rounded-md disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
