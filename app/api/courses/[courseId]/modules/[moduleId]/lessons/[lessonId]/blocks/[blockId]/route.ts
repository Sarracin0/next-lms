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
  blockId: string
}>

export async function PATCH(request: NextRequest, { params }: { params: RouteParams }) {
  try {
    const { profile, company } = await requireAuthContext()
    assertRole(profile, [UserRole.HR_ADMIN, UserRole.TRAINER])

    const { courseId, moduleId, lessonId, blockId } = await params

    const blockRecord = await db.lessonBlock.findFirst({
      where: {
        id: blockId,
        lessonId,
        lesson: { moduleId, module: { courseId, course: { companyId: company.id } } },
      },
      include: { lesson: { include: { module: { include: { course: true } } } } },
    })

    if (!blockRecord) {
      return new NextResponse('Block not found', { status: 404 })
    }

    if (profile.role === UserRole.TRAINER && blockRecord.lesson.module.course.createdByProfileId !== profile.id) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const body = await request.json()
    const data: Record<string, unknown> = {}

    if (typeof body.title === 'string') {
      const title = body.title.trim()
      if (!title) {
        return new NextResponse('Block title is required', { status: 400 })
      }
      data.title = title
    }

    if (typeof body.content === 'string') {
      data.content = body.content.trim() || null
    } else if (body.content === null) {
      data.content = null
    }

    if (typeof body.videoUrl === 'string') {
      data.videoUrl = body.videoUrl.trim() || null
    } else if (body.videoUrl === null) {
      data.videoUrl = null
    }

    if (typeof body.contentUrl === 'string') {
      data.contentUrl = body.contentUrl.trim() || null
    } else if (body.contentUrl === null) {
      data.contentUrl = null
    }

    if (typeof body.isPublished === 'boolean') {
      data.isPublished = body.isPublished
    }

    if (typeof body.position === 'number' && Number.isInteger(body.position)) {
      data.position = body.position
    }

    if (typeof body.type === 'string' && Object.values(BlockType).includes(body.type as BlockType)) {
      data.type = body.type as BlockType
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(blockRecord)
    }

    const block = await db.lessonBlock.update({
      where: { id: blockId },
      data,
    })

    await syncLegacyChapterForBlock(blockId)

    return NextResponse.json(block)
  } catch (error) {
    logError('COURSE_BLOCK_PATCH', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: RouteParams }) {
  try {
    const { profile, company } = await requireAuthContext()
    assertRole(profile, [UserRole.HR_ADMIN, UserRole.TRAINER])

    const { courseId, moduleId, lessonId, blockId } = await params

    const blockRecord = await db.lessonBlock.findFirst({
      where: {
        id: blockId,
        lessonId,
        lesson: { moduleId, module: { courseId, course: { companyId: company.id } } },
      },
      include: { lesson: { include: { module: { include: { course: true } } } } },
    })

    if (!blockRecord) {
      return new NextResponse('Block not found', { status: 404 })
    }

    if (profile.role === UserRole.TRAINER && blockRecord.lesson.module.course.createdByProfileId !== profile.id) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    await db.lessonBlock.delete({ where: { id: blockId } })

    if (blockRecord.legacyChapterId) {
      await db.chapter.delete({ where: { id: blockRecord.legacyChapterId } }).catch(() => undefined)
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    logError('COURSE_BLOCK_DELETE', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
