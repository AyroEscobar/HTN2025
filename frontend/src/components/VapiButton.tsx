import React, { useState, useEffect } from "react";
import Vapi from "@vapi-ai/web";

const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "");

export const VapiButton: React.FC = () => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

    return () => {
      vapi.removeAllListeners();
    };
  }, []);

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
  );
};
