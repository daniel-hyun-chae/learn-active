import type { QuizAttemptDraft } from '@app/shared-graphql'
import type { KeyValueStorage } from './storage'

const QUIZ_ATTEMPT_PREFIX = 'quiz-attempt:'

function getKey(attemptId: string) {
  return `${QUIZ_ATTEMPT_PREFIX}${attemptId}`
}

function safeParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function createQuizAttemptStore(storage: KeyValueStorage) {
  return {
    async save(draft: QuizAttemptDraft) {
      await storage.setItem(getKey(draft.attemptId), JSON.stringify(draft))
    },
    async load(attemptId: string) {
      const raw = await storage.getItem(getKey(attemptId))
      if (!raw) {
        return null
      }
      return safeParse<QuizAttemptDraft>(raw)
    },
    async remove(attemptId: string) {
      await storage.removeItem(getKey(attemptId))
    },
    async list() {
      if (!storage.listKeys) {
        return [] as QuizAttemptDraft[]
      }

      const keys = await storage.listKeys(QUIZ_ATTEMPT_PREFIX)
      const drafts = await Promise.all(keys.map((key) => storage.getItem(key)))
      return drafts
        .filter((value): value is string => typeof value === 'string')
        .map((value) => safeParse<QuizAttemptDraft>(value))
        .filter((value): value is QuizAttemptDraft => value !== null)
    },
  }
}
