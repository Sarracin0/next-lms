import CourseMobileSidebar from './course-mobile-sidebar'
import { NavbarRoutes } from '@/components/navbar-routes'
import { CourseWithStructure } from './course-sidebar.types'

type CourseNavbarProps = {
  course: CourseWithStructure
  progressCount: number
}

export default function CourseNavbar({ course, progressCount }: CourseNavbarProps) {
  return (
    <div className="flex h-full items-center border-b bg-white p-4 shadow-sm">
      <CourseMobileSidebar course={course} progressCount={progressCount} />
      <NavbarRoutes />
    </div>
  )
}
