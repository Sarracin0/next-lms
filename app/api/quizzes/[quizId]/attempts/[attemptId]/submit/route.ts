import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { assertRole, requireAuthContext } from '@/lib/current-profile'
import { Prisma, UserRole } from '@prisma/client'

// Submit answers for an attempt, evaluate score and mark pass/fail
// Body shape: { answers: Array<{ questionId: string, selectedOptionIds?: string[], freeText?: string }> }
export async function POST(request: NextRequest, { params }: { params: Promise<{ quizId: string; attemptId: string }> }) {
  const { profile, company } = await requireAuthContext()
  assertRole(profile, [UserRole.LEARNER, UserRole.HR_ADMIN, UserRole.TRAINER])

  const { quizId, attemptId } = await params
  const body = await request.json()

  const attempt = await db.quizAttempt.findFirst({
    where: { id: attemptId, quizId, userProfileId: profile.id },
    include: { quiz: { include: { questions: { include: { options: true } }, lessonBlock: { include: { lesson: true } } } } },
  })

  if (!attempt || attempt.quiz.companyId !== company.id) {
    return new NextResponse('Not found', { status: 404 })
  }
  if (attempt.submittedAt) {
    return new NextResponse('Attempt already submitted', { status: 400 })
  }

  const answersInput: Array<{ questionId: string; selectedOptionIds?: string[]; freeText?: string }> = Array.isArray(body.answers) ? body.answers : []

  // Build maps for quick lookup
  const questionMap = new Map(attempt.quiz.questions.map((q) => [q.id, q]))

  let totalScore = 0
  let maxScore = 0

  const answersToCreate: Prisma.QuizAnswerCreateManyInput[] = []

  for (const q of attempt.quiz.questions) {
    const input = answersInput.find((a) => a.questionId === q.id)
    const selected = new Set(input?.selectedOptionIds ?? [])
    const correctOptionIds = new Set(q.options.filter((o) => o.isCorrect).map((o) => o.id))

    // Compute max score contribution for this question
    const maxOptionPoints = q.options.filter((o) => o.isCorrect).reduce((acc, o) => acc + (o.points || 0), 0)
    const questionMax = q.points > 0 ? q.points : maxOptionPoints
    maxScore += questionMax

    // Compute awarded score
    let isCorrect = false
    let scoreAwarded = 0
    if (q.type === 'SHORT_ANSWER') {
      // Manual grading by default: award 0, store freeText
      isCorrect = false
      scoreAwarded = 0
    } else {
      // Multiple/TrueFalse: exact match on correct options for correctness
      isCorrect = selected.size === correctOptionIds.size && [...selected].every((id) => correctOptionIds.has(id))
      // Award points as sum of selected options' points if they are correct; ignore incorrect options
      scoreAwarded = q.options
        .filter((o) => selected.has(o.id) && o.isCorrect)
        .reduce((acc, o) => acc + (o.points || 0), 0)
      // If question has a fixed points value, prefer that when fully correct
      if (q.points > 0 && isCorrect) {
        scoreAwarded = q.points
      }
    }

    totalScore += scoreAwarded

    answersToCreate.push({
      attemptId: attempt.id,
      questionId: q.id,
      freeText: input?.freeText ?? null,
      isCorrect,
      scoreAwarded,
      id: undefined as any,
    })
  }

  // Persist answers and selected options
  const createdAnswers = await db.$transaction(async (tx) => {
    // Create answers first
    const created = await Promise.all(
      answersToCreate.map((a) => tx.quizAnswer.create({ data: { attemptId: a.attemptId, questionId: a.questionId, freeText: a.freeText, isCorrect: a.isCorrect, scoreAwarded: a.scoreAwarded } }))
    )

    // Create answer options mapping by created answer id
    for (const createdAns of created) {
      const q = questionMap.get(createdAns.questionId)!
      const selected = new Set(answersInput.find((i) => i.questionId === createdAns.questionId)?.selectedOptionIds ?? [])
      for (const optId of selected) {
        await tx.quizAnswerOption.create({ data: { answerId: createdAns.id, optionId: optId } })
      }
    }

    return created
  })

  // Compute pass/fail
  const percent = maxScore > 0 ? Math.round((totalScore * 100) / maxScore) : 0
  const passed = percent >= attempt.quiz.passScore

  // Update attempt
  const updatedAttempt = await db.quizAttempt.update({
    where: { id: attempt.id },
    data: {
      submittedAt: new Date(),
      score: totalScore,
      passed,
      durationSeconds: null,
    },
  })

  // Gamification and progress on pass
  if (passed) {
    // Award points
    if (attempt.quiz.pointsReward && attempt.quiz.pointsReward > 0) {
      await db.userPoints.create({
        data: {
          userProfileId: profile.id,
          delta: attempt.quiz.pointsReward,
          type: 'COMPLETION',
          reason: `Quiz ${attempt.quiz.title} passed`,
          referenceId: attempt.quiz.id,
        },
      })
    }
    // Mark lesson progress completed
    await db.userLessonProgress.upsert({
      where: { userProfileId_lessonId: { userProfileId: profile.id, lessonId: attempt.quiz.lessonBlock.lessonId } },
      create: {
        userProfileId: profile.id,
        lessonId: attempt.quiz.lessonBlock.lessonId,
        isCompleted: true,
        completedAt: new Date(),
        pointsAwarded: attempt.quiz.pointsReward || 0,
      },
      update: { isCompleted: true, completedAt: new Date(), pointsAwarded: attempt.quiz.pointsReward || 0 },
    })
  }

  return NextResponse.json({ attempt: updatedAttempt, percent, maxScore, totalScore, passed })
}
