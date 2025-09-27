'use client'

import { useState } from 'react'
import { Plus, FolderOpen, BookOpen, Video, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ModuleAccordion, type Module, type Lesson, type LessonBlock } from './module-accordion'
import { cn } from '@/lib/utils'

type CurriculumManagerProps = {
  courseId: string
  modules: Module[]
  onModulesChange: (modules: Module[]) => void
}

export const CurriculumManager = ({ courseId, modules, onModulesChange }: CurriculumManagerProps) => {
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [isAddingModule, setIsAddingModule] = useState(false)

  const handleAddModule = () => {
    if (!newModuleTitle.trim()) return

    const newModule: Module = {
      id: `module-${Date.now()}`,
      title: newModuleTitle.trim(),
      description: '',
      position: modules.length,
      isPublished: false,
      lessons: [],
    }

    onModulesChange([...modules, newModule])
    setNewModuleTitle('')
    setIsAddingModule(false)
  }

  const handleUpdateModule = (moduleId: string, data: Partial<Module>) => {
    const updatedModules = modules.map((module) =>
      module.id === moduleId ? { ...module, ...data } : module
    )
    onModulesChange(updatedModules)
  }

  const handleDeleteModule = (moduleId: string) => {
    const updatedModules = modules.filter((module) => module.id !== moduleId)
    onModulesChange(updatedModules)
  }

  const handleAddLesson = (moduleId: string) => {
    const newLesson: Lesson = {
      id: `lesson-${Date.now()}`,
      title: 'New Lesson',
      description: '',
      position: 0,
      isPublished: false,
      blocks: [],
    }

    const updatedModules = modules.map((module) =>
      module.id === moduleId
        ? { ...module, lessons: [...module.lessons, newLesson] }
        : module
    )
    onModulesChange(updatedModules)
  }

  const handleUpdateLesson = (moduleId: string, lessonId: string, data: Partial<Lesson>) => {
    const updatedModules = modules.map((module) =>
      module.id === moduleId
        ? {
            ...module,
            lessons: module.lessons.map((lesson) =>
              lesson.id === lessonId ? { ...lesson, ...data } : lesson
            ),
          }
        : module
    )
    onModulesChange(updatedModules)
  }

  const handleDeleteLesson = (moduleId: string, lessonId: string) => {
    const updatedModules = modules.map((module) =>
      module.id === moduleId
        ? { ...module, lessons: module.lessons.filter((lesson) => lesson.id !== lessonId) }
        : module
    )
    onModulesChange(updatedModules)
  }

  const handleAddBlock = (
    moduleId: string,
    lessonId: string,
    type: 'VIDEO_LESSON' | 'RESOURCES'
  ) => {
    const newBlock: LessonBlock = {
      id: `block-${Date.now()}`,
      type,
      title: type === 'VIDEO_LESSON' ? 'New Video Lesson' : 'New Resources',
      content: '',
      videoUrl: type === 'VIDEO_LESSON' ? '' : undefined,
      contentUrl: type === 'RESOURCES' ? '' : undefined,
      position: 0,
      isPublished: false,
    }

    const updatedModules = modules.map((module) =>
      module.id === moduleId
        ? {
            ...module,
            lessons: module.lessons.map((lesson) =>
              lesson.id === lessonId
                ? { ...lesson, blocks: [...lesson.blocks, newBlock] }
                : lesson
            ),
          }
        : module
    )
    onModulesChange(updatedModules)
  }

  const handleUpdateBlock = (
    moduleId: string,
    lessonId: string,
    blockId: string,
    data: Partial<LessonBlock>
  ) => {
    const updatedModules = modules.map((module) =>
      module.id === moduleId
        ? {
            ...module,
            lessons: module.lessons.map((lesson) =>
              lesson.id === lessonId
                ? {
                    ...lesson,
                    blocks: lesson.blocks.map((block) =>
                      block.id === blockId ? { ...block, ...data } : block
                    ),
                  }
                : lesson
            ),
          }
        : module
    )
    onModulesChange(updatedModules)
  }

  const handleDeleteBlock = (moduleId: string, lessonId: string, blockId: string) => {
    const updatedModules = modules.map((module) =>
      module.id === moduleId
        ? {
            ...module,
            lessons: module.lessons.map((lesson) =>
              lesson.id === lessonId
                ? { ...lesson, blocks: lesson.blocks.filter((block) => block.id !== blockId) }
                : lesson
            ),
          }
        : module
    )
    onModulesChange(updatedModules)
  }

  const totalLessons = modules.reduce((acc, module) => acc + module.lessons.length, 0)
  const totalBlocks = modules.reduce(
    (acc, module) => acc + module.lessons.reduce((lessonAcc, lesson) => lessonAcc + lesson.blocks.length, 0),
    0
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Course Structure</h2>
          <p className="text-sm text-muted-foreground">
            Organize your content into modules and lessons with different content types.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{modules.length} modules</span>
          <span>•</span>
          <span>{totalLessons} lessons</span>
          <span>•</span>
          <span>{totalBlocks} blocks</span>
        </div>
      </div>

      {/* Add Module Section */}
      <Card className="border-dashed border-2 border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Add New Module
          </CardTitle>
          <CardDescription>
            Modules group related lessons together. Start by creating your first module.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isAddingModule ? (
            <div className="flex items-center gap-2">
              <Input
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                placeholder="Module title..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddModule()
                  } else if (e.key === 'Escape') {
                    setIsAddingModule(false)
                    setNewModuleTitle('')
                  }
                }}
                autoFocus
              />
              <Button onClick={handleAddModule} disabled={!newModuleTitle.trim()}>
                Add
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddingModule(false)
                  setNewModuleTitle('')
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button onClick={() => setIsAddingModule(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Create Module
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Modules List */}
      <div className="space-y-4">
        {modules.length === 0 ? (
          <Card className="border-border/60 bg-muted/30">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No modules yet</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Create your first module to start organizing your course content.
              </p>
              <Button onClick={() => setIsAddingModule(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Module
              </Button>
            </CardContent>
          </Card>
        ) : (
          modules.map((module) => (
            <ModuleAccordion
              key={module.id}
              module={module}
              onUpdateModule={handleUpdateModule}
              onDeleteModule={handleDeleteModule}
              onAddLesson={handleAddLesson}
              onUpdateLesson={handleUpdateLesson}
              onDeleteLesson={handleDeleteLesson}
              onAddBlock={handleAddBlock}
              onUpdateBlock={handleUpdateBlock}
              onDeleteBlock={handleDeleteBlock}
            />
          ))
        )}
      </div>

      {/* Help Card */}
      <Card className="border-border/60 bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">How it works</CardTitle>
          <CardDescription>
            Build your course structure step by step with this intuitive interface.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <FolderOpen className="h-4 w-4 mt-0.5 text-primary" />
            <div>
              <p className="font-medium text-foreground">Modules</p>
              <p>Group related lessons together. Think of them as chapters in your course.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <BookOpen className="h-4 w-4 mt-0.5 text-primary" />
            <div>
              <p className="font-medium text-foreground">Lessons</p>
              <p>Individual learning units within each module. Each lesson can contain multiple content blocks.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Video className="h-4 w-4 mt-0.5 text-primary" />
            <div>
              <p className="font-medium text-foreground">Video Lessons</p>
              <p>Upload videos or add streaming links. Perfect for presentations, tutorials, and demonstrations.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <FileText className="h-4 w-4 mt-0.5 text-primary" />
            <div>
              <p className="font-medium text-foreground">Resources</p>
              <p>Add documents, PDFs, links, and other supplementary materials to support learning.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
