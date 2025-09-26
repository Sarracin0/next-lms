import { NextRequest, NextResponse } from 'next/server'
import { BadgeType, UserRole } from '@prisma/client'
import { logError } from '@/lib/logger'

import { db } from '@/lib/db'
import { assertRole, requireAuthContext } from '@/lib/current-profile'

export async function GET() {
  try {
    const { company } = await requireAuthContext()

    const badges = await db.badge.findMany({
      where: { OR: [{ companyId: company.id }, { companyId: null }] },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(badges)
  } catch (error) {
    logError('BADGES_GET', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { profile, company } = await requireAuthContext()
    assertRole(profile, [UserRole.HR_ADMIN, UserRole.TRAINER])

    const { name, description, icon, type, pointsReward, criteria } = await request.json()

    if (!name) {
      return new NextResponse('Badge name is required', { status: 400 })
    }

    const badge = await db.badge.create({
      data: {
        name,
        description,
        icon,
        type: Object.values(BadgeType).includes(type) ? type : BadgeType.CUSTOM,
        pointsReward: typeof pointsReward === 'number' ? pointsReward : 0,
        criteria: criteria ?? null,
        companyId: company.id,
      },
    })

    return NextResponse.json(badge, { status: 201 })
  } catch (error) {
    logError('BADGES_POST', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
