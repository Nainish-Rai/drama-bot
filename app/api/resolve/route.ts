import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { prisma } from "@/lib/db";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface ToneAnalysis {
  tone:
    | "aggressive"
    | "defensive"
    | "hurt"
    | "calm"
    | "understanding"
    | "confused";
  emotion: string;
  intensity: number; // 1-10 scale
}

interface TherapyResponse {
  verdict: string;
  explanation: string;
  compromise: string;
  userATone: ToneAnalysis;
  userBTone: ToneAnalysis;
  reasonableness: {
    userA: number; // 1-10 scale (10 = most reasonable)
    userB: number;
    analysis: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    console.log("Resolve API called");

    // Check if GEMINI_API_KEY is available
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY environment variable is not set");
      return NextResponse.json(
        { error: "AI service not configured. Missing API key." },
        { status: 500 }
      );
    }

    const { sessionId, messages } = await request.json();
    console.log("Request data:", {
      sessionId,
      messagesCount: messages?.length,
    });

    if (!sessionId || !messages || !Array.isArray(messages)) {
      console.error("Invalid request data:", { sessionId, messages });
      return NextResponse.json(
        { error: "Missing required fields: sessionId and messages array" },
        { status: 400 }
      );
    }

    // Get session details for context
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        userA: true,
        userB: true,
      },
    });

    if (!session) {
      console.error("Session not found:", sessionId);
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    console.log("Session found:", {
      id: session.id,
      userA: session.userA?.name,
      userB: session.userB?.name,
      isAnonymous: session.isAnonymous,
    });

    // Format messages for analysis
    const conversationText = messages
      .map((msg: any) => {
        let senderName: string;
        if (msg.sender === "A") {
          senderName = session.userA?.name ?? session.userAName ?? "User A";
        } else {
          senderName = session.userB?.name ?? session.userBName ?? "User B";
        }
        return `${senderName}: ${msg.content}`;
      })
      .join("\n");

    console.log("Conversation text length:", conversationText.length);

    // Handle both regular and anonymous sessions
    const userAName = session.userA?.name ?? session.userAName ?? "User A";
    const userBName = session.userB?.name ?? session.userBName ?? "User B";

    // Create the therapy prompt
    const therapyPrompt = `
You are an expert relationship therapist analyzing a conversation between two partners: ${userAName} (User A) and ${userBName} (User B).

CONVERSATION:
${conversationText}

Please analyze this conversation and provide:

1. TONE ANALYSIS for each person:
   - Determine their emotional tone (aggressive, defensive, hurt, calm, understanding, confused)
   - Identify the primary emotion they're expressing
   - Rate the intensity of their emotion (1-10 scale)

2. REASONABLENESS ASSESSMENT:
   - Rate each person's reasonableness (1-10 scale, where 10 = most reasonable)
   - Provide analysis of who is being more reasonable and why

3. THERAPEUTIC VERDICT:
   - A fair, balanced assessment of the situation
   - Who (if anyone) needs to take more responsibility
   - What the core issues are

4. COMPROMISE SUGGESTION:
   - A practical, fair solution that addresses both parties' concerns
   - Specific actionable steps both can take
   - Focus on healthy communication and understanding

Respond in this exact JSON format:
{
  "verdict": "Your therapeutic assessment...",
  "explanation": "Detailed explanation of the dynamics...",
  "compromise": "Specific compromise suggestion...",
  "userATone": {
    "tone": "calm|hurt|defensive|aggressive|understanding|confused",
    "emotion": "primary emotion",
    "intensity": 1-10
  },
  "userBTone": {
    "tone": "calm|hurt|defensive|aggressive|understanding|confused",
    "emotion": "primary emotion",
    "intensity": 1-10
  },
  "reasonableness": {
    "userA": 1-10,
    "userB": 1-10,
    "analysis": "Who is being more reasonable and why"
  }
}

Be empathetic, fair, and focus on healthy relationship dynamics. Don't take sides unfairly, but do call out unreasonable behavior when necessary. Use a warm but professional tone. 💕
`;

    console.log("Sending request to Gemini AI...");

    // Get AI response
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(therapyPrompt);
    const response = await result.response;
    const text = response.text();

    console.log("Gemini AI response received, length:", text.length);

    // Parse the JSON response
    let therapyAnalysis: TherapyResponse;
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("No JSON found in AI response:", text);
        throw new Error("No JSON found in response");
      }
      therapyAnalysis = JSON.parse(jsonMatch[0]);
      console.log("Successfully parsed AI analysis");
    } catch (parseError) {
      console.error("Failed to parse AI response:", text);
      console.error("Parse error:", parseError);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    // Store the resolution in the database
    const resolution = await prisma.resolution.create({
      data: {
        sessionId: sessionId,
        verdict: therapyAnalysis.verdict,
        compromise: therapyAnalysis.compromise,
      },
    });

    console.log("Resolution saved to database:", resolution.id);

    // Return the complete analysis
    return NextResponse.json({
      resolution,
      analysis: therapyAnalysis,
    });
  } catch (error) {
    console.error("Error in therapy analysis:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
