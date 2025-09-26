import { CourseEnrollmentStatus, UserRole } from '@prisma/client'

import { db } from '@/lib/db'

type CourseAnalyticsDatum = {
  name: string
  completed: number
  inProgress: number
}

type AnalyticsResponse = {
  data: CourseAnalyticsDatum[]
  totalLearners: number
  completedEnrollments: number
  inProgressEnrollments: number
  averageCompletionRate: number
}

export async function getAnalytics(companyId: string): Promise<AnalyticsResponse> {
  try {
    const [courseStats, totalLearners, enrollments, completedEnrollments] = await Promise.all([
      db.course.findMany({
        where: { companyId },
        select: {
          title: true,
          enrollments: {
            select: {
              status: true,
            },
          },
        },
      }),
      db.userProfile.count({ where: { companyId, role: UserRole.LEARNER } }),
      db.courseEnrollment.count({ where: { course: { companyId } } }),
      db.courseEnrollment.count({
        where: {
          course: { companyId },
          status: CourseEnrollmentStatus.COMPLETED,
        },
      }),
    ])

    const inProgressEnrollments = await db.courseEnrollment.count({
      where: {
        course: { companyId },
        status: CourseEnrollmentStatus.IN_PROGRESS,
      },
    })

    const data: CourseAnalyticsDatum[] = courseStats.map((course) => {
      const completed = course.enrollments.filter((enrollment) => enrollment.status === CourseEnrollmentStatus.COMPLETED).length
      const inProgress = course.enrollments.filter((enrollment) => enrollment.status === CourseEnrollmentStatus.IN_PROGRESS).length

      return {
        name: course.title,
        completed,
        inProgress,
      }
    })

    const averageCompletionRate = enrollments === 0 ? 0 : Math.round((completedEnrollments / enrollments) * 100)

    return {
      data,
      totalLearners,
      completedEnrollments,
      inProgressEnrollments,
      averageCompletionRate,
    }
  } catch {
    return {
      data: [],
      totalLearners: 0,
      completedEnrollments: 0,
      inProgressEnrollments: 0,
      averageCompletionRate: 0,
    }
  }
}
