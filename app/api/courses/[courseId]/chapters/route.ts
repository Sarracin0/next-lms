import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'
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

    const { title, estimatedDurationMinutes } = await request.json()

    if (!title) {
      return new NextResponse('Chapter title is required', { status: 400 })
    }

    const course = await db.course.findFirst({
      where: { id: courseId, companyId: company.id },
    })

    if (!course) {
      return new NextResponse('Course not found', { status: 404 })
    }

    if (profile.role === UserRole.TRAINER && course.createdByProfileId !== profile.id) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const lastChapter = await db.chapter.findFirst({
      where: { courseId },
      orderBy: { position: 'desc' },
    })

    const newPosition = lastChapter ? lastChapter.position + 1 : 1

    const chapter = await db.chapter.create({
      data: {
        title,
        courseId,
        position: newPosition,
        estimatedDurationMinutes:
          typeof estimatedDurationMinutes === 'number' ? estimatedDurationMinutes : null,
      },
    })

    return NextResponse.json(chapter, { status: 201 })
  } catch (error) {
    logError('COURSE_CHAPTER_POST', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
