# test_flask.py
import json
from app import app   # import the Flask app from route_helper.py

client = app.test_client()

# Mock input with two stops in Toronto
mock_request = {
    "stops": [
        {"lat": 43.6532, "lng": -79.3832},  # Toronto Downtown
        {"lat": 43.6426, "lng": -79.3871}   # CN Tower
    ],
    "desired_type": "cafe",    # optional
    "keyword": "coffee",       # optional
    "sample_every_m": 1500,
    "search_radius": 1200,
    "max_candidates": 5,
    "time_constraint_seconds": 1800
}

response = client.post(
    "/suggest_stops",
    data=json.dumps(mock_request),
    content_type="application/json"
)

print("Status:", response.status_code)
try:
    print("Response:", json.dumps(response.get_json(), indent=2))
except Exception:
    print("Response raw:", response.data.decode())
