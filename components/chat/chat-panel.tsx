"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { MessageBubble } from "./message-bubble";
import { Send, Smile } from "lucide-react";
import type { Message } from "@/lib/types";

interface ChatPanelProps {
  partnerName: string;
  partnerLetter: "A" | "B";
  messages: Message[];
  currentMessage: string;
  setCurrentMessage: (message: string) => void;
  onSendMessage: (content: string) => void;
  disabled: boolean;
  isCurrentUser: boolean;
  accentColor: "pink" | "purple";
}

export function ChatPanel({
  partnerName,
  partnerLetter,
  messages,
  currentMessage,
  setCurrentMessage,
  onSendMessage,
  disabled,
  isCurrentUser,
  accentColor,
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const colorClasses = {
    pink: {
      header: "bg-pink-100 border-pink-200",
      text: "text-pink-700",
      accent: "text-pink-600",
      button: "bg-pink-500 hover:bg-pink-600",
      input: "border-pink-200 focus:border-pink-400",
    },
    purple: {
      header: "bg-purple-100 border-purple-200",
      text: "text-purple-700",
      accent: "text-purple-600",
      button: "bg-purple-500 hover:bg-purple-600",
      input: "border-purple-200 focus:border-purple-400",
    },
  };

  const colors = colorClasses[accentColor];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentMessage.trim() && !disabled) {
      onSendMessage(currentMessage);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const addEmoji = (emoji: string) => {
    setCurrentMessage(currentMessage + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const commonEmojis = [
    "😊",
    "😂",
    "😍",
    "🤔",
    "😔",
    "😤",
    "❤️",
    "💔",
    "🔥",
    "✨",
    "👍",
    "👎",
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Partner Header */}
      <div className={`p-4 ${colors.header} border-b`}>
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full ${colors.button} flex items-center justify-center text-white font-bold text-lg`}
          >
            {partnerLetter}
          </div>
          <div>
            <h3 className={`font-semibold ${colors.text}`}>{partnerName}</h3>
            <p className="text-xs text-gray-500">
              {isCurrentUser
                ? "Your turn"
                : disabled
                ? "Waiting..."
                : "Ready to respond"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            {isCurrentUser
              ? "Start the conversation..."
              : "Waiting for response..."}
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              accentColor={accentColor}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-white/50">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Input
              ref={inputRef}
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                disabled
                  ? isCurrentUser
                    ? "You've already responded this round"
                    : "Not your turn to respond"
                  : "Type your message..."
              }
              disabled={disabled}
              className={`${colors.input} pr-12`}
              maxLength={500}
            />

            {!disabled && (
              <Button
                type="button"
                variant="neutral"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-auto"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Smile className="w-4 h-4 text-gray-400" />
              </Button>
            )}
          </div>

          {/* Emoji Picker */}
          {showEmojiPicker && !disabled && (
            <Card className="absolute bottom-full mb-2 p-3 bg-white shadow-lg z-10">
              <div className="grid grid-cols-6 gap-2">
                {commonEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => addEmoji(emoji)}
                    className="text-lg hover:bg-gray-100 rounded p-1 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </Card>
          )}

          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-400">
              {currentMessage.length}/500 characters
            </div>

            <Button
              type="submit"
              disabled={disabled || !currentMessage.trim()}
              className={`${colors.button} text-white flex items-center gap-2`}
              size="sm"
            >
              <Send className="w-4 h-4" />
              Send
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
