import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'
import { logError } from '@/lib/logger'

import { db } from '@/lib/db'
import { assertRole, requireAuthContext } from '@/lib/current-profile'

type RouteParams = Promise<{
  teamId: string
}>

export async function PATCH(request: NextRequest, { params }: { params: RouteParams }) {
  try {
    const { profile, company } = await requireAuthContext()
    assertRole(profile, UserRole.HR_ADMIN)

    const { teamId } = await params
    const team = await db.companyTeam.findFirst({ where: { id: teamId, companyId: company.id } })

    if (!team) {
      return new NextResponse('Team not found', { status: 404 })
    }

    const { name, description } = await request.json()

    const updatedTeam = await db.companyTeam.update({
      where: { id: teamId },
      data: {
        name: name ?? team.name,
        description: description ?? team.description,
      },
    })

    return NextResponse.json(updatedTeam)
  } catch (error) {
    logError('TEAM_PATCH', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: RouteParams }) {
  try {
    const { profile, company } = await requireAuthContext()
    assertRole(profile, UserRole.HR_ADMIN)

    const { teamId } = await params

    const team = await db.companyTeam.findFirst({ where: { id: teamId, companyId: company.id } })

    if (!team) {
      return new NextResponse('Team not found', { status: 404 })
    }

    await db.companyTeam.delete({ where: { id: teamId } })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    logError('TEAM_DELETE', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
