-- Add optional chapter relation to attachments and cascade on delete for clean lesson resources
ALTER TABLE "Attachment" ADD COLUMN "chapterId" TEXT;

ALTER TABLE "Attachment"
  ADD CONSTRAINT "Attachment_chapterId_fkey"
  FOREIGN KEY ("chapterId")
  REFERENCES "Chapter"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

CREATE INDEX "Attachment_chapterId_idx" ON "Attachment"("chapterId");
