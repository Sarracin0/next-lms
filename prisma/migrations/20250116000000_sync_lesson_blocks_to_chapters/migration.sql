-- Add legacyChapterId link from LessonBlock to Chapter for backward compatibility
ALTER TABLE "LessonBlock" ADD COLUMN "legacyChapterId" TEXT;

ALTER TABLE "LessonBlock"
  ADD CONSTRAINT "LessonBlock_legacyChapterId_key" UNIQUE ("legacyChapterId");

ALTER TABLE "LessonBlock"
  ADD CONSTRAINT "LessonBlock_legacyChapterId_fkey"
  FOREIGN KEY ("legacyChapterId")
  REFERENCES "Chapter"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;
