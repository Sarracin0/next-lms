import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'
import { logError } from '@/lib/logger'

import { db } from '@/lib/db'
import { assertRole, requireAuthContext } from '@/lib/current-profile'

type RouteParams = Promise<{
  sessionId: string
}>

export async function PATCH(request: NextRequest, { params }: { params: RouteParams }) {
  try {
    const { sessionId } = await params
    const { profile, company } = await requireAuthContext()
    assertRole(profile, [UserRole.HR_ADMIN, UserRole.TRAINER])

    const session = await db.liveSession.findFirst({ where: { id: sessionId, companyId: company.id } })

    if (!session) {
      return new NextResponse('Live session not found', { status: 404 })
    }

    if (profile.role === UserRole.TRAINER && session.hostId !== profile.id) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const payload = await request.json()

    const updatedSession = await db.liveSession.update({
      where: { id: sessionId },
      data: {
        title: payload.title ?? session.title,
        description: payload.description ?? session.description,
        scheduledFor: payload.scheduledFor ? new Date(payload.scheduledFor) : undefined,
        durationMinutes:
          typeof payload.durationMinutes === 'number' ? payload.durationMinutes : undefined,
        meetingUrl: payload.meetingUrl ?? session.meetingUrl,
        recordingUrl: payload.recordingUrl ?? session.recordingUrl,
      },
    })

    return NextResponse.json(updatedSession)
  } catch (error) {
    logError('LIVE_SESSION_PATCH', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: RouteParams }) {
  try {
    const { sessionId } = await params
    const { profile, company } = await requireAuthContext()
    assertRole(profile, [UserRole.HR_ADMIN, UserRole.TRAINER])

    const session = await db.liveSession.findFirst({ where: { id: sessionId, companyId: company.id } })

    if (!session) {
      return new NextResponse('Live session not found', { status: 404 })
    }

    if (profile.role === UserRole.TRAINER && session.hostId !== profile.id) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    await db.liveSession.delete({ where: { id: sessionId } })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    logError('LIVE_SESSION_DELETE', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
