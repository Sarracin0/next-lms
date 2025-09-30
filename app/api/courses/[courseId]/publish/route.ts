import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'
import { logError } from '@/lib/logger'

import { db } from '@/lib/db'
import { assertRole, requireAuthContext } from '@/lib/current-profile'
import { syncLegacyChaptersForCourse } from '@/lib/sync-legacy-chapter'

type RouteParams = Promise<{
  courseId: string
}>

export async function PATCH(request: NextRequest, { params }: { params: RouteParams }) {
  try {
    const { courseId } = await params
    const { profile, company } = await requireAuthContext()
    assertRole(profile, [UserRole.HR_ADMIN, UserRole.TRAINER])

    const course = await db.course.findFirst({
      where: { id: courseId, companyId: company.id },
      include: {
        chapters: true,
      },
    })

    if (!course) {
      return new NextResponse('Course not found', { status: 404 })
    }

    if (profile.role === UserRole.TRAINER && course.createdByProfileId !== profile.id) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const publishedCourse = await db.course.update({
      where: { id: courseId },
      data: { isPublished: true },
    })

    await syncLegacyChaptersForCourse(courseId)

    return NextResponse.json(publishedCourse)
  } catch (error) {
    logError('COURSE_PUBLISH', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
