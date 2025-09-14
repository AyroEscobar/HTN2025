from agent import ComputerAgent
from computer import Computer, VMProviderType
import asyncio
import webbrowser
import logging
import json
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import dotenv

dotenv.load_dotenv('/Users/ayroescobar/cua/notebooks/.env')

class ReservationAgent:
    """
    Agent for making restaurant reservations using CUA from Google Maps API place data
    """
    
    def __init__(self, model="anthropic/claude-sonnet-4-20250514", verbosity=logging.INFO):
        self.model = model
        self.verbosity = verbosity
        self.computer = None
        self.agent = None
    
    async def setup_computer(self):
        """Initialize the computer environment"""
        self.computer = Computer(
            provider_type=VMProviderType.DOCKER,
            os_type="linux"
        )
        await self.computer.run()
        
        # Open VNC in browser for monitoring (optional)
        webbrowser.open("http://localhost:8006/", new=0, autoraise=True)
        
        # Initialize agent
        self.agent = ComputerAgent(
            model=self.model,
            tools=[self.computer],
            verbosity=self.verbosity,
            only_n_most_recent_images=2
        )
    
    async def cleanup(self):
        """Clean up computer resources"""
        if self.computer:
            await self.computer.stop()
    
    def extract_place_info(self, place_data: Dict) -> Dict:
        """Extract key information from Google Maps API place data"""
        return {
            'name': place_data.get('name', ''),
            'vicinity': place_data.get('vicinity', ''),
            'place_id': place_data.get('place_id', ''),
            'rating': place_data.get('rating', 0),
            'user_ratings_total': place_data.get('user_ratings_total', 0),
            'types': place_data.get('types', []),
            'location': place_data.get('location', {}),
            'phone': place_data.get('formatted_phone_number', ''),
            'website': place_data.get('website', ''),
            'opening_hours': place_data.get('opening_hours', {})
        }
    
    def generate_search_queries(self, place_name: str, vicinity: str) -> List[str]:
        """Generate search queries to find the restaurant's reservation system"""
        queries = [
            f"{place_name} {vicinity} reservations",
            f"{place_name} {vicinity} book table online",
            f"{place_name} restaurant reservations",
            f"{place_name} OpenTable",
            f"{place_name} Resy",
            f"book table {place_name}"
        ]
        return queries
    
    def create_reservation_prompt(self, place_info: Dict, reservation_details: Dict) -> str:
        """Create a detailed prompt for the CUA agent to make a reservation"""
        
        place_name = place_info['name']
        vicinity = place_info['vicinity']
        
        # Extract reservation details
        party_size = reservation_details.get('party_size', 2)
        date = reservation_details.get('date', '')
        time = reservation_details.get('time', '')
        name = reservation_details.get('name', '')
        phone = reservation_details.get('phone', '')
        email = reservation_details.get('email', '')
        special_requests = reservation_details.get('special_requests', '')
        
        prompt = f"""
        I need you to make a restaurant reservation for {place_name} located at {vicinity}.
        
        Here are the reservation details:
        - Restaurant: {place_name}
        - Location: {vicinity}
        - Party size: {party_size} people
        - Date: {date}
        - Time: {time}
        - Name: {name}
        - Phone: {phone}
        - Email: {email}
        {f'- Special requests: {special_requests}' if special_requests else ''}
        
        Please follow these steps:
        
        1. First, search for "{place_name} {vicinity} reservations" in a web browser
        2. Look for the restaurant's official website or reservation platforms like:
           - OpenTable
           - Resy
           - Tock
           - The restaurant's own booking system
           - Yelp reservations
        
        3. Navigate to the reservation booking page
        
        4. Fill out the reservation form with the provided details:
           - Select the date: {date}
           - Select the time: {time}
           - Enter party size: {party_size}
           - Provide contact information (name, phone, email)
           - Add any special requests if there's a field for it
        
        5. Complete the reservation process by submitting the form
        
        6. If the reservation is successful, take a screenshot of the confirmation
        
        7. If the exact time is not available, try to find the closest available time within 30 minutes
        
        8. If no reservations are available for that date, check the next available date within a week
        
        9. If you encounter any issues or the restaurant doesn't accept online reservations:
           - Look for a phone number
           - Take note of it for manual calling later
           - Report back with the phone number and any relevant information
        
        Please be thorough and patient with form filling. Some reservation sites can be slow to load.
        Report back with the status of the reservation attempt.
        """
        
        return prompt
    
    async def make_reservation(self, place_data: Dict, reservation_details: Dict) -> Dict:
        """
        Main method to make a reservation using CUA
        
        Args:
            place_data: Data from Google Maps API
            reservation_details: Dict with reservation info (party_size, date, time, name, phone, email, etc.)
        
        Returns:
            Dict with reservation status and details
        """
        
        if not self.agent:
            await self.setup_computer()
        
        place_info = self.extract_place_info(place_data)
        prompt = self.create_reservation_prompt(place_info, reservation_details)
        
        print(f"Making reservation for {place_info['name']}...")
        print("User request:", prompt)
        
        reservation_result = {
            'restaurant_name': place_info['name'],
            'location': place_info['vicinity'],
            'status': 'pending',
            'confirmation_number': None,
            'phone_for_manual_booking': None,
            'messages': [],
            'timestamp': datetime.now().isoformat()
        }
        
        try:
            # Run the CUA agent
            async for result in self.agent.run(prompt):
                if result["output"] and result["output"][-1]["type"] == "message":
                    message = result["output"][-1]["content"][0]["text"]
                    print("Agent:", message)
                    reservation_result['messages'].append(message)
                    
                    # Parse agent response for success indicators
                    if any(keyword in message.lower() for keyword in ['confirmation', 'confirmed', 'reserved', 'booking confirmed']):
                        reservation_result['status'] = 'confirmed'
                        # Try to extract confirmation number
                        if 'confirmation' in message.lower():
                            # Simple regex to find confirmation numbers (alphanumeric patterns)
                            import re
                            conf_match = re.search(r'confirmation[^\w]*([A-Z0-9]{6,})', message, re.IGNORECASE)
                            if conf_match:
                                reservation_result['confirmation_number'] = conf_match.group(1)
                    
                    elif any(keyword in message.lower() for keyword in ['phone', 'call', 'contact']):
                        # Extract phone number for manual booking
                        import re
                        phone_match = re.search(r'(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})', message)
                        if phone_match:
                            reservation_result['phone_for_manual_booking'] = phone_match.group(1)
                            reservation_result['status'] = 'requires_phone_call'
                    
                    elif any(keyword in message.lower() for keyword in ['no availability', 'fully booked', 'not available']):
                        reservation_result['status'] = 'no_availability'
            
            # If status is still pending, mark as completed but unclear
            if reservation_result['status'] == 'pending':
                reservation_result['status'] = 'attempted'
                
        except Exception as e:
            print(f"Error making reservation: {str(e)}")
            reservation_result['status'] = 'error'
            reservation_result['error'] = str(e)
        
        return reservation_result
    
    async def batch_make_reservations(self, places_data: List[Dict], reservation_details: Dict) -> List[Dict]:
        """
        Make reservations for multiple restaurants
        
        Args:
            places_data: List of place data from Google Maps API
            reservation_details: Common reservation details for all places
            
        Returns:
            List of reservation results
        """
        
        results = []
        
        for place_data in places_data:
            try:
                result = await self.make_reservation(place_data, reservation_details)
                results.append(result)
                
                # Add delay between reservations to be respectful
                await asyncio.sleep(5)
                
            except Exception as e:
                print(f"Failed to process reservation for {place_data.get('name', 'Unknown')}: {str(e)}")
                results.append({
                    'restaurant_name': place_data.get('name', 'Unknown'),
                    'status': 'error',
                    'error': str(e),
                    'timestamp': datetime.now().isoformat()
                })
        
        return results


async def make_single_reservation(place_data: Dict, reservation_details: Dict):
    """
    Convenience function to make a single reservation
    """
    agent = ReservationAgent()
    try:
        result = await agent.make_reservation(place_data, reservation_details)
        return result
    finally:
        await agent.cleanup()


# Example usage with different levels of user information
if __name__ == "__main__":
    # Example place data from your Google Maps API response
    example_place_data = {
        "added_time_seconds": 105,
        "insert_between": [0, 1],
        "insert_leg_distance_to_sample_m": 386,
        "location": {"lat": 43.6504846, "lng": -79.3819953},
        "name": "11:59 Bar:Café",
        "place_id": "ChIJ-7onLR01K4gRvTqT2wkjnCg",
        "rating": 4.6,
        "total_travel_time_seconds": 629,
        "types": ["restaurant", "cafe", "bar", "store", "food", "point_of_interest", "establishment"],
        "user_ratings_total": 180,
        "vicinity": "70 Temperance St Unit 1, Toronto"
    }
    
    # Example 1: Minimal information (what the agent will work with)
    minimal_reservation = {
        "party_size": 4,
        "date": "2025-09-20",
        "time": "7:00 PM",
        "name": "John Smith",
        "phone": "(555) 123-4567"
    }
    
    # Example 2: Complete information (agent will use what's needed)
    complete_reservation = {
        "party_size": 2,
        "date": "2025-09-21",
        "time": "6:30 PM",
        "first_name": "Sarah",
        "last_name": "Johnson",
        "phone": "(555) 987-6543",
        "email": "sarah.johnson@example.com",
        "special_requests": "Celebrating anniversary",
        "dietary_restrictions": "Vegetarian options preferred",
        "seating_preference": "Quiet table",
        "occasion": "Anniversary dinner"
    }
    
    # Example 3: Corporate/Group reservation
    corporate_reservation = {
        "party_size": 8,
        "date": "2025-09-25",
        "time": "12:00 PM",
        "name": "Alex Chen",
        "company_name": "Tech Solutions Inc",
        "phone": "(555) 555-0123",
        "email": "alex.chen@techsolutions.com",
        "occasion": "Business lunch",
        "accessibility_needs": "Wheelchair accessible table needed"
    }
    
    print("Testing different reservation scenarios...")
    
    # Test with minimal info
    print("\\n=== Testing Minimal Information ===")
    asyncio.run(make_single_reservation(example_place_data, minimal_reservation))
    
    # Uncomment to test other scenarios:
    # print("\\n=== Testing Complete Information ===")
    # asyncio.run(make_single_reservation(example_place_data, complete_reservation))
    
    # print("\\n=== Testing Corporate Reservation ===")
    # asyncio.run(make_single_reservation(example_place_data, corporate_reservation))