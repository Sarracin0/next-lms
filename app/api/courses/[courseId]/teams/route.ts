import { NextRequest, NextResponse } from 'next/server'
import { CourseEnrollmentSource, UserRole } from '@prisma/client'
import { logError } from '@/lib/logger'

import { db } from '@/lib/db'
import { assertRole, requireAuthContext } from '@/lib/current-profile'

type RouteParams = Promise<{
  courseId: string
}>

export async function POST(request: NextRequest, { params }: { params: RouteParams }) {
  try {
    const { courseId } = await params
    const { profile, company } = await requireAuthContext()
    assertRole(profile, [UserRole.HR_ADMIN, UserRole.TRAINER])

    const { teamId } = await request.json()

    if (!teamId) {
      return new NextResponse('Team id is required', { status: 400 })
    }

    const [course, team] = await Promise.all([
      db.course.findFirst({ where: { id: courseId, companyId: company.id } }),
      db.companyTeam.findFirst({ where: { id: teamId, companyId: company.id } }),
    ])

    if (!course || !team) {
      return new NextResponse('Course or team not found', { status: 404 })
    }

    if (profile.role === UserRole.TRAINER && course.createdByProfileId !== profile.id) {
      return new NextResponse('Forbidden', { status: 403 })
    }

    const assignment = await db.courseTeamAssignment.upsert({
      where: {
        courseId_teamId: {
          courseId,
          teamId,
        },
      },
      update: {},
      create: {
        courseId,
        teamId,
        assignedById: profile.id,
      },
    })

    // Sync team members into enrollments for new assignment
    const teamMemberIds = await db.teamMembership.findMany({
      where: { teamId },
      select: { userProfileId: true },
    })

    await Promise.all(
      teamMemberIds.map((member) =>
        db.courseEnrollment.upsert({
          where: {
            courseId_userProfileId: {
              courseId,
              userProfileId: member.userProfileId,
            },
          },
          update: {},
          create: {
            courseId,
            userProfileId: member.userProfileId,
            assignedById: profile.id,
            source: CourseEnrollmentSource.TEAM,
          },
        }),
      ),
    )

    return NextResponse.json(assignment, { status: 201 })
  } catch (error) {
    logError('COURSE_TEAM_ASSIGN_POST', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
