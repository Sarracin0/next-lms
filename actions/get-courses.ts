import { Category, Chapter, Course, CourseEnrollment, CourseEnrollmentStatus } from '@prisma/client'

import { db } from '@/lib/db'
import { getProgress } from './get-progress'

export type CourseWithProgressAndCategory = Course & {
  category: Category | null
  chapters: Pick<Chapter, 'id'>[]
  enrollments: Pick<CourseEnrollment, 'id' | 'status'>[]
  progress: number | null
  enrollmentStatus: CourseEnrollmentStatus | null
}

type GetCoursesArgs = {
  userProfileId: string
  companyId: string
  title?: string
  categoryId?: string
}

export async function getCourses({
  userProfileId,
  companyId,
  title,
  categoryId,
}: GetCoursesArgs): Promise<CourseWithProgressAndCategory[]> {
  try {
    const courses = await db.course.findMany({
      where: {
        isPublished: true,
        companyId,
        title: title ? { contains: title, mode: 'insensitive' } : undefined,
        categoryId,
      },
      include: {
        category: true,
        chapters: {
          where: { isPublished: true },
          select: { id: true },
        },
        enrollments: {
          where: { userProfileId },
          select: { id: true, status: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const coursesWithProgress: CourseWithProgressAndCategory[] = await Promise.all(
      courses.map(async (course) => {
        if (course.enrollments.length === 0) {
          return {
            ...course,
            progress: null,
            enrollmentStatus: null,
          }
        }

        const progressPercentage = await getProgress(userProfileId, course.id)
        return {
          ...course,
          progress: progressPercentage,
          enrollmentStatus: course.enrollments[0]?.status ?? null,
        }
      }),
    )

    return coursesWithProgress
  } catch {
    return []
  }
}
