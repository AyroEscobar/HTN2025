import { CustomerPreferences, DayAvailability, BookingHistory, VapiOfferOptionsResponse } from '@/types/vapi';

// Default customer preferences
const DEFAULT_PREFERENCES: Omit<CustomerPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  preferred_party_size: 2,
  preferred_cuisine_types: [],
  dietary_restrictions: [],
  weekly_availability: [
    { day: 'monday', available: true, preferred_times: [{ start_time: '18:00', end_time: '21:00' }] },
    { day: 'tuesday', available: true, preferred_times: [{ start_time: '18:00', end_time: '21:00' }] },
    { day: 'wednesday', available: true, preferred_times: [{ start_time: '18:00', end_time: '21:00' }] },
    { day: 'thursday', available: true, preferred_times: [{ start_time: '18:00', end_time: '21:00' }] },
    { day: 'friday', available: true, preferred_times: [{ start_time: '18:00', end_time: '22:00' }] },
    { day: 'saturday', available: true, preferred_times: [{ start_time: '17:00', end_time: '22:00' }] },
    { day: 'sunday', available: true, preferred_times: [{ start_time: '17:00', end_time: '21:00' }] },
  ],
  preferred_booking_lead_time_days: 3,
  preferred_cities: [],
  max_travel_distance_miles: 25,
  preferred_providers: ['opentable'],
  accepts_deposits: true,
  min_cancellation_window_hours: 2,
  booking_confirmations: true,
  reminder_notifications: true,
  reminder_hours_before: 2,
};

export class CustomerPreferencesService {
  private static readonly PREFERENCES_KEY = 'customer_preferences';
  private static readonly BOOKING_HISTORY_KEY = 'booking_history';
  private static readonly VAPI_RESPONSES_KEY = 'vapi_responses';

  // Customer Preferences Management
  static getPreferences(userId: string): CustomerPreferences | null {
    try {
      const stored = localStorage.getItem(this.PREFERENCES_KEY);
      if (!stored) return null;
      
      const allPreferences = JSON.parse(stored);
      return allPreferences[userId] || null;
    } catch (error) {
      console.error('Error getting customer preferences:', error);
      return null;
    }
  }

  static savePreferences(preferences: CustomerPreferences): void {
    try {
      const stored = localStorage.getItem(this.PREFERENCES_KEY);
      const allPreferences = stored ? JSON.parse(stored) : {};
      
      preferences.updated_at = new Date().toISOString();
      allPreferences[preferences.user_id] = preferences;
      
      localStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(allPreferences));
      console.log('Customer preferences saved:', preferences);
    } catch (error) {
      console.error('Error saving customer preferences:', error);
    }
  }

  static createDefaultPreferences(userId: string): CustomerPreferences {
    const now = new Date().toISOString();
    const preferences: CustomerPreferences = {
      id: `pref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      ...DEFAULT_PREFERENCES,
      created_at: now,
      updated_at: now,
    };
    
    this.savePreferences(preferences);
    return preferences;
  }

  static updatePreferences(userId: string, updates: Partial<CustomerPreferences>): CustomerPreferences | null {
    const existing = this.getPreferences(userId);
    if (!existing) return null;
    
    const updated = { ...existing, ...updates, updated_at: new Date().toISOString() };
    this.savePreferences(updated);
    return updated;
  }

  // Booking History Management
  static getBookingHistory(userId: string): BookingHistory[] {
    try {
      const stored = localStorage.getItem(this.BOOKING_HISTORY_KEY);
      if (!stored) return [];
      
      const allHistory = JSON.parse(stored);
      return allHistory[userId] || [];
    } catch (error) {
      console.error('Error getting booking history:', error);
      return [];
    }
  }

  static addBookingToHistory(booking: BookingHistory): void {
    try {
      const stored = localStorage.getItem(this.BOOKING_HISTORY_KEY);
      const allHistory = stored ? JSON.parse(stored) : {};
      
      if (!allHistory[booking.user_id]) {
        allHistory[booking.user_id] = [];
      }
      
      allHistory[booking.user_id].push(booking);
      localStorage.setItem(this.BOOKING_HISTORY_KEY, JSON.stringify(allHistory));
      console.log('Booking added to history:', booking);
    } catch (error) {
      console.error('Error adding booking to history:', error);
    }
  }

  // VAPI Response Management
  static saveVapiResponse(userId: string, response: VapiOfferOptionsResponse): void {
    try {
      const stored = localStorage.getItem(this.VAPI_RESPONSES_KEY);
      const allResponses = stored ? JSON.parse(stored) : {};
      
      if (!allResponses[userId]) {
        allResponses[userId] = [];
      }
      
      const responseWithTimestamp = {
        ...response,
        timestamp: new Date().toISOString(),
        id: `vapi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
      
      allResponses[userId].push(responseWithTimestamp);
      
      // Keep only last 50 responses per user
      if (allResponses[userId].length > 50) {
        allResponses[userId] = allResponses[userId].slice(-50);
      }
      
      localStorage.setItem(this.VAPI_RESPONSES_KEY, JSON.stringify(allResponses));
      console.log('VAPI response saved:', responseWithTimestamp);
    } catch (error) {
      console.error('Error saving VAPI response:', error);
    }
  }

  static getVapiResponses(userId: string): any[] {
    try {
      const stored = localStorage.getItem(this.VAPI_RESPONSES_KEY);
      if (!stored) return [];
      
      const allResponses = JSON.parse(stored);
      return allResponses[userId] || [];
    } catch (error) {
      console.error('Error getting VAPI responses:', error);
      return [];
    }
  }

  // Utility Methods
  static isTimeInPreferredRange(time: string, dayAvailability: DayAvailability): boolean {
    if (!dayAvailability.available) return false;
    
    const timeMinutes = this.timeToMinutes(time);
    return dayAvailability.preferred_times.some(range => {
      const startMinutes = this.timeToMinutes(range.start_time);
      const endMinutes = this.timeToMinutes(range.end_time);
      return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
    });
  }

  static getDayOfWeek(date: string): DayAvailability['day'] {
    const days: DayAvailability['day'][] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayIndex = new Date(date).getDay();
    return days[dayIndex];
  }

  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Analytics
  static getPreferencesSummary(userId: string): any {
    const preferences = this.getPreferences(userId);
    const history = this.getBookingHistory(userId);
    const responses = this.getVapiResponses(userId);
    
    return {
      preferences,
      totalBookings: history.length,
      recentBookings: history.slice(-5),
      totalVapiInteractions: responses.length,
      recentResponses: responses.slice(-3),
    };
  }
}
