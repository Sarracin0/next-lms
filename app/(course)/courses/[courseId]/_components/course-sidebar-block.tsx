'use client'

import { LockIcon, PlayCircleIcon, FileTextIcon, VideoIcon } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { BlockData } from './course-sidebar.types'

type CourseSidebarBlockProps = {
  block: BlockData
  lessonId: string
  courseId: string
  isLocked: boolean
}

export default function CourseSidebarBlock({ block, lessonId, courseId, isLocked }: CourseSidebarBlockProps) {
  const pathname = usePathname()
  const router = useRouter()

  // Determina l'icona in base al tipo di blocco e allo stato
  const getIcon = () => {
    if (isLocked) return LockIcon

    // TODO: Gestire il completamento dei blocchi quando implementerai UserBlockProgress
    // const isCompleted = block.progress?.[0]?.isCompleted
    // if (isCompleted) return CheckCircleIcon

    switch (block.type) {
      case 'VIDEO_LESSON':
        return VideoIcon
      case 'RESOURCES':
        return FileTextIcon
      case 'LIVE_SESSION':
        return PlayCircleIcon
      default:
        return FileTextIcon
    }
  }

  const Icon = getIcon()
  const isActive = pathname?.includes(block.id)
  // const isCompleted = false // TODO: implementare tracking completamento blocchi

  const onClick = () => {
    if (isLocked) return
    // Naviga alla route del blocco (da implementare nel routing)
    router.push(`/courses/${courseId}/lessons/${lessonId}/blocks/${block.id}`)
  }

  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(
        'flex items-center gap-x-2 px-10 py-2.5 text-xs font-normal text-slate-500 transition-all hover:bg-slate-100/50 hover:text-slate-600',
        {
          'cursor-not-allowed opacity-50 hover:bg-transparent hover:text-slate-500': isLocked,
          'bg-slate-100 text-slate-700 hover:bg-slate-100 hover:text-slate-700': isActive,
          // 'text-emerald-600 hover:text-emerald-600': isCompleted,
          // 'bg-emerald-50': isCompleted && isActive,
        },
      )}
    >
      <Icon
        size={16}
        className={cn('shrink-0 text-slate-400', {
          'text-slate-600': isActive,
          // 'text-emerald-600': isCompleted,
        })}
      />
      <span className="line-clamp-2 text-left">{block.title}</span>
    </button>
  )
}
