import type { CourseContent } from './model.js'
import {
  BlankVariant,
  ContentType,
  ExerciseType,
  SegmentType,
} from './types.js'

type SeedCourse = {
  id: string
  title: string
  description: string
  modules: CourseContent['modules']
}

export const courses: SeedCourse[] = [
  {
    id: 'course-german-1',
    title: 'German Essentials: Greetings',
    description:
      'Build confidence with everyday German greetings and introductions.',
    modules: [
      {
        id: 'module-german-1',
        title: 'Greetings and Introductions',
        order: 1,
        lessons: [
          {
            id: 'lesson-german-1',
            title: 'Hallo! Saying hello in German',
            order: 1,
            contents: [
              {
                id: 'content-german-1',
                type: ContentType.TEXT,
                text: 'Welcome! In this lesson you will practice friendly German greetings.',
              },
              {
                id: 'content-german-2',
                type: ContentType.IMAGE,
                imageUrl: 'https://placehold.co/640x320/png',
                imageAlt: 'A cozy cafe scene used for the greeting lesson.',
              },
              {
                id: 'content-german-3',
                type: ContentType.TEXT,
                text: 'Read each sentence and fill in the missing words to complete the conversation.',
              },
            ],
            contentPages: [],
            exercises: [
              {
                id: 'exercise-german-1',
                type: ExerciseType.FILL_IN_THE_BLANK,
                title: 'Introduce yourself at the cafe',
                fillInBlank: {
                  steps: [
                    {
                      id: 'step-german-1',
                      order: 1,
                      prompt: 'Complete the greeting.',
                      threadId: 'thread-cafe',
                      threadTitle: 'Cafe conversation',
                      segments: [
                        { type: SegmentType.TEXT, text: 'Hallo, ich heiße ' },
                        { type: SegmentType.BLANK, blankId: 'blank-german-1' },
                        { type: SegmentType.TEXT, text: '.' },
                      ],
                      blanks: [
                        {
                          id: 'blank-german-1',
                          correct: 'Anna',
                          variant: BlankVariant.OPTIONS,
                          options: ['Anna', 'Peter', 'Berlin'],
                        },
                      ],
                    },
                    {
                      id: 'step-german-2',
                      order: 2,
                      prompt: 'Share where you are from.',
                      threadId: 'thread-cafe',
                      threadTitle: 'Cafe conversation',
                      segments: [
                        { type: SegmentType.TEXT, text: 'Ich komme aus ' },
                        { type: SegmentType.BLANK, blankId: 'blank-german-2' },
                        { type: SegmentType.TEXT, text: '.' },
                      ],
                      blanks: [
                        {
                          id: 'blank-german-2',
                          correct: 'Berlin',
                          variant: BlankVariant.TYPING,
                        },
                      ],
                    },
                    {
                      id: 'step-german-3',
                      order: 3,
                      prompt: 'Keep the conversation going.',
                      threadId: 'thread-cafe',
                      threadTitle: 'Cafe conversation',
                      segments: [
                        { type: SegmentType.TEXT, text: 'Und du? Ich bin ' },
                        { type: SegmentType.BLANK, blankId: 'blank-german-3' },
                        { type: SegmentType.TEXT, text: ' und lerne ' },
                        { type: SegmentType.BLANK, blankId: 'blank-german-4' },
                        { type: SegmentType.TEXT, text: '.' },
                      ],
                      blanks: [
                        {
                          id: 'blank-german-3',
                          correct: 'Tom',
                          variant: BlankVariant.OPTIONS,
                          options: ['Tom', 'Lena', 'Paul'],
                        },
                        {
                          id: 'blank-german-4',
                          correct: 'Deutsch',
                          variant: BlankVariant.OPTIONS,
                          options: ['Deutsch', 'Englisch', 'Französisch'],
                        },
                      ],
                    },
                    {
                      id: 'step-german-4',
                      order: 4,
                      prompt: 'A new phrase outside the conversation.',
                      threadId: 'thread-farewell',
                      threadTitle: 'Quick farewell',
                      segments: [
                        { type: SegmentType.TEXT, text: 'Gute Nacht, ' },
                        { type: SegmentType.BLANK, blankId: 'blank-german-5' },
                        { type: SegmentType.TEXT, text: '.' },
                      ],
                      blanks: [
                        {
                          id: 'blank-german-5',
                          correct: 'Freunde',
                          variant: BlankVariant.TYPING,
                        },
                      ],
                    },
                  ],
                },
              },
              {
                id: 'exercise-german-2',
                type: ExerciseType.MULTIPLE_CHOICE,
                title: 'Choose the correct greeting response',
                instructions: 'Select one correct option.',
                multipleChoice: {
                  question: 'How do you say "Good evening" in German?',
                  allowsMultiple: false,
                  choices: [
                    {
                      id: 'choice-german-1',
                      order: 1,
                      text: 'Guten Abend',
                      isCorrect: true,
                    },
                    {
                      id: 'choice-german-2',
                      order: 2,
                      text: 'Gute Nacht',
                      isCorrect: false,
                    },
                    {
                      id: 'choice-german-3',
                      order: 3,
                      text: 'Guten Morgen',
                      isCorrect: false,
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
    ],
  },
]

export const seedCourseContent = {
  modules: courses[0].modules,
}

export const seedCourseRow = {
  id: courses[0].id,
  ownerId: '__seed_owner__',
  title: courses[0].title,
  description: courses[0].description,
  content: seedCourseContent,
}
