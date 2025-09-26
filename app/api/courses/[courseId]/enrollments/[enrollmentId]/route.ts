import { NextRequest, NextResponse } from 'next/server'
import { CourseEnrollmentStatus, UserRole } from '@prisma/client'
import { logError } from '@/lib/logger'

import { db } from '@/lib/db'
import { assertRole, requireAuthContext } from '@/lib/current-profile'

type RouteParams = Promise<{
  courseId: string
  enrollmentId: string
}>

export async function PATCH(request: NextRequest, { params }: { params: RouteParams }) {
  try {
    const { profile, company } = await requireAuthContext()
    assertRole(profile, [UserRole.HR_ADMIN, UserRole.TRAINER])

    const { courseId, enrollmentId } = await params
    const payload = await request.json()

    const enrollment = await db.courseEnrollment.findFirst({
      where: { id: enrollmentId, courseId, course: { companyId: company.id } },
    })

    if (!enrollment) {
      return new NextResponse('Enrollment not found', { status: 404 })
    }

    if (profile.role === UserRole.TRAINER && enrollment.assignedById !== profile.id && enrollment.userProfileId !== profile.id) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const updatedEnrollment = await db.courseEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status: payload.status && Object.values(CourseEnrollmentStatus).includes(payload.status)
          ? payload.status
          : undefined,
        dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
      },
    })

    return NextResponse.json(updatedEnrollment)
  } catch (error) {
    logError('COURSE_ENROLLMENT_PATCH', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: RouteParams }) {
  try {
    const { profile, company } = await requireAuthContext()
    assertRole(profile, [UserRole.HR_ADMIN, UserRole.TRAINER])

    const { courseId, enrollmentId } = await params

    const enrollment = await db.courseEnrollment.findFirst({
      where: { id: enrollmentId, courseId, course: { companyId: company.id } },
    })

    if (!enrollment) {
      return new NextResponse('Enrollment not found', { status: 404 })
    }

    if (profile.role === UserRole.TRAINER && enrollment.assignedById !== profile.id) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    await db.courseEnrollment.delete({ where: { id: enrollmentId } })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    logError('COURSE_ENROLLMENT_DELETE', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
