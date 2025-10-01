import CourseMobileSidebar from './course-mobile-sidebar'
import { NavbarRoutes } from '@/components/navbar-routes'
import { CourseWithStructure } from './course-sidebar.types'

type CourseNavbarProps = {
  course: CourseWithStructure
  progressCount: number
}

export default function CourseNavbar({ course, progressCount }: CourseNavbarProps) {
  return (
    <div className="flex h-full items-center border-b border-white/20 bg-white/60 backdrop-blur-md supports-[backdrop-filter]:bg-white/50 p-4">
      <CourseMobileSidebar course={course} progressCount={progressCount} />
      <NavbarRoutes />
    </div>
  )
}
