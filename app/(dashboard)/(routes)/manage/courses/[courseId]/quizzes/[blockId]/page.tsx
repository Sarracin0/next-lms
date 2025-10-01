import { notFound } from 'next/navigation'
import { assertRole, requireAuthContext } from '@/lib/current-profile'
import { db } from '@/lib/db'
import { UserRole } from '@prisma/client'
import QuizEditor from './_components/quiz-editor'

export default async function ManageQuizPage({ params }: { params: Promise<{ courseId: string; blockId: string }> }) {
  const { profile, company } = await requireAuthContext()
  assertRole(profile, [UserRole.HR_ADMIN, UserRole.TRAINER])

  const { courseId, blockId } = await params

  const block = await db.lessonBlock.findFirst({
    where: { id: blockId, lesson: { module: { courseId, course: { companyId: company.id } } } },
    include: {
      quiz: {
        include: {
          questions: {
            include: { options: true, answers: false },
            orderBy: { position: 'asc' },
          },
        },
      },
      lesson: { include: { module: { include: { course: true } } } },
    },
  })

  if (!block || !block.quiz) {
    notFound()
  }

  const quiz = block.quiz

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Quiz builder</h1>
        <p className="text-sm text-muted-foreground">Configura le domande, le opzioni e i punteggi per il quiz</p>
      </div>
      <QuizEditor
        courseId={courseId}
        blockId={blockId}
        quiz={quiz}
      />
    </div>
  )
}
