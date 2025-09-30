import { NextRequest, NextResponse } from 'next/server'
import { AchievementUnlockType, UserRole } from '@prisma/client'

import { db } from '@/lib/db'
import { assertRole, requireAuthContext } from '@/lib/current-profile'
import { logError } from '@/lib/logger'

type RouteParams = Promise<{
  courseId: string
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

export async function GET(_request: NextRequest, { params }: { params: RouteParams }) {
  try {
    const { profile, company } = await requireAuthContext()
    assertRole(profile, [UserRole.HR_ADMIN, UserRole.TRAINER])

    const { courseId } = await params

    const course = await db.course.findFirst({
      where:
        profile.role === UserRole.HR_ADMIN
          ? { id: courseId, companyId: company.id }
          : { id: courseId, companyId: company.id, createdByProfileId: profile.id },
      select: { id: true },
    })

    if (!course) {
      return new NextResponse('Course not found', { status: 404 })
    }

    const achievements = await db.courseAchievement.findMany({
      where: { courseId: course.id },
      include: includeRelations,
      orderBy: { createdAt: 'asc' },
    })

    return NextResponse.json(achievements)
  } catch (error) {
    logError('COURSE_ACHIEVEMENTS_GET', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: RouteParams }) {
  try {
    const { profile, company } = await requireAuthContext()
    assertRole(profile, [UserRole.HR_ADMIN, UserRole.TRAINER])

    const { courseId } = await params
    const payload = await request.json()

    const course = await db.course.findFirst({
      where:
        profile.role === UserRole.HR_ADMIN
          ? { id: courseId, companyId: company.id }
          : { id: courseId, companyId: company.id, createdByProfileId: profile.id },
      select: { id: true },
    })

    if (!course) {
      return new NextResponse('Course not found', { status: 404 })
    }

    const unlockTypeValue = String(payload.unlockType ?? '')
    const unlockType = Object.values(AchievementUnlockType).includes(unlockTypeValue as AchievementUnlockType)
      ? (unlockTypeValue as AchievementUnlockType)
      : null

    if (!unlockType) {
      return new NextResponse('Invalid unlock type', { status: 400 })
    }

    const title = typeof payload.title === 'string' ? payload.title.trim() : ''
    if (!title) {
      return new NextResponse('Title is required', { status: 400 })
    }

    const description = typeof payload.description === 'string' ? payload.description.trim() : undefined

    const pointsReward = Number.isFinite(payload.pointsReward) ? Math.max(0, Math.trunc(payload.pointsReward)) : 0

    let targetModuleId: string | null = null
    if (unlockType === AchievementUnlockType.MODULE_COMPLETION) {
      targetModuleId = typeof payload.targetModuleId === 'string' ? payload.targetModuleId : null
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
    }

    const icon = typeof payload.icon === 'string' ? payload.icon.trim() || null : null

    const achievement = await db.courseAchievement.create({
      data: {
        courseId: course.id,
        title,
        description: description ?? null,
        unlockType,
        targetModuleId,
        pointsReward,
        icon,
        createdByProfileId: profile.id,
      },
      include: includeRelations,
    })

    return NextResponse.json(achievement, { status: 201 })
  } catch (error) {
    logError('COURSE_ACHIEVEMENTS_POST', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
