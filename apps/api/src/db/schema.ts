import { jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export type CourseContent = {
  modules: Array<{
    id: string
    title: string
    order: number
    lessons: Array<{
      id: string
      title: string
      order: number
      contents: Array<{
        id: string
        type: string
        text?: string
        html?: string
        imageUrl?: string
        imageAlt?: string
        lexicalJson?: string
      }>
      contentPages: Array<{
        id: string
        title: string
        order: number
        contents: Array<{
          id: string
          type: string
          text?: string
          html?: string
          imageUrl?: string
          imageAlt?: string
          lexicalJson?: string
        }>
      }>
      exercises: Array<{
        id: string
        type: string
        title: string
        instructions?: string
        steps: Array<{
          id: string
          order: number
          prompt: string
          threadId: string
          threadTitle?: string
          segments: Array<{
            type: string
            text?: string
            blankId?: string
          }>
          blanks: Array<{
            id: string
            correct: string
            variant: string
            options?: string[]
          }>
        }>
      }>
    }>
  }>
}

export const courses = pgTable('courses', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  content: jsonb('content').$type<CourseContent>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})
