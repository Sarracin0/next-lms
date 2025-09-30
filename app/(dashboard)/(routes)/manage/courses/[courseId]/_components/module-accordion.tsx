'use client'

import { useState, useRef, useCallback } from 'react'
import { Plus, Trash2, Edit3, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { VideoInput } from './video-input'

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

interface ModuleAccordionProps {
  module: Module
  onUpdateModule: (moduleId: string, data: Partial<Module>) => void
  onDeleteModule: (moduleId: string) => void
  onAddLesson: (moduleId: string) => void
  onUpdateLesson: (moduleId: string, lessonId: string, data: Partial<Lesson>) => void
  onDeleteLesson: (moduleId: string, lessonId: string) => void
  onAddBlock: (moduleId: string, lessonId: string, type: 'VIDEO_LESSON' | 'RESOURCES') => void
  onUpdateBlock: (moduleId: string, lessonId: string, blockId: string, data: Partial<LessonBlock>) => void
  onDeleteBlock: (moduleId: string, lessonId: string, blockId: string) => void
}

export const ModuleAccordion = ({
  module,
  onUpdateModule,
  onDeleteModule,
  onAddLesson,
  onUpdateLesson,
  onDeleteLesson,
  onAddBlock,
  onUpdateBlock,
  onDeleteBlock,
}: ModuleAccordionProps) => {
  // Stati di editing
  const [editingModule, setEditingModule] = useState<{ field: 'title' | 'description' | null }>({ field: null })
  const [editingLesson, setEditingLesson] = useState<{ id: string; field: 'title' | 'description' } | null>(null)
  const [editingBlock, setEditingBlock] = useState<{ id: string; field: 'title' | 'content' | 'videoUrl' | 'contentUrl' } | null>(null)

  // Stati degli accordion - sempre aperti di default per evitare problemi
  const [moduleOpen, setModuleOpen] = useState(true)
  const [openLessons, setOpenLessons] = useState<Set<string>>(new Set())

  // Refs per focus management
  const moduleInputRef = useRef<HTMLInputElement>(null)
  const moduleTextareaRef = useRef<HTMLTextAreaElement>(null)

  // Helper per gestire apertura lezioni
  const toggleLesson = useCallback((lessonId: string) => {
    setOpenLessons(prev => {
      const newSet = new Set(prev)
      if (newSet.has(lessonId)) {
        newSet.delete(lessonId)
      } else {
        newSet.add(lessonId)
      }
      return newSet
    })
  }, [])

  const ensureLessonOpen = useCallback((lessonId: string) => {
    setOpenLessons(prev => new Set(prev).add(lessonId))
  }, [])

  // Handlers per module
  const handleModuleEdit = useCallback((field: 'title' | 'description') => {
    setEditingModule({ field })
    setModuleOpen(true)

    // Focus dopo il re-render
    requestAnimationFrame(() => {
      if (field === 'title') {
        moduleInputRef.current?.focus()
      } else {
        moduleTextareaRef.current?.focus()
      }
    })
  }, [])

  const handleModuleUpdate = useCallback((field: keyof Module, value: string | boolean) => {
    onUpdateModule(module.id, { [field]: value })
  }, [module.id, onUpdateModule])

  const handleModuleSave = useCallback(() => {
    setEditingModule({ field: null })
  }, [])

  // Handlers per lesson
  const handleLessonEdit = useCallback((lessonId: string, field: 'title' | 'description') => {
    setEditingLesson({ id: lessonId, field })
    ensureLessonOpen(lessonId)
    setModuleOpen(true)
  }, [ensureLessonOpen])

  const handleLessonUpdate = useCallback((lessonId: string, field: keyof Lesson, value: string | boolean) => {
    onUpdateLesson(module.id, lessonId, { [field]: value })
  }, [module.id, onUpdateLesson])

  const handleLessonSave = useCallback(() => {
    setEditingLesson(null)
  }, [])

  // Handlers per block
  const handleBlockEdit = useCallback((blockId: string, field: 'title' | 'content' | 'videoUrl' | 'contentUrl') => {
    setEditingBlock({ id: blockId, field })
  }, [])

  const handleBlockUpdate = useCallback((lessonId: string, blockId: string, field: keyof LessonBlock, value: string | boolean) => {
    onUpdateBlock(module.id, lessonId, blockId, { [field]: value })
  }, [module.id, onUpdateBlock])

  const handleBlockSave = useCallback(() => {
    setEditingBlock(null)
  }, [])

  // Gestione keyboard events
  const handleKeyDown = useCallback((e: React.KeyboardEvent, saveHandler: () => void) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      saveHandler()
    } else if (e.key === 'Escape') {
      saveHandler()
    }
  }, [])

  return (
    <div className="border border-border/60 rounded-lg">
      {/* Module Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/30">
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setModuleOpen(!moduleOpen)}
            className="h-auto p-1"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${moduleOpen ? '' : '-rotate-90'}`} />
          </Button>

          <div className="flex items-center gap-2">
            {editingModule.field === 'title' ? (
              <Input
                ref={moduleInputRef}
                value={module.title}
                onChange={(e) => handleModuleUpdate('title', e.target.value)}
                onBlur={handleModuleSave}
                onKeyDown={(e) => handleKeyDown(e, handleModuleSave)}
                className="h-8 font-semibold"
                autoFocus
              />
            ) : (
              <h3
                className="font-semibold text-foreground cursor-pointer hover:text-primary transition-colors"
                onClick={() => handleModuleEdit('title')}
              >
                {module.title}
              </h3>
            )}
          </div>

          <Badge variant={module.isPublished ? 'default' : 'secondary'} className="text-xs">
            {module.isPublished ? 'Published' : 'Draft'}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {module.lessons.length} lesson{module.lessons.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => onAddLesson(module.id)}>
            <Plus className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleModuleEdit('title')}>
            <Edit3 className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => onDeleteModule(module.id)} className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Module Content */}
      {moduleOpen && (
        <div className="p-4 space-y-4">
          {/* Module Description */}
          <div>
            {editingModule.field === 'description' ? (
              <Textarea
                ref={moduleTextareaRef}
                value={module.description || ''}
                onChange={(e) => handleModuleUpdate('description', e.target.value)}
                onBlur={handleModuleSave}
                onKeyDown={(e) => handleKeyDown(e, handleModuleSave)}
                placeholder="Module description..."
                className="min-h-[60px] text-sm"
                autoFocus
              />
            ) : (
              <p
                className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => handleModuleEdit('description')}
              >
                {module.description || 'Click to add description...'}
              </p>
            )}
          </div>

          {/* Lessons */}
          <div className="space-y-2">
            {module.lessons.map((lesson) => (
              <LessonItem
                key={lesson.id}
                lesson={lesson}
                moduleId={module.id}
                isOpen={openLessons.has(lesson.id)}
                editingLesson={editingLesson}
                editingBlock={editingBlock}
                onToggle={() => toggleLesson(lesson.id)}
                onLessonEdit={handleLessonEdit}
                onLessonUpdate={handleLessonUpdate}
                onLessonSave={handleLessonSave}
                onBlockEdit={handleBlockEdit}
                onBlockUpdate={handleBlockUpdate}
                onBlockSave={handleBlockSave}
                onAddBlock={onAddBlock}
                onDeleteLesson={onDeleteLesson}
                onDeleteBlock={onDeleteBlock}
                handleKeyDown={handleKeyDown}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Componente separato per le lezioni per migliorare performance e isolation
interface LessonItemProps {
  lesson: Lesson
  moduleId: string
  isOpen: boolean
  editingLesson: { id: string; field: 'title' | 'description' } | null
  editingBlock: { id: string; field: 'title' | 'content' | 'videoUrl' | 'contentUrl' } | null
  onToggle: () => void
  onLessonEdit: (lessonId: string, field: 'title' | 'description') => void
  onLessonUpdate: (lessonId: string, field: keyof Lesson, value: string | boolean) => void
  onLessonSave: () => void
  onBlockEdit: (blockId: string, field: 'title' | 'content' | 'videoUrl' | 'contentUrl') => void
  onBlockUpdate: (lessonId: string, blockId: string, field: keyof LessonBlock, value: string | boolean) => void
  onBlockSave: () => void
  onAddBlock: (moduleId: string, lessonId: string, type: 'VIDEO_LESSON' | 'RESOURCES') => void
  onDeleteLesson: (moduleId: string, lessonId: string) => void
  onDeleteBlock: (moduleId: string, lessonId: string, blockId: string) => void
  handleKeyDown: (e: React.KeyboardEvent, saveHandler: () => void) => void
}

const LessonItem = ({
  lesson,
  moduleId,
  isOpen,
  editingLesson,
  editingBlock,
  onToggle,
  onLessonEdit,
  onLessonUpdate,
  onLessonSave,
  onBlockEdit,
  onBlockUpdate,
  onBlockSave,
  onAddBlock,
  onDeleteLesson,
  onDeleteBlock,
  handleKeyDown,
}: LessonItemProps) => {
  const lessonInputRef = useRef<HTMLInputElement>(null)
  const lessonTextareaRef = useRef<HTMLTextAreaElement>(null)

  return (
    <div className="border border-border/40 rounded-lg">
      {/* Lesson Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/20">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="h-auto p-1"
          >
            <ChevronRight className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
          </Button>

          <div className="flex items-center gap-2">
            {editingLesson?.id === lesson.id && editingLesson.field === 'title' ? (
              <Input
                ref={lessonInputRef}
                value={lesson.title}
                onChange={(e) => onLessonUpdate(lesson.id, 'title', e.target.value)}
                onBlur={onLessonSave}
                onKeyDown={(e) => handleKeyDown(e, onLessonSave)}
                className="h-6 text-sm font-medium"
                autoFocus
              />
            ) : (
              <span
                className="text-sm font-medium cursor-pointer hover:text-primary transition-colors"
                onClick={() => onLessonEdit(lesson.id, 'title')}
              >
                {lesson.title}
              </span>
            )}
          </div>

          <Badge variant={lesson.isPublished ? 'default' : 'secondary'} className="text-xs">
            {lesson.isPublished ? 'Published' : 'Draft'}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {lesson.blocks.length} block{lesson.blocks.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onAddBlock(moduleId, lesson.id, 'VIDEO_LESSON')}
            className="h-6 w-6 p-0"
            title="Add Video Block"
          >
            <Plus className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onAddBlock(moduleId, lesson.id, 'RESOURCES')}
            className="h-6 w-6 p-0"
            title="Add Resource Block"
          >
            <Plus className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onLessonEdit(lesson.id, 'title')}
            className="h-6 w-6 p-0"
          >
            <Edit3 className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDeleteLesson(moduleId, lesson.id)}
            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Lesson Content */}
      {isOpen && (
        <div className="p-3 space-y-3">
          {/* Lesson Description */}
          <div>
            {editingLesson?.id === lesson.id && editingLesson.field === 'description' ? (
              <Textarea
                ref={lessonTextareaRef}
                value={lesson.description || ''}
                onChange={(e) => onLessonUpdate(lesson.id, 'description', e.target.value)}
                onBlur={onLessonSave}
                onKeyDown={(e) => handleKeyDown(e, onLessonSave)}
                placeholder="Lesson description..."
                className="min-h-[40px] text-xs"
                autoFocus
              />
            ) : (
              <p
                className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                onClick={() => onLessonEdit(lesson.id, 'description')}
              >
                {lesson.description || 'Click to add description...'}
              </p>
            )}
          </div>

          {/* Blocks */}
          <div className="space-y-2">
            {lesson.blocks.map((block) => (
              <div key={block.id} className="bg-muted/30 rounded-md p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {block.type === 'VIDEO_LESSON' ? 'Video' : 'Resources'}
                    </Badge>

                    {editingBlock?.id === block.id && editingBlock.field === 'title' ? (
                      <Input
                        value={block.title}
                        onChange={(e) => onBlockUpdate(lesson.id, block.id, 'title', e.target.value)}
                        onBlur={onBlockSave}
                        onKeyDown={(e) => handleKeyDown(e, onBlockSave)}
                        className="h-5 text-sm"
                        autoFocus
                      />
                    ) : (
                      <span
                        className="text-sm font-medium cursor-pointer hover:text-primary transition-colors"
                        onClick={() => onBlockEdit(block.id, 'title')}
                      >
                        {block.title}
                      </span>
                    )}

                    <Badge variant={block.isPublished ? 'default' : 'secondary'} className="text-xs">
                      {block.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onBlockEdit(block.id, 'title')}
                      className="h-6 w-6 p-0"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteBlock(moduleId, lesson.id, block.id)}
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Block Content based on type */}
                {block.type === 'VIDEO_LESSON' ? (
                  <div className="space-y-2">
                    <VideoInput
                      value={block.videoUrl || ''}
                      onChange={(url) => onBlockUpdate(lesson.id, block.id, 'videoUrl', url)}
                      className="text-xs"
                    />
                    {editingBlock?.id === block.id && editingBlock.field === 'content' ? (
                      <Textarea
                        value={block.content || ''}
                        onChange={(e) => onBlockUpdate(lesson.id, block.id, 'content', e.target.value)}
                        onBlur={onBlockSave}
                        onKeyDown={(e) => handleKeyDown(e, onBlockSave)}
                        placeholder="Video description or notes..."
                        className="min-h-[60px] text-xs"
                        autoFocus
                      />
                    ) : (
                      <p
                        className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => onBlockEdit(block.id, 'content')}
                      >
                        {block.content || 'Click to add description...'}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {editingBlock?.id === block.id && editingBlock.field === 'contentUrl' ? (
                      <Input
                        value={block.contentUrl || ''}
                        onChange={(e) => onBlockUpdate(lesson.id, block.id, 'contentUrl', e.target.value)}
                        onBlur={onBlockSave}
                        onKeyDown={(e) => handleKeyDown(e, onBlockSave)}
                        placeholder="Resource URL"
                        className="text-xs"
                        autoFocus
                      />
                    ) : (
                      <p
                        className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => onBlockEdit(block.id, 'contentUrl')}
                      >
                        {block.contentUrl || 'Click to add resource URL...'}
                      </p>
                    )}

                    {editingBlock?.id === block.id && editingBlock.field === 'content' ? (
                      <Textarea
                        value={block.content || ''}
                        onChange={(e) => onBlockUpdate(lesson.id, block.id, 'content', e.target.value)}
                        onBlur={onBlockSave}
                        onKeyDown={(e) => handleKeyDown(e, onBlockSave)}
                        placeholder="Resource description..."
                        className="min-h-[60px] text-xs"
                        autoFocus
                      />
                    ) : (
                      <p
                        className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                        onClick={() => onBlockEdit(block.id, 'content')}
                      >
                        {block.content || 'Click to add description...'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}