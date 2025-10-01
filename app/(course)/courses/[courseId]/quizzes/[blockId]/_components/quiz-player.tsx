"use client"

import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import type { Quiz, QuizQuestion, QuizOption, QuizAttempt } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export default function QuizPlayer({ quiz }: { quiz: Quiz & { questions: (QuizQuestion & { options: QuizOption[] })[] } }) {
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null)
  const [answers, setAnswers] = useState<Record<string, { selectedOptionIds?: string[]; freeText?: string }>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ percent: number; totalScore: number; maxScore: number; passed: boolean } | null>(null)

  const onStartAttempt = async () => {
    try {
      const res = await axios.post<QuizAttempt>(`/api/quizzes/${quiz.id}/attempts`)
      setAttempt(res.data)
      toast.success('Tentativo iniziato')
    } catch {
      toast.error('Impossibile iniziare il tentativo')
    }
  }

  const toggleOption = (questionId: string, optionId: string, multi: boolean) => {
    setAnswers((prev) => {
      const prevSel = new Set(prev[questionId]?.selectedOptionIds ?? [])
      if (multi) {
        prevSel.has(optionId) ? prevSel.delete(optionId) : prevSel.add(optionId)
      } else {
        if (prevSel.has(optionId) && prevSel.size === 1) {
          prevSel.clear()
        } else {
          return { ...prev, [questionId]: { selectedOptionIds: [optionId] } }
        }
      }
      return { ...prev, [questionId]: { selectedOptionIds: Array.from(prevSel) } }
    })
  }

  const onChangeFreeText = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], freeText: value } }))
  }

  const onSubmit = async () => {
    if (!attempt) return
    setSubmitting(true)
    try {
      const payload = {
        answers: quiz.questions.map((q) => ({
          questionId: q.id,
          selectedOptionIds: answers[q.id]?.selectedOptionIds ?? [],
          freeText: answers[q.id]?.freeText ?? undefined,
        })),
      }
      const res = await axios.post(`/api/quizzes/${quiz.id}/attempts/${attempt.id}/submit`, payload)
      setResult(res.data)
      toast.success(res.data.passed ? 'Quiz superato!' : 'Quiz inviato')
    } catch {
      toast.error('Errore durante l\'invio del quiz')
    } finally {
      setSubmitting(false)
    }
  }

  const canSubmit = useMemo(() => !!attempt, [attempt])

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">{quiz.title}</h1>
      <p className="text-sm text-muted-foreground">Per superare: {quiz.passScore}%</p>

      {!attempt ? (
        <Button onClick={onStartAttempt}>Inizia tentativo</Button>
      ) : null}

      {quiz.questions.map((q, idx) => (
        <Card key={q.id}>
          <CardContent className="space-y-2 p-4">
            <div className="font-medium">{idx + 1}. {q.text}</div>
            {q.type === 'SHORT_ANSWER' ? (
              <Input value={answers[q.id]?.freeText ?? ''} onChange={(e) => onChangeFreeText(q.id, e.target.value)} placeholder="Risposta breve" />
            ) : (
              <div className="space-y-1">
                {q.options.map((o) => {
                  const selected = new Set(answers[q.id]?.selectedOptionIds ?? [])
                  const isMulti = q.type === 'MULTIPLE_CHOICE'
                  return (
                    <label key={o.id} className="flex items-center gap-2 text-sm">
                      <input
                        type={isMulti ? 'checkbox' : 'radio'}
                        name={`q_${q.id}`}
                        checked={selected.has(o.id)}
                        onChange={() => toggleOption(q.id, o.id, isMulti)}
                      />
                      <span>{o.text}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <div className="flex items-center gap-2">
        <Button disabled={!canSubmit || submitting} onClick={onSubmit}>Invia</Button>
      </div>

      {result && (
        <div className="text-sm">
          <p>Score: {result.totalScore}/{result.maxScore} ({result.percent}%)</p>
          <p>{result.passed ? 'Stato: Superato ✅' : 'Stato: Non superato'}</p>
        </div>
      )}
    </div>
  )
}
