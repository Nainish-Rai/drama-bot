"use client";

import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";
import type { Message } from "@/lib/types";

interface MessageBubbleProps {
  message: Message;
  accentColor: "pink" | "purple";
}

type ToneType = "heated" | "caring" | "curious" | "excited" | "neutral";

export function MessageBubble({ message, accentColor }: MessageBubbleProps) {
  const colorClasses = {
    pink: {
      bubble: "bg-pink-100 border-pink-200",
      text: "text-pink-900",
      timestamp: "text-pink-600",
    },
    purple: {
      bubble: "bg-purple-100 border-purple-200",
      text: "text-purple-900",
      timestamp: "text-purple-600",
    },
  };

  const colors = colorClasses[accentColor];

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(date));
  };

  // Analyze message tone based on content (basic sentiment analysis)
  const analyzeTone = (content: string): ToneType => {
    const lowerContent = content.toLowerCase();

    // Positive indicators
    const positiveWords = [
      "love",
      "happy",
      "great",
      "awesome",
      "good",
      "thanks",
      "appreciate",
      "sorry",
      "understand",
    ];
    const hasPositive = positiveWords.some((word) =>
      lowerContent.includes(word)
    );

    // Negative indicators
    const negativeWords = [
      "hate",
      "angry",
      "mad",
      "upset",
      "wrong",
      "stupid",
      "never",
      "always",
    ];
    const hasNegative = negativeWords.some((word) =>
      lowerContent.includes(word)
    );

    // Question indicators
    const isQuestion =
      content.includes("?") ||
      lowerContent.startsWith("why") ||
      lowerContent.startsWith("what") ||
      lowerContent.startsWith("how");

    // Exclamation indicators
    const hasExclamation = content.includes("!");

    if (hasNegative) return "heated";
    if (hasPositive) return "caring";
    if (isQuestion) return "curious";
    if (hasExclamation) return "excited";
    return "neutral";
  };

  const tone = analyzeTone(message.content);

  const toneStyles: Record<ToneType, string> = {
    heated: "border-l-4 border-l-red-400 bg-red-50",
    caring: "border-l-4 border-l-green-400 bg-green-50",
    curious: "border-l-4 border-l-blue-400 bg-blue-50",
    excited: "border-l-4 border-l-yellow-400 bg-yellow-50",
    neutral: "border-l-4 border-l-gray-300 bg-gray-50",
  };

  const toneEmojis: Record<ToneType, string> = {
    heated: "🔥",
    caring: "💖",
    curious: "🤔",
    excited: "✨",
    neutral: "💬",
  };

  return (
    <Card
      className={`p-4 ${colors.bubble} ${toneStyles[tone]} transition-all hover:shadow-md`}
    >
      <div className="flex items-start gap-3">
        <div className="text-lg flex-shrink-0">{toneEmojis[tone]}</div>

        <div className="flex-1 min-w-0">
          <div className={`${colors.text} leading-relaxed break-words`}>
            {message.content}
          </div>

          <div className="flex items-center justify-between mt-2">
            <div
              className={`text-xs ${colors.timestamp} flex items-center gap-1`}
            >
              <Clock className="w-3 h-3" />
              {formatTime(message.createdAt)}
            </div>

            <div className="text-xs text-gray-500 capitalize">{tone} tone</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
