import { redirect } from 'next/navigation'
import { UserRole } from '@prisma/client'

import { Banner } from '@/components/banner'
import { db } from '@/lib/db'
import { requireAuthContext } from '@/lib/current-profile'

import CourseBuilderWizard from './_components/course-builder-wizard'

type CourseIdPageProps = {
  params: Promise<{
    courseId: string
  }>
}

const CourseIdPage = async ({ params }: CourseIdPageProps) => {
  const resolvedParams = await params
  const { profile, company } = await requireAuthContext()

  const course = await db.course.findFirst({
    where:
      profile.role === UserRole.HR_ADMIN
        ? { id: resolvedParams.courseId, companyId: company.id }
        : { id: resolvedParams.courseId, companyId: company.id, createdByProfileId: profile.id },
    include: {
      attachments: { orderBy: { createdAt: 'desc' } },
      chapters: { orderBy: { position: 'asc' } },
    },
  })

  if (!course) {
    return redirect('/manage/courses')
  }

  const hasPublishedChapter = course.chapters.some((chapter) => chapter.isPublished)
  const hasLessonMedia = course.chapters.some((chapter) => chapter.videoUrl || chapter.contentUrl)
  const hasSupportingResources = course.attachments.length > 0

  const recommended = [
    {
      id: 'basics',
      label: 'Course basics saved',
      helper: 'Title and overview added',
      isComplete: Boolean(course.title && course.description),
    },
    {
      id: 'lessons',
      label: 'At least one lesson published',
      helper: 'Keep lessons as drafts until ready',
      isComplete: hasPublishedChapter,
    },
    {
      id: 'media',
      label: 'Lesson media added',
      helper: 'Upload or link a video',
      isComplete: hasLessonMedia,
    },
    {
      id: 'resources',
      label: 'Supporting resources attached',
      helper: 'Optional slides, PDFs or links',
      isComplete: hasSupportingResources,
    },
  ]

  const totalFields = recommended.length
  const completedFields = recommended.filter((item) => item.isComplete).length

  const completionText = `(${completedFields}/${totalFields})`

  const isComplete = completedFields === totalFields

  return (
    <>
      {!course.isPublished && <Banner label="This course is unpublished. It will not be visible to the students." />}
      <div className="p-6">
        <CourseBuilderWizard
          course={course}
          courseId={course.id}
          completion={{
            completed: completedFields,
            total: totalFields,
            text: completionText,
            isComplete,
            items: recommended,
          }}
        />
      </div>
    </>
  )
}

export default CourseIdPage
