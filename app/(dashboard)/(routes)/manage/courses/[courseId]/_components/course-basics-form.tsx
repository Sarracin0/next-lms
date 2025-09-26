'use client'

import * as z from 'zod'
import axios from 'axios'
import { useTransition } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import type { Course } from '@prisma/client'

import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

const formSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  learningOutcomes: z.string().max(1000).optional().or(z.literal('')),
  prerequisites: z.string().max(1000).optional().or(z.literal('')),
  estimatedDurationMinutes: z
    .union([z.literal(''), z.coerce.number().min(0).max(2000)])
    .transform((value) => (value === '' ? null : value))
    .optional(),
})

type FormValues = z.infer<typeof formSchema>

type CourseBasicsFormProps = {
  courseId: string
  initialData: Pick<Course, 'title' | 'description' | 'learningOutcomes' | 'prerequisites' | 'estimatedDurationMinutes'>
}

export const CourseBasicsForm = ({ courseId, initialData }: CourseBasicsFormProps) => {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData.title ?? '',
      description: initialData.description ?? '',
      learningOutcomes: initialData.learningOutcomes ?? '',
      prerequisites: initialData.prerequisites ?? '',
      estimatedDurationMinutes: initialData.estimatedDurationMinutes ?? '',
    },
  })

  const onSubmit = (values: FormValues) => {
    startTransition(async () => {
      try {
        await axios.patch(`/api/courses/${courseId}`, {
          title: values.title,
          description: values.description,
          learningOutcomes: values.learningOutcomes || null,
          prerequisites: values.prerequisites || null,
          estimatedDurationMinutes: values.estimatedDurationMinutes ?? null,
        })
        toast.success('Course basics saved')
        router.refresh()
      } catch {
        toast.error('Unable to save basics')
      }
    })
  }

  const isSubmitting = form.formState.isSubmitting || isPending

  return (
    <div className="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-sm">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Course title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Manager onboarding" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormDescription>Give participants immediate clarity on the program.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Overview *</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Summarise the learning promise and delivery format."
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
                  <FormLabel>Estimated effort (minutes)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={2000}
                      placeholder="e.g. 90"
                      disabled={isSubmitting}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>Helps teams plan the time commitment. Leave blank if not sure.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="learningOutcomes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Learning outcomes</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="List key skills or behaviours employees will master."
                      disabled={isSubmitting}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="prerequisites"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prerequisites</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Optional: mention required context, policies or previous courses."
                      disabled={isSubmitting}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Save basics'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

export default CourseBasicsForm
