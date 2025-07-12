"use client";

import { useState } from "react";
import { DualChatInterface } from "@/components/chat/dual-chat-interface";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Users,
  MessageCircle,
  Sparkles,
  Link2,
  Copy,
  CheckCircle,
} from "lucide-react";
import type { SessionWithUsers, Message } from "@/lib/types";

// Demo data for testing the interface
const demoSession: SessionWithUsers = {
  id: "demo-session-1",
  userAId: "user-a",
  userBId: "user-b",
  isAnonymous: false,
  inviteToken: null,
  userAName: null,
  userBName: null,
  userAJoined: false,
  userBJoined: false,
  expiresAt: null,
  createdAt: new Date(),
  userA: {
    id: "user-a",
    name: "Alex",
    relationshipName: "Partner",
    createdAt: new Date(),
  },
  userB: {
    id: "user-b",
    name: "Jamie",
    relationshipName: "Partner",
    createdAt: new Date(),
  },
  messages: [
    {
      id: "msg-1",
      sessionId: "demo-session-1",
      sender: "A",
      content:
        "I really think we need to talk about what happened yesterday. I'm feeling hurt and confused about the whole situation.",
      createdAt: new Date(Date.now() - 60000 * 30), // 30 minutes ago
    },
    {
      id: "msg-2",
      sessionId: "demo-session-1",
      sender: "B",
      content:
        "I understand you're upset, but I don't think I did anything wrong. Can you help me understand what specifically bothered you?",
      createdAt: new Date(Date.now() - 60000 * 25), // 25 minutes ago
    },
    {
      id: "msg-3",
      sessionId: "demo-session-1",
      sender: "A",
      content:
        "When you cancelled our dinner plans last minute to hang out with your friends, it made me feel like I'm not a priority in your life.",
      createdAt: new Date(Date.now() - 60000 * 20), // 20 minutes ago
    },
    {
      id: "msg-4",
      sessionId: "demo-session-1",
      sender: "B",
      content:
        "I'm sorry that hurt you. I was excited to see my friends since they were only in town for one night, but I should have talked to you about it first.",
      createdAt: new Date(Date.now() - 60000 * 15), // 15 minutes ago
    },
  ] as Message[],
  resolutions: [],
};

export default function Home() {
  const [showDemo, setShowDemo] = useState(false);
  const [currentUser, setCurrentUser] = useState<"A" | "B">("A");
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [creatorName, setCreatorName] = useState("");
  const [creating, setCreating] = useState(false);
  const [sessionCreated, setSessionCreated] = useState<{
    inviteUrl: string;
    inviteToken: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreateSession = async () => {
    if (!creatorName.trim()) return;

    try {
      setCreating(true);
      const response = await fetch("/api/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          creatorName: creatorName.trim(),
          expirationHours: 24,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to create session");
        return;
      }

      setSessionCreated({
        inviteUrl: data.inviteUrl,
        inviteToken: data.inviteToken,
      });
    } catch (error) {
      console.error("Error creating session:", error);
      alert("Failed to create session. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!sessionCreated) return;

    try {
      await navigator.clipboard.writeText(sessionCreated.inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const resetSessionCreation = () => {
    setShowCreateSession(false);
    setSessionCreated(null);
    setCreatorName("");
    setCopied(false);
  };

  if (showDemo) {
    return (
      <DualChatInterface
        session={demoSession}
        currentUserId={
          currentUser === "A"
            ? demoSession.userAId ?? ""
            : demoSession.userBId ?? ""
        }
      />
    );
  }

  if (showCreateSession || sessionCreated) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md w-full">
          {!sessionCreated ? (
            <>
              <div className="text-center mb-6">
                <Link2 className="w-12 h-12 text-pink-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Create Anonymous Session
                </h2>
                <p className="text-gray-600">
                  Start a private session and share the link with your partner
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="creatorName"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Your Name
                  </label>
                  <Input
                    id="creatorName"
                    type="text"
                    placeholder="Enter your name"
                    value={creatorName}
                    onChange={(e) => setCreatorName(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleCreateSession()
                    }
                    maxLength={50}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateSession}
                    disabled={creating || !creatorName.trim()}
                    className="flex-1 bg-pink-500 hover:bg-pink-600"
                  >
                    {creating ? "Creating..." : "Create Session"}
                  </Button>
                  <Button
                    onClick={resetSessionCreation}
                    variant="default"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-6">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Session Created!
                </h2>
                <p className="text-gray-600">
                  Share this link with your partner to start chatting
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invite Link
                  </label>
                  <div className="flex gap-2">
                    <Input
                      value={sessionCreated.inviteUrl}
                      readOnly
                      className="flex-1 text-sm"
                    />
                    <Button
                      onClick={copyToClipboard}
                      size="sm"
                      className={copied ? "bg-green-500" : "bg-gray-500"}
                    >
                      {copied ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {copied && (
                    <p className="text-sm text-green-600 mt-1">
                      Copied to clipboard!
                    </p>
                  )}
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">
                    Next Steps:
                  </h3>
                  <ol className="text-sm text-blue-700 space-y-1">
                    <li>1. Copy the invite link above</li>
                    <li>2. Send it to your partner</li>
                    <li>3. Wait for them to join</li>
                    <li>4. Start your conversation!</li>
                  </ol>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() =>
                      window.open(sessionCreated.inviteUrl, "_blank")
                    }
                    className="flex-1 bg-purple-500 hover:bg-purple-600"
                  >
                    Join Session
                  </Button>
                  <Button
                    onClick={resetSessionCreation}
                    variant="default"
                    className="flex-1"
                  >
                    Create Another
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              DramaBot
            </h1>
          </div>

          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            A clean, minimal, and flirty-fun dual chat interface for resolving
            relationship drama with AI-powered mediation.
          </p>
        </div>

        {/* Anonymous Session Card */}
        <Card className="p-8 text-center bg-gradient-to-r from-pink-500 to-purple-500 text-white">
          <h2 className="text-2xl font-bold mb-4">Start Anonymous Session</h2>
          <p className="mb-6 opacity-90">
            Create a private session and invite your partner with a secure link.
            No registration required!
          </p>
          <Button
            onClick={() => setShowCreateSession(true)}
            className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
          >
            Create Session ✨
          </Button>
        </Card>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <Users className="w-8 h-8 text-pink-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-800 mb-2">
              Split-Screen Chat
            </h3>
            <p className="text-sm text-gray-600">
              Side-by-side chat layout for both partners
            </p>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <Link2 className="w-8 h-8 text-purple-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-800 mb-2">
              Anonymous Sessions
            </h3>
            <p className="text-sm text-gray-600">
              Share secure links without registration
            </p>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <Sparkles className="w-8 h-8 text-pink-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-800 mb-2">Tone Analysis</h3>
            <p className="text-sm text-gray-600">
              Color-coded message bubbles by sentiment
            </p>
          </Card>

          <Card className="p-6 text-center hover:shadow-lg transition-shadow">
            <MessageCircle className="w-8 h-8 text-purple-500 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-800 mb-2">Chat History</h3>
            <p className="text-sm text-gray-600">
              Reverse chronological conversation view
            </p>
          </Card>
        </div>

        {/* Demo Section */}
        <Card className="p-8 text-center bg-white/80 backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Try the Demo
          </h2>
          <p className="text-gray-600 mb-6">
            Experience the dual chat interface with sample conversation data.
            Choose which partner's perspective you'd like to view.
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4">
              <Button
                onClick={() => setCurrentUser("A")}
                className={
                  currentUser === "A" ? "bg-pink-500 hover:bg-pink-600" : ""
                }
              >
                View as Alex (Partner A)
              </Button>
              <Button
                onClick={() => setCurrentUser("B")}
                className={
                  currentUser === "B" ? "bg-purple-500 hover:bg-purple-600" : ""
                }
              >
                View as Jamie (Partner B)
              </Button>
            </div>

            <Button
              onClick={() => setShowDemo(true)}
              className="px-8 py-3 text-lg"
            >
              Launch Demo Interface
            </Button>
          </div>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          Built with Next.js 15, TypeScript, Tailwind CSS, and shadcn/ui
        </div>
      </div>
    </main>
  );
}
