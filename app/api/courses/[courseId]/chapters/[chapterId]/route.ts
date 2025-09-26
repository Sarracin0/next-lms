import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'
import { logError } from '@/lib/logger'

import { db } from '@/lib/db'
import { assertRole, requireAuthContext } from '@/lib/current-profile'

type RouteParams = Promise<{
  courseId: string
  chapterId: string
}>

export async function PATCH(request: NextRequest, { params }: { params: RouteParams }) {
  try {
    const { courseId, chapterId } = await params
    const { profile, company } = await requireAuthContext()
    assertRole(profile, [UserRole.HR_ADMIN, UserRole.TRAINER])

    const course = await db.course.findFirst({ where: { id: courseId, companyId: company.id } })

    if (!course) {
      return new NextResponse('Course not found', { status: 404 })
    }

    if (profile.role === UserRole.TRAINER && course.createdByProfileId !== profile.id) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const chapterRecord = await db.chapter.findFirst({ where: { id: chapterId, courseId } })

    if (!chapterRecord) {
      return new NextResponse('Chapter not found', { status: 404 })
    }

    const payload = await request.json()

    const chapter = await db.chapter.update({
      where: { id: chapterId },
      data: {
        title: payload.title,
        description: payload.description,
        videoUrl: payload.videoUrl,
        contentUrl: payload.contentUrl,
        isPublished: typeof payload.isPublished === 'boolean' ? payload.isPublished : undefined,
        isPreview: typeof payload.isPreview === 'boolean' ? payload.isPreview : undefined,
        position: typeof payload.position === 'number' ? payload.position : undefined,
        estimatedDurationMinutes:
          typeof payload.estimatedDurationMinutes === 'number' ? payload.estimatedDurationMinutes : undefined,
      },
    })

    return NextResponse.json(chapter)
  } catch (error) {
    logError('CHAPTER_PATCH', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: RouteParams }) {
  try {
    const { courseId, chapterId } = await params
    const { profile, company } = await requireAuthContext()
    assertRole(profile, [UserRole.HR_ADMIN, UserRole.TRAINER])

    const course = await db.course.findFirst({ where: { id: courseId, companyId: company.id } })

    if (!course) {
      return new NextResponse('Course not found', { status: 404 })
    }

    if (profile.role === UserRole.TRAINER && course.createdByProfileId !== profile.id) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const deleted = await db.chapter.deleteMany({ where: { id: chapterId, courseId } })

    if (deleted.count === 0) {
      return new NextResponse('Chapter not found', { status: 404 })
    }

    const publishedChapters = await db.chapter.count({ where: { courseId, isPublished: true } })
    if (publishedChapters === 0) {
      await db.course.update({ where: { id: courseId }, data: { isPublished: false } })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    logError('CHAPTER_DELETE', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
