import { createQuizAttemptStore, createWebStorage } from '@app/shared-utils'

export const quizAttemptStore = createQuizAttemptStore(createWebStorage())
