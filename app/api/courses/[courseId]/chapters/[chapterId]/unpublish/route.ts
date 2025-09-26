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

    const course = await db.course.findFirst({ where: { id: courseId, companyId: company.id } })

    if (!course) {
      return new NextResponse('Course not found', { status: 404 })
    }

    if (profile.role === UserRole.TRAINER && course.createdByProfileId !== profile.id) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const chapter = await db.chapter.update({
      where: { id: chapterId },
      data: { isPublished: false },
    })

    const publishedChapters = await db.chapter.count({ where: { courseId, isPublished: true } })
    if (publishedChapters === 0) {
      await db.course.update({ where: { id: courseId }, data: { isPublished: false } })
    }

    return NextResponse.json(chapter)
  } catch (error) {
    logError('CHAPTER_UNPUBLISH', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
