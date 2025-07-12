import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Create test users
  const user1 = await prisma.user.create({
    data: {
      name: "Alice",
      relationshipName: "girlfriend",
    },
  });

  const user2 = await prisma.user.create({
    data: {
      name: "Bob",
      relationshipName: "boyfriend",
    },
  });

  console.log("✅ Created users:", { user1: user1.name, user2: user2.name });

  // Create a test session
  const session = await prisma.session.create({
    data: {
      userAId: user1.id,
      userBId: user2.id,
    },
  });

  console.log("✅ Created session:", session.id);

  // Create test messages for conversation history
  const messages = await prisma.message.createMany({
    data: [
      {
        sessionId: session.id,
        sender: "A",
        content: "I can't believe you didn't tell me about the party!",
      },
      {
        sessionId: session.id,
        sender: "B",
        content: "I'm sorry, I forgot to mention it. It was last minute.",
      },
      {
        sessionId: session.id,
        sender: "A",
        content: "But all our friends were there. I felt so left out.",
      },
      {
        sessionId: session.id,
        sender: "B",
        content: "You're right, I should have invited you. I wasn't thinking.",
      },
      {
        sessionId: session.id,
        sender: "A",
        content:
          "It just makes me feel like you don't want me around your friends.",
      },
    ],
  });

  console.log("✅ Created messages:", messages.count);

  // Create a resolution
  const resolution = await prisma.resolution.create({
    data: {
      sessionId: session.id,
      verdict: "Both parties acknowledge the miscommunication",
      compromise:
        "Bob agrees to be more mindful of including Alice in social events, and Alice will express her feelings more directly in the future",
    },
  });

  console.log("✅ Created resolution:", resolution.id);

  // Create another session with different drama scenario
  const session2 = await prisma.session.create({
    data: {
      userAId: user1.id,
      userBId: user2.id,
    },
  });

  await prisma.message.createMany({
    data: [
      {
        sessionId: session2.id,
        sender: "A",
        content: "Why didn't you do the dishes like you promised?",
      },
      {
        sessionId: session2.id,
        sender: "B",
        content: "I had a really long day at work and forgot.",
      },
      {
        sessionId: session2.id,
        sender: "A",
        content:
          "But this happens every week. I feel like I'm doing everything.",
      },
    ],
  });

  console.log("✅ Created second session with ongoing conversation");

  console.log("🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
