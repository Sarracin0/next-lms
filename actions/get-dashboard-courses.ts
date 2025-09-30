import { CourseEnrollmentSource, CourseEnrollmentStatus, Prisma } from '@prisma/client'

import { db } from '@/lib/db'
import { getProgress } from './get-progress'

type EnrollmentWithCourse = Prisma.CourseEnrollmentGetPayload<{
  include: {
    course: {
      include: {
        category: true
        chapters: {
          where: { isPublished: true }
          select: { id: true }
        }
        modules: {
          where: { isPublished: true },
          select: { id: true }
        }
        _count: {
          select: { modules: true }
        }
      }
    }
  }
}>
type EnrollmentWithProgress = EnrollmentWithCourse & { progress: number }

type DashboardCourses = {
  completedCourses: EnrollmentWithProgress[]
  coursesInProgress: EnrollmentWithProgress[]
}

async function syncTeamAssignmentsToEnrollments(userProfileId: string) {
  const teamAssignments = await db.courseTeamAssignment.findMany({
    where: {
      team: {
        memberships: {
          some: { userProfileId },
        },
      },
    },
    select: {
      courseId: true,
      assignedById: true,
    },
  })

  const handledCourseIds = new Set<string>()

  await Promise.all(
    teamAssignments.map(async (assignment) => {
      if (handledCourseIds.has(assignment.courseId)) return

      handledCourseIds.add(assignment.courseId)

      await db.courseEnrollment.upsert({
        where: {
          courseId_userProfileId: {
            courseId: assignment.courseId,
            userProfileId,
          },
        },
        create: {
          courseId: assignment.courseId,
          userProfileId,
          assignedById: assignment.assignedById,
          source: CourseEnrollmentSource.TEAM,
        },
        update: {},
      })
    }),
  )
}

export async function getDashboardCourses(userProfileId: string): Promise<DashboardCourses> {
  try {
    await syncTeamAssignmentsToEnrollments(userProfileId)

    const enrollments = await db.courseEnrollment.findMany({
      where: { userProfileId },
      include: {
        course: {
          include: {
            category: true,
            chapters: {
              where: { isPublished: true },
              select: { id: true },
            },
            modules: {
              where: { isPublished: true },
              select: { id: true },
            },
            _count: {
              select: { modules: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const results: EnrollmentWithProgress[] = []

    for (const enrollment of enrollments) {
      const progress = await getProgress(userProfileId, enrollment.courseId)

      let status = enrollment.status

      if (progress === 100 && enrollment.status !== CourseEnrollmentStatus.COMPLETED) {
        status = CourseEnrollmentStatus.COMPLETED
        await db.courseEnrollment.update({
          where: { id: enrollment.id },
          data: { status, completedAt: enrollment.completedAt ?? new Date() },
        })
      } else if (
        progress > 0 &&
        progress < 100 &&
        enrollment.status === CourseEnrollmentStatus.NOT_STARTED
      ) {
        status = CourseEnrollmentStatus.IN_PROGRESS
        await db.courseEnrollment.update({
          where: { id: enrollment.id },
          data: { status, startedAt: enrollment.startedAt ?? new Date() },
        })
      }

      results.push({ ...enrollment, status, progress })
    }

    const completedCourses = results.filter((item) => item.progress === 100)
    const coursesInProgress = results.filter((item) => item.progress < 100)

    return {
      completedCourses,
      coursesInProgress,
    }
  } catch {
    return {
      completedCourses: [],
      coursesInProgress: [],
    }
  }
}
