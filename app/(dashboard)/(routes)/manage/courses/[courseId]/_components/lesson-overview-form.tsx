'use client'

import * as z from 'zod'
import axios from 'axios'
import { useTransition } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import type { Chapter } from '@prisma/client'

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  estimatedDurationMinutes: z
    .union([z.literal(''), z.coerce.number().min(0).max(1200)])
    .transform((value) => (value === '' ? null : value))
    .optional(),
})

type LessonOverviewFormProps = {
  courseId: string
  chapterId: string
  initialData: Pick<Chapter, 'title' | 'description' | 'estimatedDurationMinutes'>
}

type FormValues = z.infer<typeof formSchema>

export const LessonOverviewForm = ({ courseId, chapterId, initialData }: LessonOverviewFormProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData.title,
      description: initialData.description ?? '',
      estimatedDurationMinutes: initialData.estimatedDurationMinutes ?? '',
    },
  })

  const isSubmitting = form.formState.isSubmitting || isPending

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      try {
        await axios.patch(`/api/courses/${courseId}/chapters/${chapterId}`, {
          title: values.title,
          description: values.description,
          estimatedDurationMinutes: values.estimatedDurationMinutes ?? null,
        })
        toast.success('Lesson details saved')
        router.refresh()
      } catch {
        toast.error('Unable to save lesson details')
      }
    })
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card/80 p-5 shadow-sm">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lesson title *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Welcome to the program" disabled={isSubmitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lesson narrative *</FormLabel>
                <FormControl>
                  <Textarea
                    rows={4}
                    placeholder="Describe what happens in this lesson and why it matters."
                    disabled={isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="estimatedDurationMinutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated minutes</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={1200}
                    placeholder="e.g. 45"
                    disabled={isSubmitting}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>Helps employees block the right amount of time.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save lesson basics'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

export default LessonOverviewForm
