import { db } from '@/lib/db'

export async function getProgress(userProfileId: string, courseId: string): Promise<number> {
  try {
    const publishedChapters = await db.chapter.findMany({
      where: { courseId, isPublished: true },
      select: { id: true },
    })

    if (publishedChapters.length === 0) {
      return 0
    }

    const publishedChapterIds = publishedChapters.map((chapter) => chapter.id)

    const completedChapters = await db.userProgress.count({
      where: { userProfileId, chapterId: { in: publishedChapterIds }, isCompleted: true },
    })

    const progressPercentage = (completedChapters / publishedChapterIds.length) * 100

    return Math.round(progressPercentage)
  } catch {
    return 0
  }
}
