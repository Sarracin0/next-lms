'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type {
  Attachment,
  Course,
  CourseModule as DbCourseModule,
  Lesson as DbLesson,
  LessonBlock as DbLessonBlock,
} from '@prisma/client'
import {
  CheckCircle2,
  Circle,
  FolderOpen,
  LayoutDashboard,
  ListChecks,
  Rocket,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

import Actions from './actions'
import { AttachmentForm } from './attachment-form'
import CourseBasicsForm from './course-basics-form'
import { CurriculumManager, mapModuleFromDb } from './curriculum-manager'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

// Types for the new hierarchical structure
export type Module = {
  id: string
  title: string
  description?: string
  position: number
  isPublished: boolean
  lessons: Lesson[]
}

export type Lesson = {
  id: string
  title: string
  description?: string
  position: number
  isPublished: boolean
  blocks: LessonBlock[]
}

export type LessonBlock = {
  id: string
  type: 'VIDEO_LESSON' | 'RESOURCES'
  title: string
  content?: string
  videoUrl?: string
  contentUrl?: string
  position: number
  isPublished: boolean
}

type DbModuleWithRelations = DbCourseModule & {
  lessons: (DbLesson & { blocks: DbLessonBlock[] })[]
}

export type CourseBuilderWizardProps = {
  course: Course & { attachments: Attachment[] }
  modules: DbModuleWithRelations[]
  courseId: string
  completion: {
    completed: number
    total: number
    text: string
    isComplete: boolean
    items: Array<{
      id: string
      label: string
      helper?: string
      isComplete: boolean
    }>
  }
}

type StepId = 'basics' | 'curriculum' | 'resources' | 'launch'

type StepDefinition = {
  id: StepId
  title: string
  description: string
  icon: LucideIcon
  optional?: boolean
}

type StepState = StepDefinition & {
  isComplete: boolean
  isLocked: boolean
}

const stepDefinitions: StepDefinition[] = [
  {
    id: 'basics',
    title: 'Course basics',
    description: 'Learning promise and context',
    icon: LayoutDashboard,
  },
  {
    id: 'curriculum',
    title: 'Curriculum & lessons',
    description: 'Chapters, videos and learning flow',
    icon: ListChecks,
  },
  {
    id: 'resources',
    title: 'Resources & files',
    description: 'Supplemental docs and job aids',
    icon: FolderOpen,
    optional: true,
  },
  {
    id: 'launch',
    title: 'Launch & rollout',
    description: 'Publish and plan assignments',
    icon: Rocket,
  },
]

const formatDuration = (minutes?: number | null) => {
  if (!minutes) return '—'
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  if (hours && remainder) {
    return `${hours}h ${remainder}m`
  }
  if (hours) {
    return `${hours}h`
  }
  return `${remainder}m`
}

const CourseBuilderWizard = ({ course, modules: modulesProp, courseId, completion }: CourseBuilderWizardProps) => {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  // State for the new hierarchical structure
  const [modules, setModules] = useState<Module[]>(() => modulesProp.map(mapModuleFromDb))

  useEffect(() => {
    setModules(modulesProp.map(mapModuleFromDb))
  }, [modulesProp])

  const basicsComplete = Boolean(course.title && course.description)
  const hasModules = modules.length > 0
  const hasLessons = modules.some((module) => module.lessons.length > 0)
  const hasBlocks = modules.some((module) =>
    module.lessons.some((lesson) => lesson.blocks.length > 0)
  )
  const courseResources = course.attachments.filter((attachment) => attachment.chapterId == null)
  const hasResources = course.attachments.length > 0

  const stepStates = useMemo<StepState[]>(() => {
    const completionMap: Record<StepId, boolean> = {
      basics: basicsComplete,
      curriculum: hasModules && hasLessons && hasBlocks,
      resources: hasResources,
      launch: hasModules && hasLessons && hasBlocks,
    }

    return stepDefinitions.map((definition) => {
      const isComplete = completionMap[definition.id]
      const isLocked =
        definition.id === 'launch' && (!basicsComplete || !hasModules || !hasLessons || !hasBlocks)

      return {
        ...definition,
        isComplete,
        isLocked,
      }
    })
  }, [basicsComplete, hasModules, hasLessons, hasBlocks, hasResources])

  const defaultStepId = useMemo<StepId>(() => {
    const firstPending = stepStates.find((step) => !step.isComplete && !step.optional)
    return firstPending?.id ?? stepStates[stepStates.length - 1]?.id ?? 'basics'
  }, [stepStates])

  const activeStepId = useMemo<StepId>(() => {
    const requested = searchParams.get('step') as StepId | null
    if (requested) {
      const candidate = stepStates.find((step) => step.id === requested && !step.isLocked)
      if (candidate) {
        return candidate.id
      }
    }
    return defaultStepId
  }, [defaultStepId, searchParams, stepStates])

  const handleStepClick = (step: StepState) => {
    if (step.isLocked) return

    const params = new URLSearchParams(searchParams.toString())
    params.set('step', step.id)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const progressPercentage = completion.total ? Math.round((completion.completed / completion.total) * 100) : 0

  const totalLessons = modules.reduce((acc, module) => acc + module.lessons.length, 0)
  const totalBlocks = modules.reduce(
    (acc, module) => acc + module.lessons.reduce((lessonAcc, lesson) => lessonAcc + lesson.blocks.length, 0),
    0
  )

  const stats = [
    { label: 'Modules', value: modules.length.toString() },
    { label: 'Lessons', value: totalLessons.toString() },
    { label: 'Content blocks', value: totalBlocks.toString() },
    { label: 'Resources', value: course.attachments.length.toString() },
    { label: 'Estimated duration', value: formatDuration(course.estimatedDurationMinutes) },
    { label: 'Status', value: course.isPublished ? 'Published' : 'Draft' },
  ]

  const launchChecklist = [
    { label: 'Course basics completed', complete: basicsComplete },
    { label: 'At least one module created', complete: hasModules },
    { label: 'At least one lesson created', complete: hasLessons },
    {
      label: 'Content blocks added',
      complete: hasBlocks,
      helper: 'Add video lessons or resources to your lessons.',
    },
    { label: 'Resources attached (optional)', complete: hasResources, optional: true },
  ]

  const renderStepContent = () => {
    switch (activeStepId) {
      case 'basics':
        return (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <LayoutDashboard className="h-4 w-4 text-primary" />
                Course basics
              </div>
              <h2 className="mt-2 text-xl font-semibold text-foreground">Define the promise for your learners</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Set the narrative, expected effort and key outcomes. Once saved you can jump into the lessons workspace.
              </p>
            </div>
            <CourseBasicsForm
              courseId={courseId}
              initialData={{
                title: course.title,
                description: course.description ?? '',
                learningOutcomes: course.learningOutcomes ?? '',
                prerequisites: course.prerequisites ?? '',
                estimatedDurationMinutes: course.estimatedDurationMinutes ?? null,
              }}
            />
          </div>
        )
      case 'curriculum':
        return (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <ListChecks className="h-4 w-4 text-primary" />
                Curriculum design
              </div>
              <h2 className="mt-2 text-xl font-semibold text-foreground">Structure your learning journey</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Organize your content into modules and lessons with different content types. Build a structured learning experience.
              </p>
            </div>
            <CurriculumManager
              courseId={courseId}
              modules={modules}
              onModulesChange={setModules}
            />
          </div>
        )
      case 'resources':
        return (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <FolderOpen className="h-4 w-4 text-primary" />
                Resources
              </div>
              <h2 className="mt-2 text-xl font-semibold text-foreground">Bundle playbooks, templates and docs</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload slide decks, cheat sheets or policy documents so teams have everything in one place.
              </p>
            </div>
            <AttachmentForm initialData={{ ...course, attachments: courseResources }} courseId={courseId} />
            <Card className="rounded-xl border border-border/60 bg-muted/30 shadow-none">
              <CardHeader className="pb-4">
                <CardTitle className="text-base font-semibold">Suggested resources</CardTitle>
                <CardDescription>Think onboarding checklists, SOPs, quizzes or templates that reinforce the lesson.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>Files are instantly available in the learner experience right below the video content.</p>
                <p>Need something interactive? Link to your LMS quizzes or surveys and track completions via analytics.</p>
              </CardContent>
            </Card>
          </div>
        )
      case 'launch':
        return (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Rocket className="h-4 w-4 text-primary" />
                Launch plan
              </div>
              <h2 className="mt-2 text-xl font-semibold text-foreground">Review and publish your course</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Double-check the essentials, publish when you&apos;re ready and then assign the track to teams or individuals.
              </p>
            </div>
            <Card className="rounded-xl border border-border/60 bg-card/80 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Readiness checklist</CardTitle>
                <CardDescription>
                  Publishing is available at any time—these checkpoints simply help you deliver a polished experience.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {launchChecklist.map((item) => {
                  const Icon = item.complete ? CheckCircle2 : Circle
                  return (
                    <div key={item.label} className="flex items-start gap-3 rounded-lg border border-border/40 bg-muted/20 p-3">
                      <Icon className={cn('mt-0.5 h-4 w-4', item.complete ? 'text-emerald-600' : 'text-muted-foreground')} />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {item.label}
                          {item.optional ? <span className="ml-2 text-xs text-muted-foreground">Optional</span> : null}
                        </p>
                        {item.helper ? <p className="text-xs text-muted-foreground">{item.helper}</p> : null}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
              <CardFooter className="flex flex-col gap-3 pt-0 md:flex-row md:items-center md:justify-between">
                <Actions disabled={false} courseId={courseId} isPublished={course.isPublished} />
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span>Next: assign to teams</span>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/manage/teams">Manage teams</Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/manage/badges">Configure badges</Link>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 rounded-2xl border border-border/60 bg-gradient-to-br from-background via-background to-muted/50 p-6 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
            <Sparkles className="h-4 w-4" />
            Guided builder
          </div>
          <h1 className="text-2xl font-semibold text-foreground">Design your corporate learning experience</h1>
          <p className="text-sm text-muted-foreground">
            Move through each step to craft a premium, multi-format course tailored for your teams.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 md:w-80">
          <div className="flex items-center justify-between">
            <Badge
              className={cn(
                'border-transparent px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                course.isPublished
                  ? 'bg-emerald-500 text-white hover:bg-emerald-500/90'
                  : 'bg-secondary text-secondary-foreground',
              )}
            >
              {course.isPublished ? 'Published' : 'Draft'}
            </Badge>
            <span className="text-xs font-medium text-muted-foreground">Completion {completion.text}</span>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={progressPercentage} variant={completion.isComplete ? 'success' : 'default'} className="h-2 flex-1" />
            <span className="text-xs font-medium text-muted-foreground">{progressPercentage}%</span>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              You can publish whenever you&apos;re ready. These checkpoints are optional best practices.
            </p>
            <div className="space-y-1.5">
              {completion.items.map((item) => {
                const Icon = item.isComplete ? CheckCircle2 : Circle
                return (
                  <div key={item.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Icon className={cn('h-3.5 w-3.5', item.isComplete ? 'text-emerald-600' : 'text-muted-foreground')} />
                    <span className="font-medium text-foreground">{item.label}</span>
                    {item.helper ? <span className="text-[11px] text-muted-foreground">— {item.helper}</span> : null}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px,1fr] xl:grid-cols-[320px,1fr]">
        <aside className="space-y-6">
          <Card className="border-border/60 bg-card/80 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Course checklist</CardTitle>
              <CardDescription>Navigate each phase of the builder.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {stepStates.map((step, index) => {
                const Icon = step.icon
                const position = index + 1
                const isActive = step.id === activeStepId
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => handleStepClick(step)}
                    disabled={step.isLocked}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-3 text-left transition-colors',
                      isActive && 'border-primary bg-primary/10 text-primary',
                      !isActive && 'hover:bg-muted/50',
                      step.isLocked && 'cursor-not-allowed opacity-50',
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border text-sm font-semibold',
                        step.isComplete
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-600'
                          : isActive
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border text-muted-foreground',
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{position}. {step.title}</p>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                    {step.optional ? (
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                        Optional
                      </Badge>
                    ) : null}
                  </button>
                )
              })}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/80 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">At a glance</CardTitle>
              <CardDescription>Your course snapshot updates in real time.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.map((stat) => (
                <div key={stat.label} className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/20 px-3 py-2">
                  <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
                  <span className="text-sm font-semibold text-foreground">{stat.value}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>

        <section className="space-y-6">{renderStepContent()}</section>
      </div>
    </div>
  )
}

export default CourseBuilderWizard
