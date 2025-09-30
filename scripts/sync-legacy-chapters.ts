import { BlockType } from '@prisma/client'

import { db } from '@/lib/db'
import { syncLegacyChapterForBlock } from '@/lib/sync-legacy-chapter'

async function main() {
  const blocks = await db.lessonBlock.findMany({
    where: { type: BlockType.VIDEO_LESSON },
    select: { id: true },
  })

  for (const block of blocks) {
    await syncLegacyChapterForBlock(block.id)
  }

  console.log(`Synced ${blocks.length} legacy chapters from video lesson blocks.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
