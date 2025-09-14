import React, { useState, useEffect } from "react";
import Vapi from "@vapi-ai/web";
import { VapiOfferOptionsResponse } from "@/types/vapi";
import { CustomerPreferencesService } from "@/services/customerPreferences";

const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "");

interface VapiButtonProps {
  userId?: string;
  onVapiResponse?: (response: VapiOfferOptionsResponse) => void;
}

export const VapiButton: React.FC<VapiButtonProps> = ({ userId = "default_user", onVapiResponse }) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResponse, setLastResponse] = useState<VapiOfferOptionsResponse | null>(null);

  useEffect(() => {
    vapi.on("call-start", () => {
      setIsCallActive(true);
      setIsLoading(false);
    });

    vapi.on("call-end", () => {
      setIsCallActive(false);
      setIsLoading(false);
    });

    vapi.on("error", (error) => {
      console.error("VAPI Error:", error);
      setIsLoading(false);
      setIsCallActive(false);
    });

    // Listen for VAPI messages/responses
    vapi.on("message", (message) => {
      console.log("VAPI Message received:", message);
      
      // Check if this is a restaurant booking response
      if (message.type === "offer_options") {
        const response = message as VapiOfferOptionsResponse;
        setLastResponse(response);
        
        // Save to storage
        CustomerPreferencesService.saveVapiResponse(userId, response);
        
        // Call callback if provided
        if (onVapiResponse) {
          onVapiResponse(response);
        }
        
        console.log("Restaurant booking options received:", response);
      }
    });

    return () => {
      vapi.removeAllListeners();
    };
  }, [userId, onVapiResponse]);

  const startCall = async () => {
    if (!process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || !process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID) {
      console.error("VAPI environment variables not set");
      return;
    }

    setIsLoading(true);
    try {
      await vapi.start(process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID);
    } catch (err) {
      console.error("Error starting call:", err);
      setIsLoading(false);
    }
  };

  const endCall = () => {
    vapi.stop();
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <button
        onClick={isCallActive ? endCall : startCall}
        disabled={isLoading}
        className={`px-6 py-3 rounded-full font-medium transition-all duration-200 ${
          isCallActive
            ? "bg-red-500 hover:bg-red-600 text-white"
            : "bg-accent hover:bg-secondary text-white"
        } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {isLoading ? "Connecting..." : isCallActive ? "End Call" : "🎤 Start Voice Assistant"}
      </button>
      
      {lastResponse && (
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200 max-w-md">
          <h1 className="font-semibold mb-2">Latest Booking Options</h1>
          <p className="text-sm text-gray-600 mb-2">
            {lastResponse.venue.name} in {lastResponse.venue.city} for {lastResponse.party_size} people
          </p>
          <p className="text-xs text-accent">
            {lastResponse.options.length} options available on {lastResponse.date}
          </p>
        </div>
      )}
    </div>
  );
};
