"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageBubble } from "./message-bubble";
import { X, Filter, Calendar } from "lucide-react";
import type { Message, SessionWithUsers } from "@/lib/types";

interface ConversationHistoryProps {
  messages: Message[];
  session: SessionWithUsers;
  onClose: () => void;
}

export function ConversationHistory({
  messages,
  session,
  onClose,
}: ConversationHistoryProps) {
  const [filterSender, setFilterSender] = useState<"all" | "A" | "B">("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Filter and sort messages
  const filteredMessages = messages
    .filter((msg) => filterSender === "all" || msg.sender === filterSender)
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};

    messages.forEach((message) => {
      const date = new Date(message.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return groups;
  };

  const messageGroups = groupMessagesByDate(filteredMessages);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  };

  const getMessageStats = () => {
    const partnerACount = messages.filter((msg) => msg.sender === "A").length;
    const partnerBCount = messages.filter((msg) => msg.sender === "B").length;
    return { partnerACount, partnerBCount };
  };

  const { partnerACount, partnerBCount } = getMessageStats();

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Conversation History
          </h3>
          <Button variant="neutral" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Card className="p-2 bg-pink-50 border-pink-200">
            <div className="text-xs text-pink-600">{session.userA.name}</div>
            <div className="text-lg font-bold text-pink-700">
              {partnerACount}
            </div>
            <div className="text-xs text-pink-600">messages</div>
          </Card>
          <Card className="p-2 bg-purple-50 border-purple-200">
            <div className="text-xs text-purple-600">{session.userB.name}</div>
            <div className="text-lg font-bold text-purple-700">
              {partnerBCount}
            </div>
            <div className="text-xs text-purple-600">messages</div>
          </Card>
        </div>

        {/* Filters */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Filter className="w-3 h-3 text-gray-500" />
            <span className="text-xs text-gray-600">Filter by sender:</span>
          </div>
          <div className="flex gap-1">
            <Button
              variant={filterSender === "all" ? "default" : "neutral"}
              size="sm"
              onClick={() => setFilterSender("all")}
              className="text-xs h-7"
            >
              All
            </Button>
            <Button
              variant={filterSender === "A" ? "default" : "neutral"}
              size="sm"
              onClick={() => setFilterSender("A")}
              className="text-xs h-7 bg-pink-500 hover:bg-pink-600 data-[state=open]:bg-pink-600"
            >
              {session.userA.name}
            </Button>
            <Button
              variant={filterSender === "B" ? "default" : "neutral"}
              size="sm"
              onClick={() => setFilterSender("B")}
              className="text-xs h-7 bg-purple-500 hover:bg-purple-600 data-[state=open]:bg-purple-600"
            >
              {session.userB.name}
            </Button>
          </div>

          <div className="flex gap-1">
            <Button
              variant={sortOrder === "newest" ? "default" : "neutral"}
              size="sm"
              onClick={() => setSortOrder("newest")}
              className="text-xs h-7"
            >
              Newest First
            </Button>
            <Button
              variant={sortOrder === "oldest" ? "default" : "neutral"}
              size="sm"
              onClick={() => setSortOrder("oldest")}
              className="text-xs h-7"
            >
              Oldest First
            </Button>
          </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm text-center">
            No messages found
            <br />
            <span className="text-xs">Try adjusting your filters</span>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(messageGroups).map(([date, dayMessages]) => (
              <div key={date}>
                <div className="sticky top-0 bg-white/90 backdrop-blur-sm py-2 mb-3">
                  <h4 className="text-xs font-medium text-gray-500 text-center border-b pb-1">
                    {formatDate(date)}
                  </h4>
                </div>
                <div className="space-y-3">
                  {dayMessages.map((message) => (
                    <MessageBubble
                      key={message.id}
                      message={message}
                      accentColor={message.sender === "A" ? "pink" : "purple"}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t bg-gray-50 text-xs text-gray-500 text-center">
        {filteredMessages.length} message
        {filteredMessages.length !== 1 ? "s" : ""} shown
      </div>
    </div>
  );
}
