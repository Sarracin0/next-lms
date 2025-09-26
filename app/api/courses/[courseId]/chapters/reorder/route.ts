import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'
import { logError } from '@/lib/logger'

import { db } from '@/lib/db'
import { assertRole, requireAuthContext } from '@/lib/current-profile'

type RouteParams = Promise<{
  courseId: string
}>

export async function PUT(request: NextRequest, { params }: { params: RouteParams }) {
  try {
    const { courseId } = await params
    const { profile, company } = await requireAuthContext()
    assertRole(profile, [UserRole.HR_ADMIN, UserRole.TRAINER])

    const { list } = await request.json()

    if (!Array.isArray(list)) {
      return new NextResponse('Invalid payload', { status: 400 })
    }

    const course = await db.course.findFirst({ where: { id: courseId, companyId: company.id } })

    if (!course) {
      return new NextResponse('Course not found', { status: 404 })
    }

    if (profile.role === UserRole.TRAINER && course.createdByProfileId !== profile.id) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    await Promise.all(
      list.map((item: { id: string; position: number }) =>
        db.chapter.updateMany({
          where: { id: item.id, courseId },
          data: { position: item.position },
        }),
      ),
    )

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    logError('CHAPTER_REORDER', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
