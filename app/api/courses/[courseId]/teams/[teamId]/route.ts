import { NextRequest, NextResponse } from 'next/server'
import { UserRole } from '@prisma/client'
import { logError } from '@/lib/logger'

import { db } from '@/lib/db'
import { assertRole, requireAuthContext } from '@/lib/current-profile'

type RouteParams = Promise<{
  courseId: string
  teamId: string
}>

export async function DELETE(request: NextRequest, { params }: { params: RouteParams }) {
  try {
    const { courseId, teamId } = await params
    const { profile, company } = await requireAuthContext()
    assertRole(profile, [UserRole.HR_ADMIN, UserRole.TRAINER])

    const assignment = await db.courseTeamAssignment.findFirst({
      where: { courseId, teamId, course: { companyId: company.id } },
    })

    if (!assignment) {
      return new NextResponse('Assignment not found', { status: 404 })
    }

    if (profile.role === UserRole.TRAINER && assignment.assignedById !== profile.id) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    await db.courseTeamAssignment.delete({ where: { id: assignment.id } })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    logError('COURSE_TEAM_ASSIGN_DELETE', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
