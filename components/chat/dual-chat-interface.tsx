"use client";

import { useState, useEffect } from "react";
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
}

export function DualChatInterface({
  session,
  currentUserId,
}: DualChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(session.messages || []);
  const [partnerAMessage, setPartnerAMessage] = useState("");
  const [partnerBMessage, setPartnerBMessage] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [showTherapyAnalysis, setShowTherapyAnalysis] = useState(false);
  const [therapyAnalysis, setTherapyAnalysis] =
    useState<TherapyAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const isPartnerA = currentUserId === session.userAId;
  const isPartnerB = currentUserId === session.userBId;
  const currentPartner = isPartnerA ? "A" : "B";

  // Check if both partners have responded in current round
  const lastMessages = messages.slice(-2);
  const hasPartnerAResponded = lastMessages.some((msg) => msg.sender === "A");
  const hasPartnerBResponded = lastMessages.some((msg) => msg.sender === "B");
  const bothPartnersResponded = hasPartnerAResponded && hasPartnerBResponded;

  // Check if current user has already responded in this round
  const userHasResponded = lastMessages.some(
    (msg) => msg.sender === currentPartner
  );

  // Check if there are enough messages for analysis (at least 2 messages)
  const canAnalyze = messages.length >= 2;

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

    // TODO: Send to API
    try {
      // API call would go here
      console.log("Sending message:", newMessage);
    } catch (error) {
      console.error("Failed to send message:", error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== newMessage.id));
    }
  };

  const handleGetAIAnalysis = async () => {
    if (!canAnalyze || isAnalyzing) return;

    setIsAnalyzing(true);

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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.analysis) {
        setTherapyAnalysis(data.analysis);
        setShowTherapyAnalysis(true);
      } else {
        throw new Error("No analysis received from API");
      }
    } catch (error) {
      console.error("Failed to get AI analysis:", error);
      alert(
        "Sorry, there was an error getting the AI analysis. Please try again."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmitForResolution = async () => {
    if (!bothPartnersResponded) return;

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
              {session.userA.name} & {session.userB.name}
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

          {bothPartnersResponded && (
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
              partnerName={session.userA.name}
              partnerLetter="A"
              messages={messages.filter((msg) => msg.sender === "A")}
              currentMessage={partnerAMessage}
              setCurrentMessage={setPartnerAMessage}
              onSendMessage={(content: string) =>
                handleSendMessage(content, "A")
              }
              disabled={!isPartnerA || userHasResponded}
              isCurrentUser={isPartnerA}
              accentColor="pink"
            />
          </div>

          {/* Partner B Side */}
          <div className="flex-1">
            <ChatPanel
              partnerName={session.userB.name}
              partnerLetter="B"
              messages={messages.filter((msg) => msg.sender === "B")}
              currentMessage={partnerBMessage}
              setCurrentMessage={setPartnerBMessage}
              onSendMessage={(content: string) =>
                handleSendMessage(content, "B")
              }
              disabled={!isPartnerB || userHasResponded}
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
              hasPartnerAResponded ? "text-green-600" : "text-gray-400"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                hasPartnerAResponded ? "bg-green-500" : "bg-gray-300"
              }`}
            />
            {session.userA.name}{" "}
            {hasPartnerAResponded ? "responded" : "waiting..."}
          </div>
          <div
            className={`flex items-center gap-2 ${
              hasPartnerBResponded ? "text-green-600" : "text-gray-400"
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                hasPartnerBResponded ? "bg-green-500" : "bg-gray-300"
              }`}
            />
            {session.userB.name}{" "}
            {hasPartnerBResponded ? "responded" : "waiting..."}
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
          userAName={session.userA.name}
          userBName={session.userB.name}
          onClose={() => setShowTherapyAnalysis(false)}
        />
      )}
    </div>
  );
}
