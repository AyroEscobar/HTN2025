## Inspiration
Two weeks before Hack the North, our team took a quick trip to New York City with one day in the big city. With so little time, we were overwhelmed trying to decide where to eat, what to see, and how to make the most of the day. We realized that while everyone can do their own research, the process of comparing tabs, calling restaurants, and juggling reservations takes away from actually enjoying the trip that makes it out of the group chat. That’s when the idea for Routed was born, a platform to make sure every moment counts when you’re exploring somewhere new.

## What it does
Routed helps groups of friends (or solo adventurers) plan trips seamlessly by combining recommendations with action. It shows the best routes to explore based on food, activities, and experiences for the area you want to go and then goes one step further by automating the boring parts. Through our platform, you can:

- Discover great spots tailored to your trip.

- Reserve tables directly through partner websites, or automatically call ahead when needed.

- Use a voice AI that handles the logistics so you don’t waste time on hold or filling out forms.

It doesn’t matter where you go, if there’s a good route, we’ll show you, and make sure it’s booked and ready.
## How we built it
We built Routed as a full-stack project, bringing multiple technologies together:

- **Frontend:** React + Next.js for a smooth and responsive user experience.

- **Authentication & backend services:** Firebase for seamless user management.

- **Trip planning & routing:** Google Maps API to power location data and directions.

- **Reservations:** Cua with the Anthropic API to manage bookings through websites.

- **Voice automation:** VAPI powered by Gemini API to handle calls when online reservations aren’t available.

- **Servers & integration:** Flask and Linux environments to tie together multi-agent systems.

**Integration layer:** Windsurf helped bring all components into a cohesive product.

## Challenges we ran into
Like many planners, we ran into our fair share of troubles
- Integrating multiple APIs into one unified system that worked consistently.

- Balancing the frontend, backend, and AI services so the user experience felt smooth instead of fragmented.

- Running both Flask and Linux servers while keeping everything stable.

- Handling edge cases like when a restaurant only accepts calls, or when APIs conflicted.

- Managing our time between building, debugging, and designing the product.

## Accomplishments that we're proud of
Fully integrating two frameworks that none of us had ever touched before.

- Building a working system that connected web, voice, and AI in just a hackathon’s timeframe.

- Meeting incredible people at Hack the North and learning about Canada (a first for half of us!).

Creating something that grew out of a real-world pain point we experienced ourselves.

## What we learned
- How to integrate multi-language and multi-agent systems to collaborate on a single task.

- The importance of designing for the user flow, making complex technical systems feel effortless for the end user.

- Breaking down a big challenge into smaller parts so we could move fast as a team.

- The value of combining creativity with practicality, balancing fun ideas with usable features.

## What's next for Routed
Routed started with young travelers like us, but we quickly realized this idea applies to many groups:

- Parents planning a family day out without the stress.

- Solo adventurers who want to maximize their time exploring.

- Groups of coworkers looking for the perfect evening plan after work.

- Tourists visiting a city for just a few hours between flights.

**Future directions include:**

- Expanding integrations to platforms like Yelp, OpenTable, and Eventbrite.

- Offering AI-generated itineraries that adapt to user preferences in real time.

- Building a mobile app for even easier on-the-go planning.

- Enhancing group collaboration so everyone can “vote” on what they want to do.
