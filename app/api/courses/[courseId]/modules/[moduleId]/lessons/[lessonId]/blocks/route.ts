import { NextRequest, NextResponse } from 'next/server'
import { BlockType, UserRole } from '@prisma/client'

import { db } from '@/lib/db'
import { assertRole, requireAuthContext } from '@/lib/current-profile'
import { logError } from '@/lib/logger'
import { syncLegacyChapterForBlock } from '@/lib/sync-legacy-chapter'

type RouteParams = Promise<{
  courseId: string
  moduleId: string
  lessonId: string
}>

export async function POST(request: NextRequest, { params }: { params: RouteParams }) {
  try {
    const { profile, company } = await requireAuthContext()
    assertRole(profile, [UserRole.HR_ADMIN, UserRole.TRAINER])

    const { courseId, moduleId, lessonId } = await params

    const lessonRecord = await db.lesson.findFirst({
      where: { id: lessonId, moduleId, module: { courseId, course: { companyId: company.id } } },
      include: { module: { include: { course: true } }, blocks: true },
    })

    if (!lessonRecord) {
      return new NextResponse('Lesson not found', { status: 404 })
    }

    if (profile.role === UserRole.TRAINER && lessonRecord.module.course.createdByProfileId !== profile.id) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const body = await request.json()
    const typeValue = typeof body.type === 'string' ? body.type : ''
    const type = Object.values(BlockType).includes(typeValue as BlockType)
      ? (typeValue as BlockType)
      : null

    if (!type) {
      return new NextResponse('Invalid block type', { status: 400 })
    }

    const title = typeof body.title === 'string' ? body.title.trim() : ''
    if (!title) {
      return new NextResponse('Block title is required', { status: 400 })
    }

    const position =
      lessonRecord.blocks.length > 0
        ? Math.max(...lessonRecord.blocks.map((block) => block.position)) + 1
        : 1

    const block = await db.lessonBlock.create({
      data: {
        lessonId,
        type,
        title,
        position,
        content: typeof body.content === 'string' ? body.content.trim() || null : null,
        videoUrl: typeof body.videoUrl === 'string' ? body.videoUrl.trim() || null : null,
        contentUrl: typeof body.contentUrl === 'string' ? body.contentUrl.trim() || null : null,
      },
    })

    await syncLegacyChapterForBlock(block.id)

    return NextResponse.json(block, { status: 201 })
  } catch (error) {
    logError('COURSE_BLOCK_POST', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
