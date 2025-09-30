import { MenuIcon } from 'lucide-react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import CourseSidebar from './course-sidebar'
import { CourseWithStructure } from './course-sidebar.types'

type CourseMobileSidebarProps = {
  course: CourseWithStructure
  progressCount: number
}

export default function CourseMobileSidebar({ course, progressCount }: CourseMobileSidebarProps) {
  return (
    <Sheet>
      <SheetTrigger className="pr-4 transition hover:opacity-75 md:hidden">
        <MenuIcon />
      </SheetTrigger>

      <SheetContent side="left" className="w-72 bg-white p-0">
        <CourseSidebar course={course} progressCount={progressCount} />
      </SheetContent>
    </Sheet>
  )
}
