import { redirect } from 'next/navigation'
import { ClipboardList, File, LayoutDashboard, Target } from 'lucide-react'
import { UserRole } from '@prisma/client'

import { Banner } from '@/components/banner'
import { IconBadge } from '@/components/icon-badge'
import { db } from '@/lib/db'
import { requireAuthContext } from '@/lib/current-profile'

import Actions from './_components/actions'
import { AttachmentForm } from './_components/attachment-form'
import CategoryForm from './_components/category-form'
import { ChaptersForm } from './_components/chapters-form'
import { DescriptionForm } from './_components/description-form'
import { ImageForm } from './_components/image-form'
import { MetaForm } from './_components/meta-form'
import { TitleForm } from './_components/title-form'

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

  const categories = await db.category.findMany({
    where: {
      OR: [{ companyId: company.id }, { companyId: null }],
    },
    orderBy: {
      name: 'asc',
    },
  })

  const requiredFields = [
    course.title,
    course.description,
    course.imageUrl,
    course.categoryId,
    course.estimatedDurationMinutes,
    course.chapters.some((chapter) => chapter.isPublished),
  ]

  const totalFields = requiredFields.length
  const completedFields = requiredFields.filter(Boolean).length

  const completionText = `(${completedFields}/${totalFields})`

  const isComplete = requiredFields.every(Boolean)

  return (
    <>
      {!course.isPublished && <Banner label="This course is unpublished. It will not be visible to the students." />}
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-y-2">
            <h1 className="text-2xl font-medium">Course setup</h1>
            <span className="text-sm text-slate-700">Complete all fields {completionText}</span>
          </div>
          <Actions disabled={!isComplete} courseId={resolvedParams.courseId} isPublished={course.isPublished} />
        </div>
        <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <div className="flex items-center gap-x-2">
              <IconBadge icon={LayoutDashboard} />
              <h2 className="text-xl">Customize your course</h2>
            </div>
            <TitleForm initialData={course} courseId={course.id} />
            <DescriptionForm initialData={course} courseId={course.id} />
            <ImageForm initialData={course} courseId={course.id} />
            <CategoryForm
              initialData={course}
              courseId={course.id}
              options={categories.map((category) => ({
                label: category.name,
                value: category.id,
              }))}
            />
          </div>
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-x-2">
                <IconBadge icon={Target} />
                <h2 className="text-xl">Learning structure</h2>
              </div>
              <MetaForm initialData={course} courseId={course.id} />
            </div>
            <div>
              <div className="flex items-center gap-x-2">
                <IconBadge icon={ClipboardList} />
                <h2 className="text-xl">Course chapters</h2>
              </div>
              <ChaptersForm initialData={course} courseId={course.id} />
            </div>
            <div>
              <div className="flex items-center gap-x-2">
                <IconBadge icon={File} />
                <h2 className="text-xl">Resources & Attachments</h2>
              </div>
              <AttachmentForm initialData={course} courseId={course.id} />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default CourseIdPage
