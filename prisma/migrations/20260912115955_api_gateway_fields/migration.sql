-- AlterEnum
ALTER TYPE "MeetingStatus" ADD VALUE 'CANCELLED';

-- DropForeignKey
ALTER TABLE "ActionItem" DROP CONSTRAINT "ActionItem_meetingId_fkey";

-- AlterTable
ALTER TABLE "ActionItem" ADD COLUMN     "ownerName" TEXT,
ALTER COLUMN "meetingId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN     "agenda" TEXT,
ADD COLUMN     "notes" TEXT;

-- AddForeignKey
ALTER TABLE "ActionItem" ADD CONSTRAINT "ActionItem_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE SET NULL ON UPDATE CASCADE;
