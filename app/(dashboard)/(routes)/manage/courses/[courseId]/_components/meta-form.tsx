'use client'

import * as z from 'zod'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import { Course } from '@prisma/client'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

const formSchema = z.object({
  estimatedDurationMinutes: z
    .union([z.literal(''), z.coerce.number().min(0).max(2000)])
    .transform((value) => (value === '' ? null : value))
    .optional(),
  learningOutcomes: z.string().max(1000).nullable().optional(),
  prerequisites: z.string().max(1000).nullable().optional(),
})

type MetaFormProps = {
  courseId: string
  initialData: Pick<Course, 'estimatedDurationMinutes' | 'learningOutcomes' | 'prerequisites'>
}

export const MetaForm = ({ courseId, initialData }: MetaFormProps) => {
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      estimatedDurationMinutes: initialData.estimatedDurationMinutes ?? null,
      learningOutcomes: initialData.learningOutcomes ?? null,
      prerequisites: initialData.prerequisites ?? null,
    },
  })

  const isSubmitting = form.formState.isSubmitting

  const descriptionText = useMemo(() => {
    if (!initialData.estimatedDurationMinutes) {
      return 'Set an estimated duration and learning goals to help employees plan their time.'
    }

    return 'Update the core details learners see before starting the course.'
  }, [initialData.estimatedDurationMinutes])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch(`/api/courses/${courseId}`, values)
      toast.success('Course details updated')
      router.refresh()
    } catch {
      toast.error('Failed to update course details')
    }
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card/80 p-6 shadow-sm transition-colors hover:border-primary/40">
      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="estimatedDurationMinutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated duration (minutes)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={2000}
                    disabled={isSubmitting}
                    placeholder="e.g. 120"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormDescription>{descriptionText}</FormDescription>
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
                    rows={4}
                    disabled={isSubmitting}
                    placeholder="Describe the skills or knowledge this course delivers."
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
                    disabled={isSubmitting}
                    placeholder="Mention any knowledge or prep required before starting."
                    value={field.value ?? ''}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
            Save details
          </Button>
        </form>
      </Form>
    </div>
  )
}
