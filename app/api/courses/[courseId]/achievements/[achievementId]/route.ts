import { NextRequest, NextResponse } from 'next/server'
import { AchievementUnlockType, UserRole } from '@prisma/client'

import { db } from '@/lib/db'
import { assertRole, requireAuthContext } from '@/lib/current-profile'
import { logError } from '@/lib/logger'

type RouteParams = Promise<{
  courseId: string
  achievementId: string
}>

const includeRelations = {
  targetModule: {
    select: {
      id: true,
      title: true,
    },
  },
  targetLesson: {
    select: {
      id: true,
      title: true,
    },
  },
}

const courseAccessWhere = (profileRole: UserRole, courseId: string, companyId: string, createdByProfileId: string) =>
  profileRole === UserRole.HR_ADMIN
    ? { id: courseId, companyId }
    : { id: courseId, companyId, createdByProfileId }

export async function PATCH(request: NextRequest, { params }: { params: RouteParams }) {
  try {
    const { profile, company } = await requireAuthContext()
    assertRole(profile, [UserRole.HR_ADMIN, UserRole.TRAINER])

    const { courseId, achievementId } = await params
    const payload = await request.json()

    const course = await db.course.findFirst({
      where: courseAccessWhere(profile.role, courseId, company.id, profile.id),
      select: { id: true },
    })

    if (!course) {
      return new NextResponse('Course not found', { status: 404 })
    }

    const achievement = await db.courseAchievement.findFirst({
      where: { id: achievementId, courseId: course.id },
    })

    if (!achievement) {
      return new NextResponse('Achievement not found', { status: 404 })
    }

    const data: Record<string, unknown> = {}

    if (typeof payload.title === 'string') {
      const title = payload.title.trim()
      if (!title) {
        return new NextResponse('Title cannot be empty', { status: 400 })
      }
      data.title = title
    }

    if (typeof payload.description === 'string') {
      data.description = payload.description.trim() || null
    } else if (payload.description === null) {
      data.description = null
    }

    if (Number.isFinite(payload.pointsReward)) {
      data.pointsReward = Math.max(0, Math.trunc(payload.pointsReward))
    }

    if (typeof payload.icon === 'string') {
      data.icon = payload.icon.trim() || null
    }

    if (typeof payload.isActive === 'boolean') {
      data.isActive = payload.isActive
    }

    if (achievement.unlockType === AchievementUnlockType.MODULE_COMPLETION) {
      if (Object.prototype.hasOwnProperty.call(payload, 'targetModuleId')) {
        const targetModuleId = typeof payload.targetModuleId === 'string' ? payload.targetModuleId : null

        if (!targetModuleId) {
          return new NextResponse('Module is required for module completion achievements', { status: 400 })
        }

        const module = await db.courseModule.findFirst({
          where: { id: targetModuleId, courseId: course.id },
          select: { id: true },
        })

        if (!module) {
          return new NextResponse('Module not found for this course', { status: 400 })
        }

        data.targetModuleId = targetModuleId
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(achievement)
    }

    const updated = await db.courseAchievement.update({
      where: { id: achievement.id },
      data,
      include: includeRelations,
    })

    return NextResponse.json(updated)
  } catch (error) {
    logError('COURSE_ACHIEVEMENT_PATCH', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: RouteParams }) {
  try {
    const { profile, company } = await requireAuthContext()
    assertRole(profile, [UserRole.HR_ADMIN, UserRole.TRAINER])

    const { courseId, achievementId } = await params

    const course = await db.course.findFirst({
      where: courseAccessWhere(profile.role, courseId, company.id, profile.id),
      select: { id: true },
    })

    if (!course) {
      return new NextResponse('Course not found', { status: 404 })
    }

    const achievement = await db.courseAchievement.findFirst({
      where: { id: achievementId, courseId: course.id },
      select: { id: true },
    })

    if (!achievement) {
      return new NextResponse('Achievement not found', { status: 404 })
    }

    await db.courseAchievement.delete({ where: { id: achievement.id } })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    logError('COURSE_ACHIEVEMENT_DELETE', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
