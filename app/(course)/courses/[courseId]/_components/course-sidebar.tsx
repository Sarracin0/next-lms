import { Prisma } from '@prisma/client'

import { CourseProgress } from '@/components/course-progress'
import { requireAuthContext } from '@/lib/current-profile'

import CourseSidebarItem from './course-sidebar-item'

type CourseSidebarProps = {
  course: Prisma.CourseGetPayload<{
    include: {
      chapters: {
        include: {
          userProgress: true
        }
      }
      enrollments: true
    }
  }>
  progressCount: number
}

export default async function CourseSidebar({ course, progressCount }: CourseSidebarProps) {
  const { profile } = await requireAuthContext()

  const enrollment = course.enrollments.find((item) => item.userProfileId === profile.id)

  return (
    <div className="flex h-full flex-col overflow-y-auto border-r shadow-sm">
      <div className="flex flex-col border-b p-8">
        <h1 className="text-lg font-semibold">{course.title}</h1>
        {enrollment ? (
          <div className="mt-10">
            <CourseProgress variant="success" value={progressCount} />
          </div>
        ) : null}
      </div>
      <div className="flex w-full flex-col">
        {course.chapters.map((chapter) => (
          <CourseSidebarItem
            key={chapter.id}
            id={chapter.id}
            label={chapter.title}
            isCompleted={!!chapter.userProgress?.[0]?.isCompleted}
            courseId={course.id}
            isLocked={!chapter.isPreview && !enrollment}
          />
        ))}
      </div>
    </div>
  )
}
