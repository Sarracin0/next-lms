'use client'

import { ChevronDown } from 'lucide-react'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Accordion } from '@/components/ui/accordion'
import CourseSidebarLesson from './course-sidebar-lesson'
import { ModuleWithLessons } from './course-sidebar.types'

type CourseSidebarModuleProps = {
  module: ModuleWithLessons
  courseId: string
  isLocked: boolean
}

export default function CourseSidebarModule({ module, courseId, isLocked }: CourseSidebarModuleProps) {
  return (
    <AccordionItem value={module.id} className="border-b">
      <AccordionTrigger className="px-6 py-4 text-sm font-semibold text-slate-700 hover:bg-slate-100/50 hover:no-underline">
        <div className="flex items-center gap-2">
          <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
          <span className="text-left">{module.title}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pb-0">
        {module.lessons.length > 0 ? (
          <Accordion type="multiple" className="w-full">
            {module.lessons.map((lesson) => (
              <CourseSidebarLesson
                key={lesson.id}
                lesson={lesson}
                courseId={courseId}
                isLocked={!lesson.isPreview && isLocked}
              />
            ))}
          </Accordion>
        ) : (
          <div className="px-6 py-4 text-sm text-slate-500">Nessuna lezione disponibile</div>
        )}
      </AccordionContent>
    </AccordionItem>
  )
}
