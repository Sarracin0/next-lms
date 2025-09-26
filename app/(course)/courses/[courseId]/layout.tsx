import { redirect } from 'next/navigation'

import { getProgress } from '@/actions/get-progress'
import { db } from '@/lib/db'
import { requireAuthContext } from '@/lib/current-profile'

import CourseNavbar from './_components/course-navbar'
import CourseSidebar from './_components/course-sidebar'

type CourseLayoutProps = {
  children: React.ReactNode
  params: Promise<{ courseId: string }>
}

export default async function CourseLayout({ children, params }: CourseLayoutProps) {
  const { profile, company } = await requireAuthContext()
  const resolvedParams = await params

  const course = await db.course.findFirst({
    where: { id: resolvedParams.courseId, companyId: company.id },
    include: {
      chapters: {
        where: { isPublished: true },
        include: { userProgress: { where: { userProfileId: profile.id } } },
        orderBy: { position: 'asc' },
      },
      enrollments: {
        where: { userProfileId: profile.id },
        select: { id: true, status: true, userProfileId: true },
      },
    },
  })

  if (!course) {
    return redirect('/courses')
  }

  const progressCount = await getProgress(profile.id, course.id)

  return (
    <div className="h-full">
      <div className="fixed inset-y-0 z-50 h-20 w-full md:pl-80">
        <CourseNavbar course={course} progressCount={progressCount} />
      </div>

      <div className="fixed inset-y-0 z-50 hidden h-full w-80 flex-col md:flex">
        <CourseSidebar course={course} progressCount={progressCount} />
      </div>

      <main className="h-full pt-20 md:pl-80">{children}</main>
    </div>
  )
}
