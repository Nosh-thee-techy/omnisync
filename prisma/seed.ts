import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const meeting = await prisma.meeting.upsert({
    where: { externalId: "seed-demo-standup" },
    update: {},
    create: {
      externalId: "seed-demo-standup",
      title: "Q3 partner sync — Berlin / Nairobi",
      platform: "GOOGLE_MEET",
      status: "ENDED",
      primaryLocale: "en-US",
      startedAt: new Date("2026-09-10T09:00:00Z"),
      endedAt: new Date("2026-09-10T09:42:00Z"),
      participants: {
        create: [
          { displayName: "Lena Fischer", email: "lena@example.com", locale: "de-DE", isHost: true },
          { displayName: "Achieng Otieno", email: "achieng@example.com", locale: "sw-KE" },
        ],
      },
    },
    include: { participants: true },
  });

  const host = meeting.participants.find((p) => p.isHost) ?? meeting.participants[0];

  // Keep the seed idempotent — the meeting is upserted, its children are rebuilt.
  await prisma.transcriptSegment.deleteMany({ where: { meetingId: meeting.id } });
  await prisma.actionItem.deleteMany({ where: { meetingId: meeting.id } });

  await prisma.transcriptSegment.createMany({
    data: [
      {
        meetingId: meeting.id,
        speakerId: host.id,
        text: "Wir müssen den Vertrag bis Freitag aktualisieren.",
        detectedLocale: "de-DE",
        translation: "We need to update the contract by Friday.",
        startMs: 128_000,
        endMs: 133_400,
        confidence: 0.94,
      },
    ],
  });

  await prisma.actionItem.create({
    data: {
      meetingId: meeting.id,
      ownerId: host.id,
      kind: "TASK",
      status: "PROPOSED",
      title: "Update the partner contract and notify legal",
      sourceQuote: "We need to update the contract by Friday.",
      dueAt: new Date("2026-09-18T17:00:00Z"),
      payload: { assignee: host.email, channel: "#legal" },
    },
  });

  console.log(`Seeded meeting ${meeting.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
