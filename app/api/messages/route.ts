import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

// GET - Fetch messages for a session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    const since = searchParams.get("since"); // Optional: only get messages after this timestamp

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Verify session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Build query conditions
    const whereConditions: any = {
      sessionId,
    };

    // If 'since' parameter is provided, only get newer messages
    if (since) {
      whereConditions.createdAt = {
        gt: new Date(since),
      };
    }

    // Fetch messages
    const messages = await prisma.message.findMany({
      where: whereConditions,
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

// POST - Send a message in a session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, sender, content } = body;

    if (!sessionId || !sender || !content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Session ID, sender, and content are required" },
        { status: 400 }
      );
    }

    if (sender !== "A" && sender !== "B") {
      return NextResponse.json(
        { error: "Sender must be 'A' or 'B'" },
        { status: 400 }
      );
    }

    // Verify session exists
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if session has expired
    if (session.expiresAt && session.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Session has expired" },
        { status: 410 }
      );
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        sessionId,
        sender,
        content: content.trim(),
      },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
