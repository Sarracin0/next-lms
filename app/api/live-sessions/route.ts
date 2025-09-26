import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'
import { logError } from '@/lib/logger'

import { db } from '@/lib/db'
import { assertRole, requireAuthContext } from '@/lib/current-profile'

export async function GET() {
  try {
    const { company } = await requireAuthContext()

    const sessions = await db.liveSession.findMany({
      where: { companyId: company.id },
      include: {
        course: { select: { id: true, title: true } },
        host: { select: { id: true, userId: true, role: true, avatarUrl: true } },
      },
      orderBy: { scheduledFor: 'asc' },
    })

    return NextResponse.json(sessions)
  } catch (error) {
    logError('LIVE_SESSIONS_GET', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { profile, company } = await requireAuthContext()
    assertRole(profile, [UserRole.HR_ADMIN, UserRole.TRAINER])

    const { courseId, title, description, scheduledFor, durationMinutes, meetingUrl, recordingUrl } =
      await request.json()

    if (!courseId || !title || !scheduledFor) {
      return new NextResponse('Missing required fields', { status: 400 })
    }

    const course = await db.course.findFirst({ where: { id: courseId, companyId: company.id } })

    if (!course) {
      return new NextResponse('Course not found', { status: 404 })
    }

    const session = await db.liveSession.create({
      data: {
        courseId,
        companyId: company.id,
        hostId: profile.id,
        title,
        description,
        scheduledFor: new Date(scheduledFor),
        durationMinutes: typeof durationMinutes === 'number' ? durationMinutes : null,
        meetingUrl,
        recordingUrl,
      },
    })

    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    logError('LIVE_SESSIONS_POST', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
