import { AchievementUnlockType, PointsType } from '@prisma/client'

import { db } from './db'
import { getProgress } from '@/actions/get-progress'

type EvaluateCourseAchievementsOptions = {
  courseId: string
  userProfileId: string
  progressPercentage?: number
}

type ModuleChaptersMap = Record<string, string[]>

type AchievementEligibilityContext = {
  completedChapterIds: Set<string>
  moduleChapters: ModuleChaptersMap
  progressPercentage: number
}

const buildModuleChapterMap = async (moduleIds: string[]): Promise<ModuleChaptersMap> => {
  if (moduleIds.length === 0) {
    return {}
  }

  const blocks = await db.lessonBlock.findMany({
    where: {
      lesson: {
        moduleId: { in: moduleIds },
      },
      legacyChapterId: { not: null },
    },
    select: {
      legacyChapterId: true,
      lesson: {
        select: {
          moduleId: true,
        },
      },
    },
  })

  return blocks.reduce<ModuleChaptersMap>((accumulator, block) => {
    const moduleId = block.lesson.moduleId
    if (!block.legacyChapterId) {
      return accumulator
    }

    if (!accumulator[moduleId]) {
      accumulator[moduleId] = []
    }

    if (!accumulator[moduleId].includes(block.legacyChapterId)) {
      accumulator[moduleId].push(block.legacyChapterId)
    }
    return accumulator
  }, {})
}

const isAchievementEligible = (
  unlockType: AchievementUnlockType,
  context: AchievementEligibilityContext,
  achievement: {
    targetModuleId?: string | null
  },
): boolean => {
  switch (unlockType) {
    case AchievementUnlockType.FIRST_CHAPTER:
      return context.completedChapterIds.size > 0
    case AchievementUnlockType.MODULE_COMPLETION: {
      const moduleId = achievement.targetModuleId
      if (!moduleId) {
        return false
      }
      const chapters = context.moduleChapters[moduleId] ?? []
      if (chapters.length === 0) {
        return false
      }
      return chapters.every((chapterId) => context.completedChapterIds.has(chapterId))
    }
    case AchievementUnlockType.COURSE_COMPLETION:
      return context.progressPercentage >= 100
    default:
      return false
  }
}

export const evaluateCourseAchievements = async ({
  courseId,
  userProfileId,
  progressPercentage,
}: EvaluateCourseAchievementsOptions) => {
  const achievements = await db.courseAchievement.findMany({
    where: {
      courseId,
      isActive: true,
    },
  })

  if (achievements.length === 0) {
    return
  }

  const awarded = await db.userCourseAchievement.findMany({
    where: {
      userProfileId,
      achievement: {
        courseId,
      },
    },
    select: { achievementId: true },
  })

  const alreadyAwardedIds = new Set(awarded.map((item) => item.achievementId))

  const chapterProgress = await db.userProgress.findMany({
    where: {
      userProfileId,
      isCompleted: true,
      chapter: {
        courseId,
      },
    },
    select: { chapterId: true },
  })

  const completedChapterIds = new Set(chapterProgress.map((item) => item.chapterId))

  const moduleIds = achievements
    .filter((item) => item.unlockType === AchievementUnlockType.MODULE_COMPLETION && item.targetModuleId)
    .map((item) => item.targetModuleId as string)

  const moduleChapters = await buildModuleChapterMap(Array.from(new Set(moduleIds)))

  const computedProgress =
    typeof progressPercentage === 'number' ? progressPercentage : await getProgress(userProfileId, courseId)

  const context: AchievementEligibilityContext = {
    completedChapterIds,
    moduleChapters,
    progressPercentage: computedProgress,
  }

  for (const achievement of achievements) {
    if (alreadyAwardedIds.has(achievement.id)) {
      continue
    }

    if (!isAchievementEligible(achievement.unlockType, context, achievement)) {
      continue
    }

    const pointsReward = Math.max(0, achievement.pointsReward || 0)

    await db.$transaction(async (transaction) => {
      await transaction.userCourseAchievement.create({
        data: {
          achievementId: achievement.id,
          userProfileId,
          pointsAwarded: pointsReward,
        },
      })

      if (pointsReward > 0) {
        await transaction.userProfile.update({
          where: { id: userProfileId },
          data: { points: { increment: pointsReward } },
        })

        await transaction.userPoints.create({
          data: {
            userProfileId,
            delta: pointsReward,
            type: PointsType.BONUS,
            referenceId: achievement.id,
            reason: `Achievement unlocked: ${achievement.title}`,
          },
        })
      }
    })
  }
}
