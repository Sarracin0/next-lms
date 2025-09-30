import { BlockType, CourseEnrollment, UserProgress as PrismaUserProgress } from '@prisma/client'

import { db } from '@/lib/db'

type GetChapterArgs = {
  userProfileId: string
  companyId: string
  courseId: string
  chapterId: string
}

type ChapterAccessResponse = {
  course: {
    id: string
    title: string
    description: string | null
    estimatedDurationMinutes: number | null
    imageUrl: string | null
  } | null
  chapter: {
    id: string
    title: string
    description: string | null
    videoUrl: string | null
    contentUrl: string | null
    position: number
    isPreview: boolean
  } | null
  attachments: { id: string; name: string; url: string; type: string | null }[] | null
  nextChapter: { id: string; title: string; position: number } | null
  userProgress: PrismaUserProgress | null
  enrollment: CourseEnrollment | null
  canAccessContent: boolean
  block:
    | {
        id: string
        type: BlockType
        liveSessionConfig: Record<string, unknown> | null
        liveSession:
          | {
              id: string
              scheduledFor: Date
              durationMinutes: number | null
            }
          | null
      }
    | null
}

export async function getChapter({ userProfileId, companyId, courseId, chapterId }: GetChapterArgs): Promise<ChapterAccessResponse> {
  try {
    const course = await db.course.findFirst({
      where: { id: courseId, companyId, isPublished: true },
      select: {
        id: true,
        title: true,
        description: true,
        estimatedDurationMinutes: true,
        imageUrl: true,
      },
    })

    if (!course) {
      return {
        course: null,
        chapter: null,
        attachments: null,
        nextChapter: null,
        userProgress: null,
        enrollment: null,
        canAccessContent: false,
        block: null,
      }
    }

    const chapter = await db.chapter.findFirst({
      where: { id: chapterId, courseId, isPublished: true },
      select: {
        id: true,
        title: true,
        description: true,
        videoUrl: true,
        contentUrl: true,
        position: true,
        isPreview: true,
      },
    })

    if (!chapter) {
      return {
        course,
        chapter: null,
        attachments: null,
        nextChapter: null,
        userProgress: null,
        enrollment: null,
        canAccessContent: false,
        block: null,
      }
    }

    const lessonBlock = await db.lessonBlock.findFirst({
      where: { legacyChapterId: chapter.id },
      select: {
        id: true,
        type: true,
        liveSessionConfig: true,
        liveSession: {
          select: {
            id: true,
            scheduledFor: true,
            durationMinutes: true,
          },
        },
      },
    })

    const enrollment = await db.courseEnrollment.findUnique({
      where: {
        courseId_userProfileId: {
          courseId,
          userProfileId,
        },
      },
    })

    const attachments = await db.attachment.findMany({
      where: { courseId },
      select: { id: true, name: true, url: true, type: true },
      orderBy: { createdAt: 'asc' },
    })

    const nextChapter = await db.chapter.findFirst({
      where: { courseId, isPublished: true, position: { gt: chapter.position } },
      select: { id: true, title: true, position: true },
      orderBy: { position: 'asc' },
    })

    const userProgress = await db.userProgress.findUnique({
      where: {
        userProfileId_chapterId: {
          userProfileId,
          chapterId,
        },
      },
    })

    const canAccessContent = Boolean(enrollment || chapter.isPreview)
    const visibleAttachments = enrollment ? attachments : []

    return {
      course,
      chapter,
      attachments: visibleAttachments,
      nextChapter,
      userProgress,
      enrollment,
      canAccessContent,
      block: lessonBlock
        ? {
            id: lessonBlock.id,
            type: lessonBlock.type,
            liveSessionConfig: (lessonBlock.liveSessionConfig as Record<string, unknown> | null) ?? null,
            liveSession: lessonBlock.liveSession,
          }
        : null,
    }
  } catch {
    return {
      course: null,
      chapter: null,
      attachments: null,
      nextChapter: null,
      userProgress: null,
      enrollment: null,
      canAccessContent: false,
      block: null,
    }
  }
}
