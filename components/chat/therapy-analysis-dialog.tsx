"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, Heart, MessageSquare, TrendingUp, X } from "lucide-react";
import type { TherapyAnalysis, ToneAnalysis } from "@/lib/types";

interface TherapyAnalysisDialogProps {
  analysis: TherapyAnalysis;
  userAName: string;
  userBName: string;
  onClose: () => void;
}

function getToneColor(tone: ToneAnalysis["tone"]) {
  switch (tone) {
    case "calm":
    case "understanding":
      return "bg-green-100 text-green-800";
    case "hurt":
    case "confused":
      return "bg-yellow-100 text-yellow-800";
    case "defensive":
      return "bg-orange-100 text-orange-800";
    case "aggressive":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getReasonablenessColor(score: number) {
  if (score >= 8) return "text-green-600";
  if (score >= 6) return "text-yellow-600";
  if (score >= 4) return "text-orange-600";
  return "text-red-600";
}

function ToneCard({
  name,
  tone,
  isHigherReasonableness,
}: {
  name: string;
  tone: ToneAnalysis;
  isHigherReasonableness: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Heart className="w-4 h-4 text-pink-500" />
        <h4 className="font-semibold">{name}</h4>
        {isHigherReasonableness && (
          <Badge className="bg-green-100 text-green-800 text-xs">
            More Reasonable
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Tone:</span>
          <Badge className={getToneColor(tone.tone)}>{tone.tone}</Badge>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Emotion:</span>
          <span className="text-sm font-medium">{tone.emotion}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Intensity:</span>
          <div className="flex items-center gap-1">
            <div className="flex">
              {Array.from({ length: 10 }, (_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full mr-1 ${
                    i < tone.intensity
                      ? tone.intensity > 7
                        ? "bg-red-400"
                        : tone.intensity > 4
                        ? "bg-yellow-400"
                        : "bg-green-400"
                      : "bg-gray-200"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-medium ml-1">
              {tone.intensity}/10
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function TherapyAnalysisDialog({
  analysis,
  userAName,
  userBName,
  onClose,
}: TherapyAnalysisDialogProps) {
  const moreReasonableUser =
    analysis.reasonableness.userA > analysis.reasonableness.userB
      ? "A"
      : analysis.reasonableness.userB > analysis.reasonableness.userA
      ? "B"
      : null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  AI Therapy Analysis
                </h2>
                <p className="text-gray-600">
                  Professional relationship assessment
                </p>
              </div>
            </div>
            <Button
              variant="neutral"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Tone Analysis */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-purple-500" />
              <h3 className="text-lg font-semibold text-gray-800">
                Emotional Tone Analysis
              </h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <ToneCard
                name={userAName}
                tone={analysis.userATone}
                isHigherReasonableness={moreReasonableUser === "A"}
              />
              <ToneCard
                name={userBName}
                tone={analysis.userBTone}
                isHigherReasonableness={moreReasonableUser === "B"}
              />
            </div>
          </div>

          {/* Reasonableness Assessment */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-800">
                Reasonableness Assessment
              </h3>
            </div>
            <Card className="p-4">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1">
                    <span
                      className={getReasonablenessColor(
                        analysis.reasonableness.userA
                      )}
                    >
                      {analysis.reasonableness.userA}/10
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">{userAName}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold mb-1">
                    <span
                      className={getReasonablenessColor(
                        analysis.reasonableness.userB
                      )}
                    >
                      {analysis.reasonableness.userB}/10
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">{userBName}</div>
                </div>
              </div>
              <p className="text-sm text-gray-700">
                {analysis.reasonableness.analysis}
              </p>
            </Card>
          </div>

          {/* Professional Verdict */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="w-5 h-5 text-pink-500" />
              <h3 className="text-lg font-semibold text-gray-800">
                Professional Verdict
              </h3>
            </div>
            <Card className="p-4">
              <p className="text-gray-700 leading-relaxed">
                {analysis.verdict}
              </p>
            </Card>
          </div>

          {/* Detailed Explanation */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-800">
                Detailed Analysis
              </h3>
            </div>
            <Card className="p-4">
              <p className="text-gray-700 leading-relaxed">
                {analysis.explanation}
              </p>
            </Card>
          </div>

          {/* Compromise Suggestion */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-green-500" />
              <h3 className="text-lg font-semibold text-gray-800">
                Recommended Solution
              </h3>
            </div>
            <Card className="p-4 bg-green-50 border-green-200">
              <p className="text-gray-700 leading-relaxed">
                {analysis.compromise}
              </p>
            </Card>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              onClick={onClose}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
            >
              Continue Conversation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
