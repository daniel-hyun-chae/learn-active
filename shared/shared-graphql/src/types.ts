export type QuizAnswerValue = string | number | boolean | string[] | null

export type QuizAttemptDraft = {
  attemptId: string
  quizId: string
  learnerId?: string
  answers: Record<string, QuizAnswerValue>
  startedAt: string
  completedAt?: string
}
