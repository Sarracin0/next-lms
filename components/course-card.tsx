import Image from 'next/image'
import Link from 'next/link'
import type { CourseEnrollmentStatus } from '@prisma/client'
import { BookOpenIcon } from 'lucide-react'

import { IconBadge } from './icon-badge'
import { CourseProgress } from './course-progress'

const STATUS_LABEL: Record<CourseEnrollmentStatus, string> = {
  NOT_STARTED: 'Not started',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  OVERDUE: 'Overdue',
}

type CourseCardProps = {
  id: string
  title: string
  imageUrl?: string | null
  chaptersLength: number
  progress: number | null
  category?: string | null
  status?: CourseEnrollmentStatus | null
}

export default function CourseCard({ id, title, imageUrl, chaptersLength, progress, category, status }: CourseCardProps) {
  return (
    <Link href={`/courses/${id}`}>
      <div className="group h-full overflow-hidden rounded-lg border bg-white p-3 transition hover:shadow-md">
        <div className="relative aspect-video w-full overflow-hidden rounded-md bg-muted">
          {imageUrl ? (
            <Image fill className="object-cover" alt={title} src={imageUrl} />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              No cover image yet
            </div>
          )}
        </div>

        <div className="flex flex-col pt-3">
          <div className="line-clamp-2 text-lg font-semibold transition group-hover:text-primary md:text-base">
            {title}
          </div>
          <p className="text-xs text-muted-foreground">{category ?? 'General track'}</p>
          <div className="my-3 flex items-center gap-x-1 text-sm md:text-xs">
            <div className="flex items-center gap-x-1 text-slate-500">
              <IconBadge size="sm" icon={BookOpenIcon} />
              <span>
                {chaptersLength} {chaptersLength === 1 ? 'Chapter' : 'Chapters'}
              </span>
            </div>
          </div>

          {status ? (
            <span className="text-xs font-medium text-muted-foreground">
              {STATUS_LABEL[status] ?? status}
            </span>
          ) : null}

          {progress !== null ? (
            <div className="mt-2">
              <CourseProgress variant={progress === 100 ? 'success' : 'default'} size="sm" value={progress} />
            </div>
          ) : (
            <span className="mt-2 text-sm font-medium text-primary">View course details</span>
          )}
        </div>
      </div>
    </Link>
  )
}
