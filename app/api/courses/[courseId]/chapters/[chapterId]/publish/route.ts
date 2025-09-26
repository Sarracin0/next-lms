import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'
import { logError } from '@/lib/logger'

import { db } from '@/lib/db'
import { requireAuthContext } from '@/lib/current-profile'

type RouteParams = Promise<{
  courseId: string
  chapterId: string
}>

export async function PATCH(request: NextRequest, { params }: { params: RouteParams }) {
  try {
    const { courseId, chapterId } = await params
    const { profile, company } = await requireAuthContext()

    const course = await db.course.findFirst({
      where: { id: courseId, companyId: company.id },
      select: { createdByProfileId: true },
    })

    if (!course) {
      return new NextResponse('Course not found', { status: 404 })
    }

    if (profile.role === UserRole.TRAINER && course.createdByProfileId !== profile.id) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const chapter = await db.chapter.findUnique({ where: { id: chapterId, courseId } })

    if (!chapter) {
      return new NextResponse('Chapter not found', { status: 404 })
    }

    if (!chapter.title || !chapter.description || (!chapter.videoUrl && !chapter.contentUrl)) {
      return new NextResponse('Missing required content for publication', { status: 400 })
    }

    const publishedChapter = await db.chapter.update({
      where: { id: chapterId },
      data: { isPublished: true },
    })

    return NextResponse.json(publishedChapter)
  } catch (error) {
    logError('CHAPTER_PUBLISH', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
