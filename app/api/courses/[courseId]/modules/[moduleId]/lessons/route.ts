import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'

import { db } from '@/lib/db'
import { assertRole, requireAuthContext } from '@/lib/current-profile'
import { logError } from '@/lib/logger'

const lessonInclude = {
  blocks: {
    orderBy: { position: 'asc' as const },
  },
}

type RouteParams = Promise<{
  courseId: string
  moduleId: string
}>

export async function POST(request: NextRequest, { params }: { params: RouteParams }) {
  try {
    const { profile, company } = await requireAuthContext()
    assertRole(profile, [UserRole.HR_ADMIN, UserRole.TRAINER])

    const { courseId, moduleId } = await params
    const module = await db.courseModule.findFirst({
      where: { id: moduleId, courseId, course: { companyId: company.id } },
      include: { course: true },
    })

    if (!module) {
      return new NextResponse('Module not found', { status: 404 })
    }

    if (profile.role === UserRole.TRAINER && module.course.createdByProfileId !== profile.id) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const body = await request.json()
    const title = typeof body.title === 'string' ? body.title.trim() : 'New Lesson'
    const description = typeof body.description === 'string' ? body.description.trim() : undefined

    if (!title) {
      return new NextResponse('Lesson title is required', { status: 400 })
    }

    const lastLesson = await db.lesson.findFirst({
      where: { moduleId },
      orderBy: { position: 'desc' },
    })

    const position = lastLesson ? lastLesson.position + 1 : 1

    const lesson = await db.lesson.create({
      data: {
        moduleId,
        title,
        description: description ?? null,
        position,
      },
      include: lessonInclude,
    })

    return NextResponse.json(lesson, { status: 201 })
  } catch (error) {
    logError('COURSE_LESSON_POST', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
