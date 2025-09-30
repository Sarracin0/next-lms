'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Trash2, Edit3, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { VideoInput } from './video-input'
import { cn } from '@/lib/utils'

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

type ModuleAccordionProps = {
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
  const [isEditingModule, setIsEditingModule] = useState(false)
  const [editingLesson, setEditingLesson] = useState<string | null>(null)
  const [editingBlock, setEditingBlock] = useState<string | null>(null)
  
  // Stati per gestire l'apertura degli accordion e prevenire chiusura durante l'editing
  const [openModuleId, setOpenModuleId] = useState<string | null>(module.id)
  const [openLessonId, setOpenLessonId] = useState<string | null>(null)
  
  // Refs per gestire il focus e prevenire chiusura accidentale
  const moduleInputRef = useRef<HTMLInputElement>(null)
  const lessonInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})
  const blockInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  // Gestione aggiornamenti con prevenzione chiusura accordion
  const handleModuleUpdate = (field: keyof Module, value: string | boolean) => {
    onUpdateModule(module.id, { [field]: value })
    // Non chiudere l'editing immediatamente per evitare chiusura accordion
    if (field === 'title' || field === 'description') {
      // Delay per permettere al componente di stabilizzarsi
      setTimeout(() => setIsEditingModule(false), 100)
    }
  }

  const handleLessonUpdate = (lessonId: string, field: keyof Lesson, value: string | boolean) => {
    onUpdateLesson(module.id, lessonId, { [field]: value })
    // Mantieni aperto l'accordion della lezione durante l'editing
    setOpenLessonId(lessonId)
    if (field === 'title' || field === 'description') {
      setTimeout(() => setEditingLesson(null), 100)
    }
  }

  const handleBlockUpdate = (lessonId: string, blockId: string, field: keyof LessonBlock, value: string | boolean) => {
    onUpdateBlock(module.id, lessonId, blockId, { [field]: value })
    // Mantieni aperto l'accordion della lezione durante l'editing del blocco
    setOpenLessonId(lessonId)
    if (field === 'title' || field === 'content') {
      setTimeout(() => setEditingBlock(null), 100)
    }
  }

  // Gestione focus per prevenire chiusura accidentale
  const handleModuleFocus = () => {
    setOpenModuleId(module.id)
  }

  const handleLessonFocus = (lessonId: string) => {
    setOpenLessonId(lessonId)
    setOpenModuleId(module.id)
  }

  return (
    <Accordion 
      type="single" 
      collapsible 
      className="w-full"
      value={openModuleId === module.id ? module.id : undefined}
      onValueChange={(value) => {
        // Prevenire chiusura se stiamo editando
        if (isEditingModule || editingLesson || editingBlock) {
          return
        }
        setOpenModuleId(value === module.id ? module.id : null)
      }}
    >
      <AccordionItem value={module.id} className="border border-border/60 rounded-lg">
        <AccordionTrigger className="px-4 py-3 hover:no-underline">
          <div className="flex items-center justify-between w-full mr-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-foreground">
                  {isEditingModule ? (
                    <Input
                      ref={moduleInputRef}
                      value={module.title}
                      onChange={(e) => handleModuleUpdate('title', e.target.value)}
                      onFocus={handleModuleFocus}
                      onBlur={() => {
                        // Delay per permettere al click di completarsi
                        setTimeout(() => setIsEditingModule(false), 150)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setIsEditingModule(false)
                        } else if (e.key === 'Escape') {
                          setIsEditingModule(false)
                        }
                      }}
                      className="h-6 text-sm font-semibold"
                      autoFocus
                    />
                  ) : (
                    <span 
                      onClick={() => {
                        setIsEditingModule(true)
                        setOpenModuleId(module.id)
                      }} 
                      className="cursor-pointer"
                    >
                      {module.title}
                    </span>
                  )}
                </span>
              </div>
              <Badge variant={module.isPublished ? 'default' : 'secondary'} className="text-xs">
                {module.isPublished ? 'Published' : 'Draft'}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {module.lessons.length} lesson{module.lessons.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onAddLesson(module.id)
                }}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEditingModule(true)
                }}
                className="h-8 w-8 p-0"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteModule(module.id)
                }}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="space-y-4">
            {/* Module Description */}
            <div>
              {isEditingModule ? (
                <Textarea
                  value={module.description || ''}
                  onChange={(e) => handleModuleUpdate('description', e.target.value)}
                  onFocus={handleModuleFocus}
                  onBlur={() => {
                    setTimeout(() => setIsEditingModule(false), 150)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setIsEditingModule(false)
                    }
                  }}
                  placeholder="Module description..."
                  className="min-h-[60px] text-sm"
                />
              ) : (
                <p
                  className="text-sm text-muted-foreground cursor-pointer"
                  onClick={() => {
                    setIsEditingModule(true)
                    setOpenModuleId(module.id)
                  }}
                >
                  {module.description || 'Click to add description...'}
                </p>
              )}
            </div>

            {/* Lessons */}
            <div className="space-y-2">
              {module.lessons.map((lesson) => (
                <div key={lesson.id} className="border border-border/40 rounded-lg">
                  <Accordion 
                    type="single" 
                    collapsible
                    value={openLessonId === lesson.id ? lesson.id : undefined}
                    onValueChange={(value) => {
                      // Prevenire chiusura se stiamo editando
                      if (editingLesson === lesson.id || editingBlock) {
                        return
                      }
                      setOpenLessonId(value === lesson.id ? lesson.id : null)
                    }}
                  >
                    <AccordionItem value={lesson.id} className="border-0">
                      <AccordionTrigger className="px-3 py-2 hover:no-underline">
                        <div className="flex items-center justify-between w-full mr-4">
                          <div className="flex items-center gap-2">
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              {editingLesson === lesson.id ? (
                                <Input
                                  ref={(el) => {
                                    lessonInputRefs.current[lesson.id] = el
                                  }}
                                  value={lesson.title}
                                  onChange={(e) => handleLessonUpdate(lesson.id, 'title', e.target.value)}
                                  onFocus={() => handleLessonFocus(lesson.id)}
                                  onBlur={() => {
                                    setTimeout(() => setEditingLesson(null), 150)
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      setEditingLesson(null)
                                    } else if (e.key === 'Escape') {
                                      setEditingLesson(null)
                                    }
                                  }}
                                  className="h-5 text-sm"
                                  autoFocus
                                />
                              ) : (
                                <span
                                  onClick={() => {
                                    setEditingLesson(lesson.id)
                                    handleLessonFocus(lesson.id)
                                  }}
                                  className="cursor-pointer"
                                >
                                  {lesson.title}
                                </span>
                              )}
                            </span>
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
                              onClick={(e) => {
                                e.stopPropagation()
                                onAddBlock(module.id, lesson.id, 'VIDEO_LESSON')
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                onAddBlock(module.id, lesson.id, 'RESOURCES')
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingLesson(lesson.id)
                              }}
                              className="h-6 w-6 p-0"
                            >
                              <Edit3 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                onDeleteLesson(module.id, lesson.id)
                              }}
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pb-3">
                        <div className="space-y-3">
                          {/* Lesson Description */}
                          <div>
                            {editingLesson === lesson.id ? (
                              <Textarea
                                value={lesson.description || ''}
                                onChange={(e) => handleLessonUpdate(lesson.id, 'description', e.target.value)}
                                onFocus={() => handleLessonFocus(lesson.id)}
                                onBlur={() => {
                                  setTimeout(() => setEditingLesson(null), 150)
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') {
                                    setEditingLesson(null)
                                  }
                                }}
                                placeholder="Lesson description..."
                                className="min-h-[40px] text-xs"
                              />
                            ) : (
                              <p
                                className="text-xs text-muted-foreground cursor-pointer"
                                onClick={() => {
                                  setEditingLesson(lesson.id)
                                  handleLessonFocus(lesson.id)
                                }}
                              >
                                {lesson.description || 'Click to add description...'}
                              </p>
                            )}
                          </div>

                          {/* Blocks */}
                          <div className="space-y-2">
                            {lesson.blocks.map((block) => (
                              <div key={block.id} className="bg-muted/30 rounded-md p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {block.type === 'VIDEO_LESSON' ? 'Video' : 'Resources'}
                                    </Badge>
                                    <span className="text-sm font-medium">
                                      {editingBlock === block.id ? (
                                        <Input
                                          ref={(el) => {
                                            blockInputRefs.current[block.id] = el
                                          }}
                                          value={block.title}
                                          onChange={(e) => handleBlockUpdate(lesson.id, block.id, 'title', e.target.value)}
                                          onFocus={() => handleLessonFocus(lesson.id)}
                                          onBlur={() => {
                                            setTimeout(() => setEditingBlock(null), 150)
                                          }}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                              setEditingBlock(null)
                                            } else if (e.key === 'Escape') {
                                              setEditingBlock(null)
                                            }
                                          }}
                                          className="h-5 text-sm"
                                          autoFocus
                                        />
                                      ) : (
                                        <span
                                          onClick={() => {
                                            setEditingBlock(block.id)
                                            handleLessonFocus(lesson.id)
                                          }}
                                          className="cursor-pointer"
                                        >
                                          {block.title}
                                        </span>
                                      )}
                                    </span>
                                    <Badge variant={block.isPublished ? 'default' : 'secondary'} className="text-xs">
                                      {block.isPublished ? 'Published' : 'Draft'}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => setEditingBlock(block.id)}
                                      className="h-6 w-6 p-0"
                                    >
                                      <Edit3 className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => onDeleteBlock(module.id, lesson.id, block.id)}
                                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                                
                                {/* Block Content */}
                                {editingBlock === block.id && (
                                  <div className="mt-2 space-y-2">
                                    {block.type === 'VIDEO_LESSON' ? (
                                      <div className="space-y-2">
                                        {/* Video Input con opzioni Upload/URL */}
                                        <VideoInput
                                          value={block.videoUrl || ''}
                                          onChange={(url) => handleBlockUpdate(lesson.id, block.id, 'videoUrl', url)}
                                          placeholder="Video URL or upload"
                                          className="text-xs"
                                        />
                                        <Textarea
                                          placeholder="Video description or notes..."
                                          value={block.content || ''}
                                          onChange={(e) => handleBlockUpdate(lesson.id, block.id, 'content', e.target.value)}
                                          className="min-h-[60px] text-xs"
                                        />
                                      </div>
                                    ) : (
                                      <div className="space-y-2">
                                        <Input
                                          placeholder="Resource URL"
                                          value={block.contentUrl || ''}
                                          onChange={(e) => handleBlockUpdate(lesson.id, block.id, 'contentUrl', e.target.value)}
                                          className="text-xs"
                                        />
                                        <Textarea
                                          placeholder="Resource description..."
                                          value={block.content || ''}
                                          onChange={(e) => handleBlockUpdate(lesson.id, block.id, 'content', e.target.value)}
                                          className="min-h-[60px] text-xs"
                                        />
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              ))}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}
