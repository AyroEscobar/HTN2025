// VAPI AI Restaurant Booking Response Types
export interface VapiVenue {
  name: string;
  city: string;
}

export interface VapiPolicy {
  deposit: number | null;
  cancel_window_hours: number;
  holds_card: boolean;
}

export interface VapiBookingOption {
  time_local: string;
  provider: string;
  table_note: string;
  policy: VapiPolicy;
}

export interface VapiAlternate {
  date: string;
  time_local: string;
  provider: string;
}

export interface VapiOfferOptionsResponse {
  type: "offer_options";
  venue: VapiVenue;
  party_size: number;
  date: string;
  options: VapiBookingOption[];
  alternates: VapiAlternate[];
}

// Customer Preferences Types
export interface TimePreference {
  start_time: string; // "HH:MM" format
  end_time: string;   // "HH:MM" format
}

export interface DayAvailability {
  day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  available: boolean;
  preferred_times: TimePreference[];
}

export interface CustomerPreferences {
  id: string;
  user_id: string;
  
  // Dining preferences
  preferred_party_size: number;
  preferred_cuisine_types: string[];
  dietary_restrictions: string[];
  
  // Time preferences
  weekly_availability: DayAvailability[];
  preferred_booking_lead_time_days: number; // How many days in advance they prefer to book
  
  // Location preferences
  preferred_cities: string[];
  max_travel_distance_miles: number;
  
  // Booking preferences
  preferred_providers: string[]; // e.g., ["opentable", "resy"]
  accepts_deposits: boolean;
  min_cancellation_window_hours: number;
  
  // Notification preferences
  booking_confirmations: boolean;
  reminder_notifications: boolean;
  reminder_hours_before: number;
  
  created_at: string;
  updated_at: string;
}

export interface BookingHistory {
  id: string;
  user_id: string;
  venue: VapiVenue;
  booking_date: string;
  party_size: number;
  selected_option: VapiBookingOption;
  booking_status: 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  created_at: string;
  updated_at: string;
}
