-- AlterEnum
ALTER TYPE "BlockType" ADD VALUE IF NOT EXISTS 'LIVE_SESSION';

-- AlterTable
ALTER TABLE "LessonBlock" ADD COLUMN IF NOT EXISTS "liveSessionId" TEXT;
ALTER TABLE "LessonBlock" ADD COLUMN IF NOT EXISTS "liveSessionConfig" JSONB;

-- AddForeignKey
ALTER TABLE "LessonBlock"
  ADD CONSTRAINT "LessonBlock_liveSessionId_fkey"
  FOREIGN KEY ("liveSessionId") REFERENCES "LiveSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
