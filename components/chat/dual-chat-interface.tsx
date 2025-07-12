"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChatPanel } from "./chat-panel";
import { ConversationHistory } from "./conversation-history";
import { MessageBubble } from "./message-bubble";
import { TherapyAnalysisDialog } from "./therapy-analysis-dialog";
import { Send, Users, MessageSquare, Brain, Loader2 } from "lucide-react";
import type { Message, SessionWithUsers, TherapyAnalysis } from "@/lib/types";

interface DualChatInterfaceProps {
  session: SessionWithUsers;
  currentUserId: string;
  isAnonymous?: boolean;
  anonymousRole?: "A" | "B" | null;
}

export function DualChatInterface({
  session,
  currentUserId,
  isAnonymous = false,
  anonymousRole = null,
}: DualChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(session.messages || []);
  const [partnerAMessage, setPartnerAMessage] = useState("");
  const [partnerBMessage, setPartnerBMessage] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [showTherapyAnalysis, setShowTherapyAnalysis] = useState(false);
  const [therapyAnalysis, setTherapyAnalysis] =
    useState<TherapyAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Real-time polling state
  const [isPolling, setIsPolling] = useState(true);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageTimeRef = useRef<string | null>(null);

  // Handle both regular and anonymous sessions
  const isPartnerA = isAnonymous
    ? anonymousRole === "A"
    : currentUserId === session.userAId;
  const isPartnerB = isAnonymous
    ? anonymousRole === "B"
    : currentUserId === session.userBId;
  const currentPartner = isPartnerA ? "A" : "B";

  // Get display names for anonymous vs regular sessions
  const userAName = isAnonymous
    ? session.userAName || "Partner A"
    : session.userA?.name || "Partner A";
  const userBName = isAnonymous
    ? session.userBName || "Partner B"
    : session.userB?.name || "Partner B";

  // Update last message time when messages change
  useEffect(() => {
    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];
      lastMessageTimeRef.current =
        latestMessage.createdAt instanceof Date
          ? latestMessage.createdAt.toISOString()
          : new Date(latestMessage.createdAt).toISOString();
    }
  }, [messages]);

  // Polling function to fetch new messages
  const fetchNewMessages = async () => {
    try {
      const url = new URL("/api/messages", window.location.origin);
      url.searchParams.set("sessionId", session.id);

      // Only fetch messages newer than the last one we have
      if (lastMessageTimeRef.current) {
        url.searchParams.set("since", lastMessageTimeRef.current);
      }

      const response = await fetch(url.toString());
      if (!response.ok) {
        console.error("Failed to fetch new messages:", response.statusText);
        return;
      }

      const newMessages: Message[] = await response.json();

      if (newMessages.length > 0) {
        setMessages((prev) => {
          // Merge new messages, avoiding duplicates
          const existingIds = new Set(prev.map((msg) => msg.id));
          const uniqueNewMessages = newMessages.filter(
            (msg) => !existingIds.has(msg.id)
          );

          if (uniqueNewMessages.length > 0) {
            return [...prev, ...uniqueNewMessages];
          }
          return prev;
        });
      }
    } catch (error) {
      console.error("Error fetching new messages:", error);
    }
  };

  // Set up polling for new messages
  useEffect(() => {
    if (!isPolling) return;

    // Start polling every 2 seconds
    pollingIntervalRef.current = setInterval(fetchNewMessages, 2000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [isPolling, session.id]);

  // Stop polling when component unmounts
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Check if both partners have sent at least one message (for AI analysis availability)
  const hasPartnerAMessages = messages.some((msg) => msg.sender === "A");
  const hasPartnerBMessages = messages.some((msg) => msg.sender === "B");
  const bothPartnersHaveMessaged = hasPartnerAMessages && hasPartnerBMessages;

  // Check if there are enough messages for analysis (at least 2 messages from both partners)
  const canAnalyze = messages.length >= 2 && bothPartnersHaveMessaged;

  const handleSendMessage = async (content: string, sender: "A" | "B") => {
    if (!content.trim()) return;

    // Create optimistic message
    const newMessage: Message = {
      id: `temp-${Date.now()}`,
      sessionId: session.id,
      sender,
      content: content.trim(),
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);

    // Clear the input
    if (sender === "A") {
      setPartnerAMessage("");
    } else {
      setPartnerBMessage("");
    }

    // Send to API
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: session.id,
          sender,
          content: content.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const savedMessage = await response.json();

      // Replace optimistic message with saved message
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === newMessage.id ? { ...savedMessage } : msg
        )
      );
    } catch (error) {
      console.error("Failed to send message:", error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== newMessage.id));
      alert("Failed to send message. Please try again.");
    }
  };

  const handleGetAIAnalysis = async () => {
    if (!canAnalyze || isAnalyzing) return;

    setIsAnalyzing(true);
    console.log("Starting AI analysis for session:", session.id);
    console.log("Messages to analyze:", messages.length);

    try {
      const response = await fetch("/api/resolve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: session.id,
          messages: messages,
        }),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`
        );
      }

      const data = await response.json();
      console.log("AI Analysis response:", data);

      if (data.analysis) {
        setTherapyAnalysis(data.analysis);
        setShowTherapyAnalysis(true);
      } else {
        console.error("No analysis in response:", data);
        throw new Error("No analysis received from API");
      }
    } catch (error) {
      console.error("Failed to get AI analysis:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "string"
          ? error
          : "Unknown error";
      alert(
        `Sorry, there was an error getting the AI analysis: ${errorMessage}. Please check the console for more details.`
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmitForResolution = async () => {
    if (!bothPartnersHaveMessaged) return;

    // Use the same AI analysis function
    await handleGetAIAnalysis();
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm border-b border-pink-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-pink-100 rounded-full">
            <Users className="w-4 h-4 text-pink-600" />
            <span className="text-sm font-medium text-pink-700">
              {userAName} & {userBName}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="neutral"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            History
          </Button>

          {canAnalyze && (
            <Button
              onClick={handleGetAIAnalysis}
              disabled={isAnalyzing}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  Get AI Analysis
                </>
              )}
            </Button>
          )}

          {bothPartnersHaveMessaged && (
            <Button
              onClick={handleSubmitForResolution}
              disabled={isAnalyzing}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
            >
              Submit for Drama Resolution ✨
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Chat Interface */}
        <div className="flex flex-1">
          {/* Partner A Side */}
          <div className="flex-1 border-r border-pink-200">
            <ChatPanel
              partnerName={userAName}
              partnerLetter="A"
              messages={messages.filter((msg) => msg.sender === "A")}
              currentMessage={partnerAMessage}
              setCurrentMessage={setPartnerAMessage}
              onSendMessage={(content: string) =>
                handleSendMessage(content, "A")
              }
              disabled={!isPartnerA}
              isCurrentUser={isPartnerA}
              accentColor="pink"
            />
          </div>

          {/* Partner B Side */}
          <div className="flex-1">
            <ChatPanel
              partnerName={userBName}
              partnerLetter="B"
              messages={messages.filter((msg) => msg.sender === "B")}
              currentMessage={partnerBMessage}
              setCurrentMessage={setPartnerBMessage}
              onSendMessage={(content: string) =>
                handleSendMessage(content, "B")
              }
              disabled={!isPartnerB}
              isCurrentUser={isPartnerB}
              accentColor="purple"
            />
          </div>
        </div>

        {/* Conversation History Sidebar */}
        {showHistory && (
          <ConversationHistory
            messages={messages}
            session={session}
            onClose={() => setShowHistory(false)}
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="p-3 bg-white/80 backdrop-blur-sm border-t border-pink-200">
        <div className="flex items-center justify-center gap-4 text-sm">
          <div
            className={`flex items-center gap-2 ${
              hasPartnerAMessages ? "text-green-600" : "text-gray-400"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                hasPartnerAMessages ? "bg-green-500" : "bg-gray-300"
              }`}
            />
            {userAName} {hasPartnerAMessages ? "messaged" : "waiting..."}
          </div>
          <div
            className={`flex items-center gap-2 ${
              hasPartnerBMessages ? "text-green-600" : "text-gray-400"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                hasPartnerBMessages ? "bg-green-500" : "bg-gray-300"
              }`}
            />
            {userBName} {hasPartnerBMessages ? "messaged" : "waiting..."}
          </div>

          {canAnalyze && (
            <div className="text-purple-600 font-medium">
              💡 Ready for AI analysis
            </div>
          )}
        </div>
      </div>

      {/* Therapy Analysis Dialog */}
      {showTherapyAnalysis && therapyAnalysis && (
        <TherapyAnalysisDialog
          analysis={therapyAnalysis}
          userAName={userAName}
          userBName={userBName}
          onClose={() => setShowTherapyAnalysis(false)}
        />
      )}
    </div>
  );
}
