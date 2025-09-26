import { NextRequest, NextResponse } from 'next/server'
import { BadgeType, UserRole } from '@prisma/client'
import { logError } from '@/lib/logger'

import { db } from '@/lib/db'
import { assertRole, requireAuthContext } from '@/lib/current-profile'

type RouteParams = Promise<{
  badgeId: string
}>

export async function PATCH(request: NextRequest, { params }: { params: RouteParams }) {
  try {
    const { profile, company } = await requireAuthContext()
    assertRole(profile, [UserRole.HR_ADMIN, UserRole.TRAINER])

    const { badgeId } = await params
    const badge = await db.badge.findFirst({ where: { id: badgeId, companyId: company.id } })

    if (!badge) {
      return new NextResponse('Badge not found', { status: 404 })
    }

    const payload = await request.json()

    const updatedBadge = await db.badge.update({
      where: { id: badgeId },
      data: {
        name: payload.name ?? badge.name,
        description: payload.description ?? badge.description,
        icon: payload.icon ?? badge.icon,
        type: payload.type && Object.values(BadgeType).includes(payload.type) ? payload.type : undefined,
        pointsReward: typeof payload.pointsReward === 'number' ? payload.pointsReward : undefined,
        criteria: payload.criteria ?? badge.criteria,
      },
    })

    return NextResponse.json(updatedBadge)
  } catch (error) {
    logError('BADGES_PATCH', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: RouteParams }) {
  try {
    const { profile, company } = await requireAuthContext()
    assertRole(profile, [UserRole.HR_ADMIN, UserRole.TRAINER])

    const { badgeId } = await params

    const badge = await db.badge.findFirst({ where: { id: badgeId, companyId: company.id } })

    if (!badge) {
      return new NextResponse('Badge not found', { status: 404 })
    }

    await db.badge.delete({ where: { id: badgeId } })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    logError('BADGES_DELETE', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
