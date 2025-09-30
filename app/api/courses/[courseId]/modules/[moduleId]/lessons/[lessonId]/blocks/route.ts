import { NextRequest, NextResponse } from 'next/server'
import { BlockType, Prisma, UserRole } from '@prisma/client'

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

    const baseContent = typeof body.content === 'string' ? body.content.trim() || null : null
    const baseVideoUrl = typeof body.videoUrl === 'string' ? body.videoUrl.trim() || null : null
    const baseContentUrl = typeof body.contentUrl === 'string' ? body.contentUrl.trim() || null : null

    let content = baseContent
    let videoUrl = baseVideoUrl
    let contentUrl = baseContentUrl
    let liveSessionId: string | null = null
    let liveSessionConfig: Prisma.JsonObject | null = null

    if (type === BlockType.LIVE_SESSION) {
      const now = new Date()
      const scheduledFor = typeof body.scheduledFor === 'string' ? new Date(body.scheduledFor) : new Date(now.getTime() + 60 * 60 * 1000)
      const durationMinutes = typeof body.durationMinutes === 'number' ? body.durationMinutes : 60
      const meetingCode = Math.random().toString(36).slice(2, 8).toUpperCase()
      const meetingId = `BBB-${meetingCode}`
      const joinUrl = baseContentUrl ?? `https://kimpy-virtual-classroom.kimpy.com/${meetingId}`

      const liveSession = await db.liveSession.create({
        data: {
          companyId: company.id,
          courseId,
          hostId: profile.id,
          title,
          description: baseContent,
          scheduledFor,
          durationMinutes,
          meetingUrl: joinUrl,
        },
      })

      liveSessionId = liveSession.id
      liveSessionConfig = {
        provider: 'bigbluebutton',
        meetingId,
        joinUrl,
        dialNumber: '+39 06 1234 5678',
        status: 'offline',
        scheduledFor: liveSession.scheduledFor.toISOString(),
      }

      content ??= 'Simulazione aula virtuale BigBlueButton. Imposta la data reale quando pronta.'
      contentUrl = joinUrl
      videoUrl = null
    }

    const block = await db.lessonBlock.create({
      data: {
        lessonId,
        type,
        title,
        position,
        content,
        videoUrl,
        contentUrl,
        liveSessionId,
        liveSessionConfig,
      },
    })

    await syncLegacyChapterForBlock(block.id)

    return NextResponse.json(block, { status: 201 })
  } catch (error) {
    logError('COURSE_BLOCK_POST', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
