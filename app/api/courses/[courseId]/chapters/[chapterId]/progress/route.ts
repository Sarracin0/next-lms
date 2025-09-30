import { NextRequest, NextResponse } from 'next/server'
import { CourseEnrollmentSource, CourseEnrollmentStatus, PointsType } from '@prisma/client'
import { logError } from '@/lib/logger'

import { db } from '@/lib/db'
import { getProgress } from '@/actions/get-progress'
import { requireAuthContext } from '@/lib/current-profile'
import { evaluateCourseAchievements } from '@/lib/evaluate-course-achievements'

type RouteParams = Promise<{
  courseId: string
  chapterId: string
}>

const POINTS_PER_CHAPTER_COMPLETION = 10

export async function PUT(request: NextRequest, { params }: { params: RouteParams }) {
  try {
    const { courseId, chapterId } = await params
    const { profile, company } = await requireAuthContext()

    const { isCompleted } = await request.json()

    const chapter = await db.chapter.findFirst({
      where: { id: chapterId, courseId, course: { companyId: company.id } },
      select: { id: true, isPreview: true },
    })

    if (!chapter) {
      return new NextResponse('Chapter not found', { status: 404 })
    }

    let enrollment = await db.courseEnrollment.findUnique({
      where: {
        courseId_userProfileId: {
          courseId,
          userProfileId: profile.id,
        },
      },
    })

    if (!enrollment) {
      // Allow self enrollment when accessing preview content
      enrollment = await db.courseEnrollment.create({
        data: {
          courseId,
          userProfileId: profile.id,
          assignedById: profile.id,
          source: CourseEnrollmentSource.SELF_ENROLL,
          status: CourseEnrollmentStatus.IN_PROGRESS,
          startedAt: new Date(),
        },
      })
    }

    const existingProgress = await db.userProgress.findUnique({
      where: {
        userProfileId_chapterId: {
          userProfileId: profile.id,
          chapterId,
        },
      },
    })

    let progress = await db.userProgress.upsert({
      where: {
        userProfileId_chapterId: {
          userProfileId: profile.id,
          chapterId,
        },
      },
      create: {
        chapterId,
        userProfileId: profile.id,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
        pointsAwarded: existingProgress?.pointsAwarded ?? 0,
      },
      update: {
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
    })

    if (isCompleted && !existingProgress?.isCompleted) {
      const [, , updatedProgress] = await db.$transaction([
        db.userProfile.update({
          where: { id: profile.id },
          data: { points: { increment: POINTS_PER_CHAPTER_COMPLETION } },
        }),
        db.userPoints.create({
          data: {
            userProfileId: profile.id,
            delta: POINTS_PER_CHAPTER_COMPLETION,
            type: PointsType.COMPLETION,
            referenceId: chapterId,
            reason: 'Chapter completion',
          },
        }),
        db.userProgress.update({
          where: { id: progress.id },
          data: { pointsAwarded: POINTS_PER_CHAPTER_COMPLETION },
        }),
      ])

      progress = updatedProgress
    }

    const progressPercentage = await getProgress(profile.id, courseId)

    if (progressPercentage === 100) {
      await db.courseEnrollment.update({
        where: { id: enrollment.id },
        data: {
          status: CourseEnrollmentStatus.COMPLETED,
          completedAt: enrollment.completedAt ?? new Date(),
        },
      })
    } else if (progressPercentage > 0 && enrollment.status === CourseEnrollmentStatus.NOT_STARTED) {
      await db.courseEnrollment.update({
        where: { id: enrollment.id },
        data: {
          status: CourseEnrollmentStatus.IN_PROGRESS,
          startedAt: enrollment.startedAt ?? new Date(),
        },
      })
    }

    await evaluateCourseAchievements({
      courseId,
      userProfileId: profile.id,
      progressPercentage,
    })

    return NextResponse.json(progress)
  } catch (error) {
    logError('CHAPTER_PROGRESS', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
