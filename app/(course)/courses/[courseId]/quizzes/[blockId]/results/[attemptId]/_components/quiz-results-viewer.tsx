import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export type QuizResultsViewerQuestion = {
  id: string
  text: string
  explanation: string | null
  options: { id: string; text: string; isCorrect: boolean }[]
  userSelection: {
    selectedOptionIds: string[]
    freeText: string | null
    isCorrect: boolean | null
    scoreAwarded: number
  }
}

type QuizResultsViewerProps = {
  quiz: {
    id: string
    title: string
    passScore: number
    pointsReward: number
  }
  attempt: {
    id: string
    score: number
    maxScore: number
    percent: number
    passed: boolean
    submittedAt: Date | null
  }
  questions: QuizResultsViewerQuestion[]
  retakeHref: string
}

export function QuizResultsViewer({ quiz, attempt, questions, retakeHref }: QuizResultsViewerProps) {
  return (
    <div className="space-y-6">
      <Card className="border border-border/60 bg-card/80 shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-lg font-semibold">Risultati quiz: {quiz.title}</CardTitle>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant={attempt.passed ? 'default' : 'secondary'} className="uppercase">
              {attempt.passed ? 'Superato' : 'Non superato'}
            </Badge>
            <span>Score: {attempt.score}/{attempt.maxScore} ({attempt.percent}%)</span>
            <span>Pass score: {quiz.passScore}%</span>
            {quiz.pointsReward > 0 ? <span>Punti assegnati: {quiz.pointsReward}</span> : null}
            {attempt.submittedAt ? (
              <span>Inviato il {attempt.submittedAt.toLocaleString()}</span>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <Button asChild variant="outline">
            <Link href={retakeHref}>Riprova quiz</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {questions.map((question, index) => {
          const selectedOptions = new Set(question.userSelection.selectedOptionIds)
          const correctOptions = question.options.filter((opt) => opt.isCorrect)

          return (
            <Card key={question.id} className="border border-border/50 bg-background/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium text-foreground">
                  {index + 1}. {question.text}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={question.userSelection.isCorrect ? 'default' : 'secondary'}>
                    {question.userSelection.isCorrect ? 'Corretto' : 'Da rivedere'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Punteggio: {question.userSelection.scoreAwarded}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="space-y-2">
                  {question.options.map((option) => {
                    const isSelected = selectedOptions.has(option.id)
                    const isCorrectOption = option.isCorrect
                    const state = isCorrectOption
                      ? 'correct'
                      : isSelected
                        ? 'selected'
                        : 'neutral'

                    return (
                      <div
                        key={option.id}
                        data-state={state}
                        className="flex items-start gap-2 rounded-md border border-border/40 bg-card/70 px-3 py-2 text-foreground data-[state=correct]:border-emerald-400 data-[state=correct]:bg-emerald-50 data-[state=selected]:border-amber-400 data-[state=selected]:bg-amber-50"
                      >
                        <span className="text-xs uppercase text-muted-foreground">
                          {isCorrectOption ? 'Corretta' : isSelected ? 'Scelta' : 'Opzione'}
                        </span>
                        <span className="text-sm">{option.text}</span>
                      </div>
                    )
                  })}
                </div>

                {question.userSelection.freeText ? (
                  <div className="rounded-md border border-border/40 bg-muted/30 p-3 text-sm">
                    <p className="font-medium text-muted-foreground">Risposta libera:</p>
                    <p className="whitespace-pre-line text-foreground">{question.userSelection.freeText}</p>
                  </div>
                ) : null}

                {correctOptions.length > 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Risposte corrette: {correctOptions.map((opt) => opt.text).join(', ')}
                  </p>
                ) : null}

                {question.explanation ? (
                  <p className="text-xs text-muted-foreground">Spiegazione: {question.explanation}</p>
                ) : null}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
