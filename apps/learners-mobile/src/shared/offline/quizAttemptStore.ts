import { createQuizAttemptStore } from '@app/shared-utils'
import { asyncStorageAdapter } from './storage'

export const quizAttemptStore = createQuizAttemptStore(asyncStorageAdapter)
