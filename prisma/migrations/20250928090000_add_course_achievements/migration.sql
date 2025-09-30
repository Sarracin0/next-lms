-- CreateEnum
CREATE TYPE "AchievementUnlockType" AS ENUM ('FIRST_CHAPTER', 'MODULE_COMPLETION', 'COURSE_COMPLETION');

-- CreateTable
CREATE TABLE "CourseAchievement" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "unlockType" "AchievementUnlockType" NOT NULL,
    "targetModuleId" TEXT,
    "targetLessonId" TEXT,
    "pointsReward" INTEGER NOT NULL DEFAULT 0,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdByProfileId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCourseAchievement" (
    "id" TEXT NOT NULL,
    "userProfileId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "awardedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserCourseAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourseAchievement_courseId_idx" ON "CourseAchievement"("courseId");

-- CreateIndex
CREATE INDEX "CourseAchievement_targetModuleId_idx" ON "CourseAchievement"("targetModuleId");

-- CreateIndex
CREATE INDEX "CourseAchievement_targetLessonId_idx" ON "CourseAchievement"("targetLessonId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCourseAchievement_userProfileId_achievementId_key" ON "UserCourseAchievement"("userProfileId", "achievementId");

-- AddForeignKey
ALTER TABLE "CourseAchievement" ADD CONSTRAINT "CourseAchievement_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseAchievement" ADD CONSTRAINT "CourseAchievement_createdByProfileId_fkey" FOREIGN KEY ("createdByProfileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseAchievement" ADD CONSTRAINT "CourseAchievement_targetModuleId_fkey" FOREIGN KEY ("targetModuleId") REFERENCES "CourseModule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseAchievement" ADD CONSTRAINT "CourseAchievement_targetLessonId_fkey" FOREIGN KEY ("targetLessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCourseAchievement" ADD CONSTRAINT "UserCourseAchievement_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCourseAchievement" ADD CONSTRAINT "UserCourseAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "CourseAchievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
