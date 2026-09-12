-- CreateEnum
CREATE TYPE "MeetingPlatform" AS ENUM ('ZOOM', 'GOOGLE_MEET', 'MS_TEAMS', 'OTHER');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('SCHEDULED', 'LIVE', 'ENDED', 'FAILED');

-- CreateEnum
CREATE TYPE "ActionItemStatus" AS ENUM ('PROPOSED', 'APPROVED', 'REJECTED', 'DISPATCHED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ActionItemKind" AS ENUM ('TASK', 'EMAIL', 'RESEARCH', 'ISSUE', 'DECISION');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "platform" "MeetingPlatform" NOT NULL DEFAULT 'OTHER',
    "status" "MeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "externalId" TEXT,
    "joinUrl" TEXT,
    "primaryLocale" TEXT NOT NULL DEFAULT 'en-US',
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en-US',
    "isHost" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3),
    "leftAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranscriptSegment" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "speakerId" TEXT,
    "text" TEXT NOT NULL,
    "detectedLocale" TEXT,
    "translation" TEXT,
    "startMs" INTEGER NOT NULL,
    "endMs" INTEGER NOT NULL,
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TranscriptSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionItem" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "ownerId" TEXT,
    "kind" "ActionItemKind" NOT NULL DEFAULT 'TASK',
    "status" "ActionItemStatus" NOT NULL DEFAULT 'PROPOSED',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueAt" TIMESTAMP(3),
    "sourceQuote" TEXT,
    "payload" JSONB,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FollowUpJob" (
    "id" TEXT NOT NULL,
    "actionItemId" TEXT NOT NULL,
    "taskSlug" TEXT NOT NULL,
    "runId" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'QUEUED',
    "input" JSONB,
    "output" JSONB,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FollowUpJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Meeting_externalId_key" ON "Meeting"("externalId");

-- CreateIndex
CREATE INDEX "Meeting_status_startedAt_idx" ON "Meeting"("status", "startedAt");

-- CreateIndex
CREATE INDEX "Participant_meetingId_idx" ON "Participant"("meetingId");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_meetingId_email_key" ON "Participant"("meetingId", "email");

-- CreateIndex
CREATE INDEX "TranscriptSegment_meetingId_startMs_idx" ON "TranscriptSegment"("meetingId", "startMs");

-- CreateIndex
CREATE INDEX "ActionItem_meetingId_status_idx" ON "ActionItem"("meetingId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "FollowUpJob_runId_key" ON "FollowUpJob"("runId");

-- CreateIndex
CREATE INDEX "FollowUpJob_status_createdAt_idx" ON "FollowUpJob"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranscriptSegment" ADD CONSTRAINT "TranscriptSegment_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranscriptSegment" ADD CONSTRAINT "TranscriptSegment_speakerId_fkey" FOREIGN KEY ("speakerId") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionItem" ADD CONSTRAINT "ActionItem_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionItem" ADD CONSTRAINT "ActionItem_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FollowUpJob" ADD CONSTRAINT "FollowUpJob_actionItemId_fkey" FOREIGN KEY ("actionItemId") REFERENCES "ActionItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
