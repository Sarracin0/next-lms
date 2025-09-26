'use server'

import { redirect } from 'next/navigation'

import { getChapter } from '@/actions/get-chapter'
import { Banner } from '@/components/banner'
import { Preview } from '@/components/preview'
import { Separator } from '@/components/ui/separator'
import { requireAuthContext } from '@/lib/current-profile'

import CourseEnrollButton from './_components/course-enroll-button'
import { CourseProgressButton } from './_components/course-progress-button'
import { VideoPlayer } from './_components/video-player'

type ChapterDetailsProps = {
  params: Promise<{
    courseId: string
    chapterId: string
  }>
}

export default async function ChapterDetails({ params }: ChapterDetailsProps) {
  const resolvedParams = await params
  const { profile, company } = await requireAuthContext()

  const { course, chapter, attachments, nextChapter, userProgress, enrollment, canAccessContent } = await getChapter({
    userProfileId: profile.id,
    companyId: company.id,
    ...resolvedParams,
  })

  if (!chapter || !course) {
    return redirect('/courses')
  }

  const isLocked = !canAccessContent
  const completedOnEnd = Boolean(enrollment) && !userProgress?.isCompleted

  return (
    <div>
      {userProgress?.isCompleted ? <Banner label="You already completed this chapter." variant="success" /> : null}
      {isLocked ? <Banner label="Enroll in this course to unlock the chapter." variant="warning" /> : null}

      <div className="mx-auto flex max-w-4xl flex-col pb-20">
        <div className="p-4">
          <VideoPlayer
            chapterId={chapter.id}
            title={chapter.title}
            courseId={resolvedParams.courseId}
            nextChapterId={nextChapter?.id}
            isLocked={isLocked}
            completeOnEnd={completedOnEnd}
            videoUrl={chapter.videoUrl ?? undefined}
          />
        </div>

        <div>
          <div className="flex flex-col items-center justify-between gap-4 p-4 md:flex-row">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">{chapter.title}</h2>
              <p className="text-sm text-muted-foreground">Part of {course.title}</p>
            </div>
            {enrollment ? (
              <CourseProgressButton
                chapterId={resolvedParams.chapterId}
                courseId={resolvedParams.courseId}
                nextChapterId={nextChapter?.id}
                isCompleted={!!userProgress?.isCompleted}
              />
            ) : (
              <CourseEnrollButton courseId={resolvedParams.courseId} userProfileId={profile.id} />
            )}
          </div>

          <Separator />

          <div className="p-4">
            {chapter.description ? (
              <Preview value={chapter.description} />
            ) : (
              <p className="text-sm text-muted-foreground">No description provided for this lesson yet.</p>
            )}
          </div>

          {attachments && attachments.length > 0 ? (
            <>
              <Separator />
              <div className="space-y-2 p-4">
                {attachments.map((attachment) => (
                  <a
                    className="flex w-full items-center justify-between rounded-md border bg-slate-100 p-3 text-sm text-slate-700 hover:bg-slate-200"
                    key={attachment.id}
                    target="_blank"
                    href={attachment.url}
                    rel="noreferrer"
                  >
                    {attachment.name}
                  </a>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
