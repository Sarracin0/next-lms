'use client'

import * as z from 'zod'
import axios from 'axios'
import { PlusCircle, File, Loader2, X } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { Attachment, Course } from '@prisma/client'

import { Button } from '@/components/ui/button'
import { FileUpload } from '@/components/file-upload'

interface AttachmentFormProps {
  initialData: Course & { attachments: Attachment[] }
  courseId: string
}

const formSchema = z.object({
  url: z.string().min(1),
})

export const AttachmentForm = ({ initialData, courseId }: AttachmentFormProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const toggleEdit = () => setIsEditing((current) => !current)

  const router = useRouter()

  const attachments = initialData.attachments.filter((attachment) => attachment.chapterId == null)

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      formSchema.parse(values)
      await axios.post(`/api/courses/${courseId}/attachments`, values)
      toast.success('Course updated')
      toggleEdit()
      router.refresh()
    } catch {
      toast.error('Something went wrong')
    }
  }

  const onDelete = async (id: string) => {
    try {
      setDeletingId(id)
      await axios.delete(`/api/courses/${courseId}/attachments/${id}`)
      toast.success('Attachment deleted')
      router.refresh()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-border/70 bg-card/80 p-6 shadow-sm transition-colors hover:border-primary/40">
      <div className="flex items-center justify-between font-medium">
        Course attachments
        <Button onClick={toggleEdit} variant="ghost">
          {isEditing && <>Cancel</>}
          {!isEditing && (
            <>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add a file
            </>
          )}
        </Button>
      </div>
      {!isEditing && (
        <>
          {attachments.length === 0 && (
            <p className="mt-4 text-sm italic text-muted-foreground">No attachments yet</p>
          )}
          {attachments.length > 0 && (
            <div className="space-y-2">
              {attachments.map((attachment) => (
                <div
                  key={attachment.id}
                  className="flex w-full items-center gap-3 rounded-lg border border-border/60 bg-muted/40 p-3 text-sm text-foreground"
                >
                  <File className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <p className="line-clamp-1 flex-1 text-xs font-medium text-muted-foreground">{attachment.name}</p>
                  {deletingId === attachment.id && (
                    <div>
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  )}
                  {deletingId !== attachment.id && (
                    <button onClick={() => onDelete(attachment.id)} className="ml-auto transition hover:opacity-75">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
      {isEditing && (
        <div>
          <FileUpload
            endpoint="courseAttachment"
            onChange={(url) => {
              if (url) {
                onSubmit({ url })
              }
            }}
          />
          <div className="mt-4 text-xs text-muted-foreground">
            Add anything your students might need to complete the course.
          </div>
        </div>
      )}
    </div>
  )
}
