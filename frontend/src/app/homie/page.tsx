"use client"
import { Button } from '@/components/ui/button'
import { Calendar24 } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { ArrowRight, MapPin, Clock, Calendar, ArrowLeft } from 'lucide-react'
import React, { useState } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { jsonrepair } from "jsonrepair";
import Link from 'next/link'

interface Itinerary {
  stops: string[];
  desired_type: string;
  keyword: string;
  sample_every_m: number;
  search_radius: number;
  max_candidates: number;
  time_constraint_seconds: number;
}

function page() {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [activityType, setActivityType] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Function to generate itinerary using Gemini API directly
  const generateItinerary = async (): Promise<void> => {
    if (!activityType || !location || !startDate || !endDate) {
      setError('Please fill in all fields');
      return;
    }

    // Check for API key
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      setError('Gemini API key not configured. Please add NEXT_PUBLIC_GEMINI_API_KEY to your .env.local file.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Calculate duration in seconds
      const durationMs: number = endDate.getTime() - startDate.getTime();
      const durationSeconds: number = Math.floor(durationMs / 1000);
      const durationHours: number = Math.round(durationSeconds / 3600);

      // Create structured prompt for Gemini
      const prompt = `You are a travel itinerary planner. Create a detailed itinerary for a ${activityType} in ${location} from ${startDate.toLocaleString()} to ${endDate.toLocaleString()}.

Duration: ${durationHours} hours

IMPORTANT: Respond with ONLY a valid JSON object in this exact format with no additional text or markdown:

{
  "stops": ["specific address or landmark 1", "specific address or landmark 2", "specific address or landmark 3"],
  "desired_type": "appropriate_google_places_type",
  "keyword": "${activityType}",
  "sample_every_m": 1500,
  "search_radius": 1200,
  "max_candidates": 20,
  "time_constraint_seconds": ${Math.min(durationSeconds, 28800)}
}

Requirements:
- Include 3-6 real, specific stops in ${location} suitable for a ${activityType}
- Use actual addresses, landmark names, or well-known locations
- Choose appropriate desired_type from: restaurant, tourist_attraction, museum, park, shopping_mall, amusement_park, zoo, etc.
- Order stops logically for an efficient route
- Consider the ${durationHours}-hour timeframe

Respond with only the JSON object, no other text.`;

      // Initialize Gemini
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-pro",
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      });

      console.log('Calling Gemini API...');

      // Generate content
      const result = await model.generateContent(prompt);
      const response = await result.response;

      // Check if response was blocked or empty
      if (!response.candidates || response.candidates.length === 0) {
        throw new Error('No response generated. Content may have been blocked by safety filters.');
      }

      // Extract response text
      const responseText = response.text();
      if (!responseText) {
        throw new Error('Empty response from Gemini API');
      }

      console.log('Raw Gemini response:', responseText);

      // Clean the response text (remove markdown formatting if present)


      const cleanedText = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      let parsedItinerary: Itinerary;
      try {
        parsedItinerary = JSON.parse(cleanedText);
      } catch {
        parsedItinerary = JSON.parse(jsonrepair(cleanedText));
      }


      // Validate the parsed itinerary
      if (!parsedItinerary.stops || !Array.isArray(parsedItinerary.stops) || parsedItinerary.stops.length < 2) {
        throw new Error('Invalid itinerary format: insufficient stops');
      }

      if (!parsedItinerary.desired_type || !parsedItinerary.keyword) {
        throw new Error('Invalid itinerary format: missing required fields');
      }

      console.log('Successfully parsed itinerary:', parsedItinerary);
      setItinerary(parsedItinerary);

    } catch (err) {
      console.error('Error generating itinerary:', err);
      if (err instanceof Error) {
        if (err.message.includes('JSON')) {
          setError('Failed to parse itinerary response. Please try again.');
        } else {
          setError(`Failed to generate itinerary: ${err.message}`);
        }
      } else {
        setError('Failed to generate itinerary. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (): string => {
    if (!startDate || !endDate) return '';
    const hours: number = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  };

  // Remove a stop
  const removeStop = (index: number) => {
    if (!itinerary) return;
    const updatedStops = itinerary.stops.filter((_, i) => i !== index);
    setItinerary({ ...itinerary, stops: updatedStops });
  };



  // Regenerate a single stop
  const regenerateStop = async (index: number) => {
    if (!itinerary) return;
    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY!;
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

      const prompt = `Suggest one new stop in ${location} suitable for a ${activityType}. 
Respond with ONLY a valid JSON array of one string, no markdown.`;

      const result = await model.generateContent(prompt);
      const newStopText = result.response.text().trim();
      const cleaned = newStopText.replace(/```json|```/g, '').trim();

      const [newStop] = JSON.parse(cleaned);

      const updatedStops = itinerary.stops.map((s, i) =>
        i === index ? newStop : s
      );
      setItinerary({ ...itinerary, stops: updatedStops });
    } catch (err) {
      console.error("Error regenerating stop:", err);
      setError("Failed to regenerate stop. Try again.");
    }
  };

  const getGoogleMapsUrl = (): string => {
    if (!itinerary || itinerary.stops.length < 2) return "#";
    const base = "https://www.google.com/maps/dir/";

    const cleanedStops = itinerary.stops.map(s =>
      encodeURIComponent(
        s
          .replace(/, United States/i, "") // remove country
          .replace(/\s+/g, " ") // collapse extra spaces
          .trim()
      )
    );

    return base + cleanedStops.join("/");
  };

  const isFormValid = (): boolean => {
    return !!(activityType && location && startDate && endDate);
  };

  return (
    <div className='flex flex-col justify-center items-center min-h-[100vh] w-[100vw] bg-bgcontainer gap-6 p-4'>
      {/* Back Arrow */}
      <div className="absolute top-6 left-6">
        <Link href="/hoam">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ArrowLeft size={16} />
            Back to Home
          </Button>
        </Link>
      </div>

      <h3 className="text-2xl font-semibold">What are you planning?</h3>

      <div className="flex items-center py-4 px-8 gap-2 bg-bglight rounded-2xl border border-cardborder">
        <p className='whitespace-nowrap'>I am planning a</p>
        <Input
          type="text"
          placeholder="date"
          value={activityType}
          onChange={(e) => setActivityType(e.target.value)}
          className='border-2 border-accent focus-visible:border-accent'
        />
        <p className='whitespace-nowrap'>in</p>
        <Input
          type="text"
          placeholder="New York City"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className='border-2 border-accent focus-visible:border-accent'
        />
      </div>

      <div className="flex items-center py-4 px-8 gap-8 bg-bglight rounded-2xl border border-cardborder">
        <Calendar24 label='Start Time' date={startDate} setDate={setStartDate} />
        <p>-</p>
        <Calendar24 label='End Time' date={endDate} setDate={setEndDate} />
      </div>

      {startDate && endDate && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock size={16} />
          <span>Duration: {formatDuration()}</span>
        </div>
      )}

      {error && (
        <div className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <Button
        onClick={generateItinerary}
        disabled={loading || !isFormValid()}
        className='bg-accent px-16 py-4 cursor-crosshair disabled:opacity-50 disabled:cursor-not-allowed'
      >
        {loading ? 'Generating...' : 'Generate Itinerary'} <ArrowRight />
      </Button>

      {itinerary && (
        <div className="w-full max-w-3xl bg-bglight rounded-2xl border border-cardborder p-6 mt-4">
          <h4 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <MapPin size={20} />
            Your {activityType} Itinerary in {location}
          </h4>

          <div className="space-y-6">
            <div>
              <h5 className="font-medium mb-3 text-lg">Route Stops:</h5>
              <div className="space-y-2">
                {itinerary.stops.map((stop: string, index: number) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                    <div className="flex-shrink-0 w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <span className="text-sm flex-1">{stop}</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => regenerateStop(index)}
                      >
                        Regenerate
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeStop(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}

              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-white rounded-lg border">
                <span className="font-medium text-gray-600">Place Type:</span>
                <p className="capitalize">{itinerary.desired_type.replace('_', ' ')}</p>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <span className="font-medium text-gray-600">Activity:</span>
                <p>{itinerary.keyword}</p>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <span className="font-medium text-gray-600">Search Radius:</span>
                <p>{itinerary.search_radius}m</p>
              </div>
              <div className="p-3 bg-white rounded-lg border">
                <span className="font-medium text-gray-600">Time Budget:</span>
                <p>{Math.round(itinerary.time_constraint_seconds / 3600)}h {Math.round((itinerary.time_constraint_seconds % 3600) / 60)}m</p>
              </div>
            </div>
            <a
              href={getGoogleMapsUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block bg-green-600 text-white px-6 py-3 rounded-lg shadow hover:bg-green-700 transition"
            >
              View Full Route on Google Maps
            </a>

          </div>
        </div>
      )}
    </div>
  )
}

export default page
