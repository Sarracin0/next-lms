import { redirect } from 'next/navigation'

import { db } from '@/lib/db'
import { requireAuthContext } from '@/lib/current-profile'

const CourseIdPage = async ({ params }: { params: Promise<{ courseId: string }> }) => {
  const { courseId } = await params
  const { company } = await requireAuthContext()

  const course = await db.course.findFirst({
    where: {
      id: courseId,
      companyId: company.id,
      isPublished: true,
    },
    include: {
      chapters: {
        where: { isPublished: true },
        orderBy: { position: 'asc' },
      },
    },
  })

  if (!course || course.chapters.length === 0) {
    return redirect('/courses')
  }

  return redirect(`/courses/${course.id}/chapters/${course.chapters[0].id}`)
}

export default CourseIdPage
