from typing import Union, Optional, List
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import asyncio

app = FastAPI()

# run this file by doing
# uv run fastapi dev main.py

# Pydantic models for request/response
class ReservationRequest(BaseModel):
    # Required fields
    party_size: int = Field(..., ge=1, le=20, description="Number of people (1-20)")
    date: str = Field(..., description="Reservation date (YYYY-MM-DD)")
    time: str = Field(..., description="Preferred time (e.g., '7:00 PM')")
    
    # Contact info (at least one required)
    name: Optional[str] = Field(None, description="Full name")
    first_name: Optional[str] = Field(None, description="First name")
    last_name: Optional[str] = Field(None, description="Last name")
    phone: Optional[str] = Field(None, description="Phone number")
    email: Optional[str] = Field(None, description="Email address")
    
    # Optional fields
    special_requests: Optional[str] = Field(None, description="Special requests or notes")
    dietary_restrictions: Optional[str] = Field(None, description="Dietary restrictions")
    occasion: Optional[str] = Field(None, description="Special occasion")
    seating_preference: Optional[str] = Field(None, description="Seating preference")
    accessibility_needs: Optional[str] = Field(None, description="Accessibility requirements")
    company_name: Optional[str] = Field(None, description="Company name for business reservations")

class PlaceData(BaseModel):
    name: str = Field(..., description="Restaurant name")
    vicinity: str = Field(..., description="Restaurant address/vicinity") 
    place_id: Optional[str] = Field(None, description="Google Places ID")
    rating: Optional[float] = Field(None, description="Restaurant rating")
    types: Optional[List[str]] = Field(None, description="Restaurant types")
    location: Optional[dict] = Field(None, description="Lat/lng coordinates")

class SingleReservationRequest(BaseModel):
    place_data: PlaceData
    reservation_details: ReservationRequest

class BatchReservationRequest(BaseModel):
    places_data: List[PlaceData] = Field(..., description="List of restaurants")
    reservation_details: ReservationRequest

class ReservationResponse(BaseModel):
    restaurant_name: str
    location: str
    status: str  # 'confirmed', 'requires_phone_call', 'no_availability', 'error', 'attempted'
    confirmation_number: Optional[str] = None
    phone_for_manual_booking: Optional[str] = None
    messages: List[str] = []
    timestamp: str
    error: Optional[str] = None

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}

@app.post("/email/{email_name}")
async def run_email_ai(email_name: str):
    from email_ai import loginmyemail
    await loginmyemail(email_name)

@app.post("/reservation/single", response_model=ReservationResponse)
async def make_single_reservation(request: SingleReservationRequest):
    """
    Make a reservation at a single restaurant
    
    Example usage:
    ```
    POST /reservation/single
    {
        "place_data": {
            "name": "11:59 Bar:Café",
            "vicinity": "70 Temperance St Unit 1, Toronto",
            "place_id": "ChIJ-7onLR01K4gRvTqT2wkjnCg"
        },
        "reservation_details": {
            "party_size": 4,
            "date": "2025-09-20",
            "time": "7:00 PM",
            "name": "John Smith",
            "phone": "(555) 123-4567",
            "email": "john@example.com"
        }
    }
    ```
    """
    try:
        from reservation_agent import make_single_reservation as make_reservation
        
        # Convert Pydantic models to dicts
        place_data_dict = request.place_data.model_dump()
        reservation_dict = request.reservation_details.model_dump()
        
        # Make the reservation
        result = await make_reservation(place_data_dict, reservation_dict)
        
        return ReservationResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reservation failed: {str(e)}")

@app.post("/reservation/batch", response_model=List[ReservationResponse])
async def make_batch_reservations(request: BatchReservationRequest):
    """
    Make reservations at multiple restaurants for trip planning
    
    Example usage:
    ```
    POST /reservation/batch
    {
        "places_data": [
            {
                "name": "11:59 Bar:Café",
                "vicinity": "70 Temperance St Unit 1, Toronto"
            },
            {
                "name": "Black wolf coffee", 
                "vicinity": "717 Bay St., Toronto"
            }
        ],
        "reservation_details": {
            "party_size": 6,
            "date": "2025-09-22",
            "time": "6:00 PM",
            "name": "Sarah Johnson",
            "phone": "(555) 987-6543",
            "occasion": "Group dinner"
        }
    }
    ```
    """
    try:
        from reservation_agent import ReservationAgent
        
        agent = ReservationAgent()
        
        # Convert Pydantic models to dicts
        places_data_list = [place.model_dump() for place in request.places_data]
        reservation_dict = request.reservation_details.model_dump()
        
        # Make batch reservations
        results = await agent.batch_make_reservations(places_data_list, reservation_dict)
        
        # Clean up
        await agent.cleanup()
        
        return [ReservationResponse(**result) for result in results]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch reservation failed: {str(e)}")

@app.get("/reservation/example-google-maps")
def get_example_google_maps_format():
    """
    Returns an example of the Google Maps API format that this service expects
    """
    return {
        "description": "Example format from Google Maps API that can be used with /reservation/single or /reservation/batch",
        "example_single_place": {
            "name": "11:59 Bar:Café",
            "vicinity": "70 Temperance St Unit 1, Toronto",
            "place_id": "ChIJ-7onLR01K4gRvTqT2wkjnCg",
            "rating": 4.6,
            "types": ["restaurant", "cafe", "bar"],
            "location": {"lat": 43.6504846, "lng": -79.3819953}
        },
        "example_reservation_request": {
            "party_size": 4,
            "date": "2025-09-20",
            "time": "7:00 PM", 
            "name": "John Smith",
            "phone": "(555) 123-4567",
            "email": "john@example.com",
            "special_requests": "Window seat if possible"
        }
    }

@app.get("/reservation/status-codes")
def get_reservation_status_codes():
    """
    Explains the different status codes returned by the reservation system
    """
    return {
        "status_codes": {
            "confirmed": "Reservation was successfully made and confirmed",
            "requires_phone_call": "Restaurant requires phone booking, phone number provided",
            "no_availability": "No availability found for requested time/date",
            "attempted": "Reservation was attempted but status unclear",
            "error": "Technical error occurred during reservation process"
        },
        "response_fields": {
            "confirmation_number": "Provided when status is 'confirmed'",
            "phone_for_manual_booking": "Provided when status is 'requires_phone_call'",
            "messages": "Detailed log of what the agent did",
            "error": "Error details when status is 'error'"
        }
    }

# Health check endpoint for monitoring
@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "restaurant-reservation-api"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)