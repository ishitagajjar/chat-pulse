import { PrismaClient, WorkspaceRole, MessageType, ChannelType } from "@prisma/client";
import { hashPassword } from "../src/utils/password";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "Demo@123";

const sampleMessages = [
  "Hey everyone! Welcome to ChatPulse Demo 👋",
  "Thanks for setting this up! This looks great.",
  "Has anyone seen the latest project updates?",
  "I'll share the link in a moment.",
  "Here's the doc: https://docs.example.com/project-plan",
  "Can we schedule a standup for tomorrow?",
  "10 AM works for me!",
  "Same here, 10 AM is perfect.",
  "Don't forget to review the PR before EOD.",
  "On it! Should be done in an hour.",
  "Anyone want coffee? ☕",
  "I'm in! Meet at the kitchen?",
  "Quick question about the API endpoints...",
  "Which ones specifically?",
  "The auth refresh flow — is it cookie-based?",
  "Yes, refresh token is httpOnly cookie.",
  "Nice, that's more secure.",
  "Pushed the latest changes to staging.",
  "I'll test it now and report back.",
  "Found a small bug in the message list scroll.",
  "Can you file an issue with steps to reproduce?",
  "Done! Added screenshots too.",
  "Great teamwork everyone 🚀",
  "Let's wrap up for today.",
  "See you all tomorrow!",
  "Weekend plans anyone?",
  "Hiking if the weather holds!",
  "Sounds fun, enjoy!",
  "Back on Monday — have a good one!",
  "Happy Friday! 🎉",
];

async function main() {
  console.log("Seeding database...");

  const password = await hashPassword(DEMO_PASSWORD);

  const alice = await prisma.user.upsert({
    where: { email: "alice@demo.com" },
    update: {},
    create: {
      email: "alice@demo.com",
      password,
      displayName: "Alice",
      avatarUrl: null,
    },
  });

  const bob = await prisma.user.upsert({
    where: { email: "bob@demo.com" },
    update: {},
    create: {
      email: "bob@demo.com",
      password,
      displayName: "Bob",
      avatarUrl: null,
    },
  });

  const charlie = await prisma.user.upsert({
    where: { email: "charlie@demo.com" },
    update: {},
    create: {
      email: "charlie@demo.com",
      password,
      displayName: "Charlie",
      avatarUrl: null,
    },
  });

  const users = [alice, bob, charlie];

  const workspace = await prisma.workspace.upsert({
    where: { slug: "chatpulse-demo" },
    update: {},
    create: {
      name: "ChatPulse Demo",
      slug: "chatpulse-demo",
      ownerId: alice.id,
    },
  });

  for (const user of users) {
    const role =
      user.id === alice.id ? WorkspaceRole.OWNER : WorkspaceRole.MEMBER;
    await prisma.workspaceMember.upsert({
      where: {
        workspaceId_userId: { workspaceId: workspace.id, userId: user.id },
      },
      update: {},
      create: { workspaceId: workspace.id, userId: user.id, role },
    });
  }

  const channelNames = [
    { name: "general", description: "General discussion" },
    { name: "random", description: "Off-topic and fun" },
    { name: "projects", description: "Project updates and planning" },
  ];

  const channels = [];
  for (const ch of channelNames) {
    let channel = await prisma.channel.findFirst({
      where: { workspaceId: workspace.id, name: ch.name },
    });
    if (!channel) {
      channel = await prisma.channel.create({
        data: {
          workspaceId: workspace.id,
          name: ch.name,
          description: ch.description,
          createdById: alice.id,
        },
      });
    }
    channels.push(channel);

    for (const user of users) {
      await prisma.channelMember.upsert({
        where: {
          channelId_userId: { channelId: channel.id, userId: user.id },
        },
        update: {},
        create: { channelId: channel.id, userId: user.id },
      });
    }
  }

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  let msgIndex = 0;

  for (const channel of channels) {
    const msgCount = 10;
    for (let i = 0; i < msgCount; i++) {
      const user = users[msgIndex % users.length];
      const daysAgo = Math.floor(msgIndex / 5);
      const createdAt = new Date(now - daysAgo * dayMs - i * 3600000);

      await prisma.message.create({
        data: {
          channelId: channel.id,
          userId: user.id,
          content: sampleMessages[msgIndex % sampleMessages.length],
          type: MessageType.TEXT,
          createdAt,
        },
      });
      msgIndex++;
    }
  }

  const allMessages = await prisma.message.findMany({
    where: { channelId: { in: channels.map((c) => c.id) } },
    take: 10,
  });

  const reactionEmojis = ["👍", "❤️", "🔥", "👀", "🚀"];
  for (let i = 0; i < 5 && i < allMessages.length; i++) {
    const msg = allMessages[i];
    const reactor = users[(i + 1) % users.length];
    await prisma.reaction.create({
      data: {
        messageId: msg.id,
        userId: reactor.id,
        emoji: reactionEmojis[i],
      },
    });
  }

  const dmChannel = await prisma.channel.create({
    data: {
      workspaceId: workspace.id,
      name: `dm-${[alice.id, bob.id].sort().join("-")}`,
      type: ChannelType.DM,
      createdById: alice.id,
    },
  });

  await prisma.channelMember.createMany({
    data: [
      { channelId: dmChannel.id, userId: alice.id },
      { channelId: dmChannel.id, userId: bob.id },
    ],
  });

  const dmMessages = [
    "Hey Bob, got a minute?",
    "Sure! What's up?",
    "Can you review my PR when you get a chance?",
    "Already on it, looks good so far!",
    "Thanks! Let me know if you have any feedback.",
  ];

  for (let i = 0; i < dmMessages.length; i++) {
    const user = i % 2 === 0 ? alice : bob;
    await prisma.message.create({
      data: {
        channelId: dmChannel.id,
        userId: user.id,
        content: dmMessages[i],
        type: MessageType.TEXT,
        createdAt: new Date(now - (5 - i) * 600000),
      },
    });
  }

  console.log("Seed completed!");
  console.log("Demo users: alice@demo.com, bob@demo.com, charlie@demo.com");
  console.log(`Password: ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
