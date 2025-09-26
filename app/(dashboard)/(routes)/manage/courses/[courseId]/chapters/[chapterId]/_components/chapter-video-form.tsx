'use client'

import * as z from 'zod'
import axios from 'axios'
import { Pencil, PlusCircle, Video } from 'lucide-react'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { Chapter } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { FileUpload } from '@/components/file-upload'
import { Input } from '@/components/ui/input'

interface ChapterVideoFormProps {
  initialData: Chapter
  courseId: string
  chapterId: string
}

const formSchema = z.object({
  videoUrl: z.string().min(1),
})

export const ChapterVideoForm = ({ initialData, courseId, chapterId }: ChapterVideoFormProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [manualUrl, setManualUrl] = useState(initialData.videoUrl ?? '')
  const [isSavingLink, setIsSavingLink] = useState(false)

  const toggleEdit = () => setIsEditing((current) => !current)

  const router = useRouter()

  useEffect(() => {
    setManualUrl(initialData.videoUrl ?? '')
  }, [initialData.videoUrl])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      formSchema.parse(values)
      await axios.patch(`/api/courses/${courseId}/chapters/${chapterId}`, values)
      toast.success('Chapter updated')
      toggleEdit()
      router.refresh()
    } catch {
      toast.error('Something went wrong')
    }
  }

  const onSaveManualLink = async () => {
    if (!manualUrl) {
      toast.error('Add a valid URL before saving')
      return
    }

    try {
      setIsSavingLink(true)
      await onSubmit({ videoUrl: manualUrl })
    } catch {
      toast.error('Unable to save link')
    } finally {
      setIsSavingLink(false)
    }
  }

  return (
    <div className="mt-6 rounded-md border bg-slate-100 p-4">
      <div className="flex items-center justify-between font-medium">
        Chapter video
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing && <>Cancel</>}
          {!isEditing && !initialData.videoUrl && (
            <>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add a video
            </>
          )}
          {!isEditing && initialData.videoUrl && (
            <>
              <Pencil className="mr-2 h-4 w-4" />
              Edit video
            </>
          )}
        </Button>
      </div>
      {!isEditing &&
        (!initialData.videoUrl ? (
          <div className="flex h-60 items-center justify-center rounded-md bg-slate-200">
            <Video className="h-10 w-10 text-slate-500" />
          </div>
        ) : (
          <div className="relative mt-2 overflow-hidden rounded-lg border border-slate-200">
            <video
              controls
              className="h-full w-full"
              src={initialData.videoUrl ?? ''}
              preload="metadata"
            />
          </div>
        ))}
      {isEditing && (
        <div className="space-y-4">
          <div className="rounded-lg border border-dashed border-border/60 bg-muted/40 p-4">
            <p className="text-sm font-medium text-foreground">Upload a video file</p>
            <p className="text-xs text-muted-foreground">
              We use UploadThing for secure storage. Ensure `UPLOADTHING_TOKEN` is configured in your environment.
            </p>
            <div className="mt-3">
              <FileUpload
                endpoint="chapterVideo"
                onChange={(url) => {
                  if (url) {
                    onSubmit({ videoUrl: url })
                  }
                }}
              />
            </div>
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
            <p className="text-sm font-medium text-foreground">…or paste a hosted link</p>
            <p className="text-xs text-muted-foreground">
              Link to an MP4, Vimeo, YouTube unlisted, or any internal streaming URL your company already uses.
            </p>
            <div className="mt-3 flex flex-col gap-2 md:flex-row">
              <Input
                placeholder="https://"
                value={manualUrl}
                onChange={(event) => setManualUrl(event.target.value)}
                disabled={isSavingLink}
              />
              <Button onClick={onSaveManualLink} disabled={isSavingLink}>
                {isSavingLink ? 'Saving…' : 'Save link'}
              </Button>
            </div>
          </div>
        </div>
      )}
      {initialData.videoUrl && !isEditing && (
        <div className="mt-2 text-xs text-muted-foreground">
          Ensure uploaded videos are compressed for smooth playback.
        </div>
      )}
    </div>
  )
}
