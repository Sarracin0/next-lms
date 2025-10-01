'use client'

import axios from 'axios'
import { Loader2, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'react-hot-toast'

import { useConfettiStore } from '@/hooks/use-confetti'

interface VideoPlayerProps {
  courseId: string
  chapterId: string
  nextChapterId?: string
  isLocked: boolean
  completeOnEnd: boolean
  title: string
  videoUrl?: string | null
}

export const VideoPlayer = ({
  courseId,
  chapterId,
  nextChapterId,
  isLocked,
  completeOnEnd,
  title,
  videoUrl,
}: VideoPlayerProps) => {
  const [isReady, setIsReady] = useState(false)
  const router = useRouter()
  const confetti = useConfettiStore()

  const onEnd = async () => {
    try {
      if (completeOnEnd) {
        await axios.put(`/api/courses/${courseId}/chapters/${chapterId}/progress`, {
          isCompleted: true,
        })

        if (!nextChapterId) {
          confetti.onOpen()
        }

        toast.success('Progress updated')
        router.refresh()

        if (nextChapterId) {
          router.push(`/courses/${courseId}/chapters/${nextChapterId}`)
        }
      }
    } catch {
      toast.error('Something went wrong')
    }
  }

  return (
    <div className="relative aspect-video">
      {!isReady && !isLocked && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/80">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}
      {isLocked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-y-2 rounded-xl bg-black/80 text-white">
          <Lock className="h-8 w-8" />
          <p className="text-sm">This chapter is locked</p>
        </div>
      )}
      {!isLocked && videoUrl ? (
        <video
          title={title}
          className="h-full w-full rounded-xl shadow-lg ring-1 ring-white/20"
          controls
          autoPlay
          onLoadedData={() => setIsReady(true)}
          onEnded={onEnd}
          src={videoUrl}
        />
      ) : null}
      {!isLocked && !videoUrl ? (
        <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/30 bg-white/40 text-sm text-muted-foreground backdrop-blur-md supports-[backdrop-filter]:bg-white/30">
          Lesson video will appear here once uploaded.
        </div>
      ) : null}
    </div>
  )
}
