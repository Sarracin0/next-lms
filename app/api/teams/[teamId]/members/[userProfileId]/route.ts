import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'
import { logError } from '@/lib/logger'

import { db } from '@/lib/db'
import { assertRole, requireAuthContext } from '@/lib/current-profile'

type RouteParams = Promise<{
  teamId: string
  userProfileId: string
}>

export async function DELETE(request: NextRequest, { params }: { params: RouteParams }) {
  try {
    const { profile, company } = await requireAuthContext()
    assertRole(profile, [UserRole.HR_ADMIN, UserRole.TRAINER])

    const { teamId, userProfileId } = await params

    const team = await db.companyTeam.findFirst({ where: { id: teamId, companyId: company.id } })

    if (!team) {
      return new NextResponse('Team not found', { status: 404 })
    }

    await db.teamMembership.delete({
      where: {
        teamId_userProfileId: {
          teamId,
          userProfileId,
        },
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    logError('TEAM_MEMBER_DELETE', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
