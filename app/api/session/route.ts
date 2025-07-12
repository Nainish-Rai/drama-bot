import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

// CREATE - Create a new anonymous session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { creatorName, expirationHours = 24 } = body;

    if (!creatorName || creatorName.trim().length === 0) {
      return NextResponse.json(
        { error: "Creator name is required" },
        { status: 400 }
      );
    }

    const inviteToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expirationHours);

    const session = await prisma.session.create({
      data: {
        isAnonymous: true,
        inviteToken,
        userAName: creatorName.trim(),
        userAJoined: true,
        userBJoined: false,
        expiresAt,
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      inviteToken: session.inviteToken,
      inviteUrl: `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/session/${inviteToken}`,
      creatorRole: "A",
      expiresAt: session.expiresAt,
    });
  } catch (error) {
    console.error("Error creating anonymous session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}

// GET - Get session by invite token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const inviteToken = searchParams.get("inviteToken");

    if (!inviteToken) {
      return NextResponse.json(
        { error: "Invite token is required" },
        { status: 400 }
      );
    }

    const session = await prisma.session.findUnique({
      where: { inviteToken },
      include: {
        userA: true,
        userB: true,
        messages: {
          orderBy: { createdAt: "asc" },
        },
        resolutions: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Session not found or expired" },
        { status: 404 }
      );
    }

    // Check if session has expired
    if (session.expiresAt && session.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Session has expired" },
        { status: 410 }
      );
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}
