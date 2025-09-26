import { NextRequest, NextResponse } from 'next/server'
import { TeamRole, UserRole } from '@prisma/client'
import { logError } from '@/lib/logger'

import { db } from '@/lib/db'
import { assertRole, requireAuthContext } from '@/lib/current-profile'

type RouteParams = Promise<{
  teamId: string
}>

export async function POST(request: NextRequest, { params }: { params: RouteParams }) {
  try {
    const { profile, company } = await requireAuthContext()
    assertRole(profile, [UserRole.HR_ADMIN, UserRole.TRAINER])

    const { teamId } = await params
    const { userProfileId, role } = await request.json()

    const team = await db.companyTeam.findFirst({ where: { id: teamId, companyId: company.id } })

    if (!team) {
      return new NextResponse('Team not found', { status: 404 })
    }

    const targetProfile = await db.userProfile.findFirst({ where: { id: userProfileId, companyId: company.id } })

    if (!targetProfile) {
      return new NextResponse('User not found in company', { status: 404 })
    }

    const membership = await db.teamMembership.upsert({
      where: {
        teamId_userProfileId: {
          teamId,
          userProfileId,
        },
      },
      create: {
        teamId,
        userProfileId,
        role: role ?? TeamRole.MEMBER,
      },
      update: {
        role: role ?? TeamRole.MEMBER,
      },
    })

    return NextResponse.json(membership, { status: 201 })
  } catch (error) {
    logError('TEAM_MEMBER_POST', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
