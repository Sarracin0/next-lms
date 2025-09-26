import { NextRequest, NextResponse } from 'next/server'
import { CourseEnrollmentSource, CourseEnrollmentStatus, UserRole } from '@prisma/client'
import { logError } from '@/lib/logger'

import { db } from '@/lib/db'
import { assertRole, requireAuthContext } from '@/lib/current-profile'

type RouteParams = Promise<{
  courseId: string
}>

export async function POST(request: NextRequest, { params }: { params: RouteParams }) {
  try {
    const { courseId } = await params
    const { profile, company } = await requireAuthContext()
    assertRole(profile, [UserRole.HR_ADMIN, UserRole.TRAINER])

    const { userProfileIds, dueDate } = await request.json()

    if (!Array.isArray(userProfileIds) || userProfileIds.length === 0) {
      return new NextResponse('At least one user is required', { status: 400 })
    }

    const course = await db.course.findFirst({ where: { id: courseId, companyId: company.id } })

    if (!course) {
      return new NextResponse('Course not found', { status: 404 })
    }

    if (profile.role === UserRole.TRAINER && course.createdByProfileId !== profile.id) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const profiles = await db.userProfile.findMany({
      where: { id: { in: userProfileIds }, companyId: company.id },
      select: { id: true },
    })

    const validIds = profiles.map((item) => item.id)

    if (validIds.length === 0) {
      return new NextResponse('No valid users provided', { status: 400 })
    }

    const enrollments = await Promise.all(
      validIds.map((userProfileId) =>
        db.courseEnrollment.upsert({
          where: {
            courseId_userProfileId: {
              courseId,
              userProfileId,
            },
          },
          update: {
            dueDate: dueDate ? new Date(dueDate) : undefined,
          },
          create: {
            courseId,
            userProfileId,
            assignedById: profile.id,
            source: profile.role === UserRole.TRAINER ? CourseEnrollmentSource.MANUAL : CourseEnrollmentSource.MANUAL,
            status: CourseEnrollmentStatus.NOT_STARTED,
            dueDate: dueDate ? new Date(dueDate) : undefined,
          },
        }),
      ),
    )

    return NextResponse.json(enrollments)
  } catch (error) {
    logError('COURSE_ENROLLMENT_POST', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
