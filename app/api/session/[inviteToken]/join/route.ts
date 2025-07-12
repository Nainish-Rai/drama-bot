import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/lib/generated/prisma";

const prisma = new PrismaClient();

// POST - Join an anonymous session
export async function POST(
  request: NextRequest,
  { params }: { params: { inviteToken: string } }
) {
  try {
    const { inviteToken } = params;
    const body = await request.json();
    const { partnerName } = body;

    if (!partnerName || partnerName.trim().length === 0) {
      return NextResponse.json(
        { error: "Partner name is required" },
        { status: 400 }
      );
    }

    const session = await prisma.session.findUnique({
      where: { inviteToken },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (!session.isAnonymous) {
      return NextResponse.json(
        { error: "This is not an anonymous session" },
        { status: 400 }
      );
    }

    // Check if session has expired
    if (session.expiresAt && session.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Session has expired" },
        { status: 410 }
      );
    }

    // Check if partner has already joined
    if (session.userBJoined) {
      return NextResponse.json(
        { error: "Session is already full" },
        { status: 409 }
      );
    }

    // Update session with partner info
    const updatedSession = await prisma.session.update({
      where: { inviteToken },
      data: {
        userBName: partnerName.trim(),
        userBJoined: true,
      },
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

    return NextResponse.json({
      session: updatedSession,
      partnerRole: "B",
    });
  } catch (error) {
    console.error("Error joining session:", error);
    return NextResponse.json(
      { error: "Failed to join session" },
      { status: 500 }
    );
  }
}
