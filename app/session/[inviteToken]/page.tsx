"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DualChatInterface } from "@/components/chat/dual-chat-interface";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Users, Clock, AlertCircle, CheckCircle } from "lucide-react";
import type { SessionWithUsers } from "@/lib/types";

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const inviteToken = params.inviteToken as string;

  const [session, setSession] = useState<SessionWithUsers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [partnerName, setPartnerName] = useState("");
  const [joining, setJoining] = useState(false);
  const [userRole, setUserRole] = useState<"A" | "B" | null>(null);
  const [needsToJoin, setNeedsToJoin] = useState(false);

  useEffect(() => {
    fetchSession();
  }, [inviteToken]);

  const fetchSession = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/session?inviteToken=${inviteToken}`);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 404) {
          setError("Session not found. The link may be invalid or expired.");
        } else if (response.status === 410) {
          setError("This session has expired.");
        } else {
          setError(data.error || "Failed to load session");
        }
        return;
      }

      setSession(data);

      // Determine user role and if they need to join
      if (data.userBJoined) {
        // Both users joined - need to determine which role this user should take
        // For simplicity, we'll let them choose or default to A
        setUserRole("A");
        setNeedsToJoin(false);
      } else {
        // Partner B hasn't joined yet
        setUserRole("B");
        setNeedsToJoin(true);
      }
    } catch (err) {
      setError("Failed to connect to the session. Please try again.");
      console.error("Error fetching session:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSession = async () => {
    if (!partnerName.trim()) {
      setError("Please enter your name");
      return;
    }

    try {
      setJoining(true);
      setError(null);

      const response = await fetch(`/api/session/${inviteToken}/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          partnerName: partnerName.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setError("This session is already full. Only two people can join.");
        } else {
          setError(data.error || "Failed to join session");
        }
        return;
      }

      setSession(data.session);
      setUserRole(data.partnerRole);
      setNeedsToJoin(false);
    } catch (err) {
      setError("Failed to join session. Please try again.");
      console.error("Error joining session:", err);
    } finally {
      setJoining(false);
    }
  };

  const getCurrentUserId = (): string => {
    if (!session || !userRole) return "";

    if (session.isAnonymous) {
      return userRole === "A" ? "anonymous-user-a" : "anonymous-user-b";
    }

    return userRole === "A" ? session.userAId ?? "" : session.userBId ?? "";
  };

  const formatTimeRemaining = (expiresAt: Date) => {
    const now = new Date();
    const timeLeft = expiresAt.getTime() - now.getTime();
    const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    if (hoursLeft > 0) {
      return `${hoursLeft}h ${minutesLeft}m remaining`;
    } else if (minutesLeft > 0) {
      return `${minutesLeft}m remaining`;
    } else {
      return "Expires soon";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Session Error
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button
            onClick={() => router.push("/")}
            className="bg-pink-500 hover:bg-pink-600"
          >
            Back to Home
          </Button>
        </Card>
      </div>
    );
  }

  if (needsToJoin && session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <Users className="w-12 h-12 text-purple-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Join Session
            </h2>
            <p className="text-gray-600">
              {session.userAName} has invited you to a DramaBot session
            </p>
          </div>

          {session.expiresAt && (
            <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg mb-4">
              <Clock className="w-4 h-4" />
              {formatTimeRemaining(new Date(session.expiresAt))}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="partnerName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Your Name
              </label>
              <Input
                id="partnerName"
                type="text"
                placeholder="Enter your name"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoinSession()}
                maxLength={50}
              />
            </div>

            <Button
              onClick={handleJoinSession}
              disabled={joining || !partnerName.trim()}
              className="w-full bg-purple-500 hover:bg-purple-600"
            >
              {joining ? "Joining..." : "Join Session"}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (session && !needsToJoin) {
    return (
      <div className="relative">
        {session.expiresAt && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
            <div className="flex items-center justify-center gap-2 text-sm text-amber-700">
              <Clock className="w-4 h-4" />
              Anonymous session •{" "}
              {formatTimeRemaining(new Date(session.expiresAt))}
            </div>
          </div>
        )}

        <DualChatInterface
          session={session}
          currentUserId={getCurrentUserId()}
          isAnonymous={true}
          anonymousRole={userRole}
        />
      </div>
    );
  }

  return null;
}
