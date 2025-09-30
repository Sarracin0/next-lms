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
  lessonId: string
}>

export async function PATCH(request: NextRequest, { params }: { params: RouteParams }) {
  try {
    const { profile, company } = await requireAuthContext()
    assertRole(profile, [UserRole.HR_ADMIN, UserRole.TRAINER])

    const { courseId, moduleId, lessonId } = await params

    const lessonRecord = await db.lesson.findFirst({
      where: { id: lessonId, moduleId, module: { courseId, course: { companyId: company.id } } },
      include: { module: { include: { course: true } } },
    })

    if (!lessonRecord) {
      return new NextResponse('Lesson not found', { status: 404 })
    }

    if (profile.role === UserRole.TRAINER && lessonRecord.module.course.createdByProfileId !== profile.id) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (typeof body.title === 'string') {
      const title = body.title.trim()
      if (!title) {
        return new NextResponse('Lesson title is required', { status: 400 })
      }
      data.title = title
    }

    if (typeof body.description === 'string') {
      data.description = body.description.trim() || null
    } else if (body.description === null) {
      data.description = null
    }

    if (typeof body.isPublished === 'boolean') {
      data.isPublished = body.isPublished
    }

    if (typeof body.position === 'number' && Number.isInteger(body.position)) {
      data.position = body.position
    }

    if (typeof body.estimatedDurationMinutes === 'number' || body.estimatedDurationMinutes === null) {
      data.estimatedDurationMinutes = body.estimatedDurationMinutes
    }

    if (typeof body.isPreview === 'boolean') {
      data.isPreview = body.isPreview
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(lessonRecord)
    }

    const lesson = await db.lesson.update({
      where: { id: lessonId },
      data,
      include: lessonInclude,
    })

    return NextResponse.json(lesson)
  } catch (error) {
    logError('COURSE_LESSON_PATCH', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: RouteParams }) {
  try {
    const { profile, company } = await requireAuthContext()
    assertRole(profile, [UserRole.HR_ADMIN, UserRole.TRAINER])

    const { courseId, moduleId, lessonId } = await params

    const lessonRecord = await db.lesson.findFirst({
      where: { id: lessonId, moduleId, module: { courseId, course: { companyId: company.id } } },
      include: { module: { include: { course: true } } },
    })

    if (!lessonRecord) {
      return new NextResponse('Lesson not found', { status: 404 })
    }

    if (profile.role === UserRole.TRAINER && lessonRecord.module.course.createdByProfileId !== profile.id) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    await db.lesson.delete({ where: { id: lessonId } })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    logError('COURSE_LESSON_DELETE', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
