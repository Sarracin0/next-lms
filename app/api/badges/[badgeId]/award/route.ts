import { NextRequest, NextResponse } from 'next/server'
import { PointsType, UserRole } from '@prisma/client'
import { logError } from '@/lib/logger'

import { db } from '@/lib/db'
import { assertRole, requireAuthContext } from '@/lib/current-profile'

type RouteParams = Promise<{
  badgeId: string
}>

export async function POST(request: NextRequest, { params }: { params: RouteParams }) {
  try {
    const { profile, company } = await requireAuthContext()
    assertRole(profile, [UserRole.HR_ADMIN, UserRole.TRAINER])

    const { badgeId } = await params
    const { userProfileId, context } = await request.json()

    const badge = await db.badge.findFirst({
      where: {
        id: badgeId,
        OR: [{ companyId: company.id }, { companyId: null }],
      },
    })

    if (!badge) {
      return new NextResponse('Badge not found', { status: 404 })
    }

    const targetProfile = await db.userProfile.findFirst({
      where: { id: userProfileId, companyId: company.id },
    })

    if (!targetProfile) {
      return new NextResponse('User not found', { status: 404 })
    }

    const existingAward = await db.userBadge.findUnique({
      where: {
        userProfileId_badgeId: {
          userProfileId,
          badgeId,
        },
      },
    })

    const awardedBadge = await db.userBadge.upsert({
      where: {
        userProfileId_badgeId: {
          userProfileId,
          badgeId,
        },
      },
      update: {
        awardedAt: new Date(),
        awardedById: profile.id,
        context: context ?? null,
      },
      create: {
        userProfileId,
        badgeId,
        awardedById: profile.id,
        context: context ?? null,
      },
    })

    if (!existingAward && badge.pointsReward && badge.pointsReward > 0) {
      await db.$transaction([
        db.userProfile.update({
          where: { id: userProfileId },
          data: { points: { increment: badge.pointsReward } },
        }),
        db.userPoints.create({
          data: {
            userProfileId,
            delta: badge.pointsReward,
            type: PointsType.BONUS,
            reason: `Badge awarded: ${badge.name}`,
            referenceId: badge.id,
          },
        }),
      ])
    }

    return NextResponse.json(awardedBadge, { status: 201 })
  } catch (error) {
    logError('BADGE_AWARD', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
