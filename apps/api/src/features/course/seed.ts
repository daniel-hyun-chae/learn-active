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
    id: 'course-german-b1-alltagskommunikation',
    title: 'Deutsch B1: Alltag und Beruf im Gesprach',
    description:
      'Ein realistischer B1-Kurs mit Dialogen aus Alltag und Beruf: Termine, Problemlosung, Meinungen und formelle Kommunikation.',
    modules: [
      {
        id: 'module-b1-kommunikation',
        title: 'Modul 1: Alltagliche Kommunikation',
        order: 1,
        lessons: [
          {
            id: 'lesson-b1-terminplanung',
            title: 'Terminplanung und Absprachen',
            order: 1,
            contents: [
              {
                id: 'content-b1-termin-1',
                type: ContentType.TEXT,
                text: 'In dieser Lektion uben Sie B1-Formulierungen fur Terminabsprachen: verschieben, bestatigen und begrunden.',
              },
              {
                id: 'content-b1-termin-2',
                type: ContentType.IMAGE,
                imageUrl: 'https://placehold.co/960x540/png',
                imageAlt:
                  'Kalenderansicht mit markierten Besprechungen fur eine Terminplanungslektion.',
              },
              {
                id: 'content-b1-termin-3',
                type: ContentType.TEXT,
                text: 'Achten Sie auf typische Konnektoren wie weil, obwohl und deshalb.',
              },
            ],
            contentPages: [
              {
                id: 'content-page-b1-termin-1',
                title: 'Redemittel fur Terminabsprachen',
                order: 1,
                contents: [
                  {
                    id: 'content-page-block-b1-termin-1',
                    type: ContentType.TEXT,
                    text: 'Nutzliche Redemittel: Konnten wir den Termin auf Mittwoch verschieben? Passt Ihnen 14 Uhr?',
                  },
                  {
                    id: 'content-page-block-b1-termin-2',
                    type: ContentType.IMAGE,
                    imageUrl: 'https://placehold.co/800x400/png',
                    imageAlt:
                      'Zwei Kolleginnen sprechen uber einen Kalender in einem Buro.',
                  },
                ],
              },
              {
                id: 'content-page-b1-termin-2',
                title: 'Formelle Bestatigung per E-Mail',
                order: 2,
                contents: [
                  {
                    id: 'content-page-block-b1-termin-3',
                    type: ContentType.TEXT,
                    text: 'Beispiel: Hiermit bestatige ich unseren Termin am Donnerstag um 10:30 Uhr.',
                  },
                ],
              },
            ],
            exercises: [
              {
                id: 'exercise-b1-termin-fib-1',
                type: ExerciseType.FILL_IN_THE_BLANK,
                title: 'Dialog: Termin verschieben',
                instructions:
                  'Vervollstandigen Sie den Dialog mit passenden B1-Formulierungen.',
                fillInBlank: {
                  steps: [
                    {
                      id: 'step-b1-termin-fib-1',
                      order: 1,
                      prompt: 'Formulieren Sie eine hofliche Anfrage.',
                      threadId: 'thread-termin-buro',
                      threadTitle: 'Buroabstimmung',
                      segments: [
                        {
                          type: SegmentType.TEXT,
                          text: 'Guten Tag, konnten wir den Termin auf ',
                        },
                        {
                          type: SegmentType.BLANK,
                          blankId: 'blank-b1-termin-fib-1',
                        },
                        { type: SegmentType.TEXT, text: ' verschieben?' },
                      ],
                      blanks: [
                        {
                          id: 'blank-b1-termin-fib-1',
                          correct: 'Mittwoch',
                          variant: BlankVariant.OPTIONS,
                          options: ['Mittwoch', 'gestern', 'Buch'],
                        },
                      ],
                    },
                    {
                      id: 'step-b1-termin-fib-2',
                      order: 2,
                      prompt: 'Erklaren Sie den Grund.',
                      threadId: 'thread-termin-buro',
                      threadTitle: 'Buroabstimmung',
                      segments: [
                        {
                          type: SegmentType.TEXT,
                          text: 'Ich kann am Dienstag nicht, ',
                        },
                        {
                          type: SegmentType.BLANK,
                          blankId: 'blank-b1-termin-fib-2',
                        },
                        {
                          type: SegmentType.TEXT,
                          text: ' ich einen Arzttermin habe.',
                        },
                      ],
                      blanks: [
                        {
                          id: 'blank-b1-termin-fib-2',
                          correct: 'weil',
                          variant: BlankVariant.TYPING,
                        },
                      ],
                    },
                    {
                      id: 'step-b1-termin-fib-3',
                      order: 3,
                      prompt: 'Bestatigen Sie die neue Uhrzeit.',
                      threadId: 'thread-termin-buro',
                      threadTitle: 'Buroabstimmung',
                      segments: [
                        {
                          type: SegmentType.TEXT,
                          text: 'Perfekt, dann sehen wir uns um ',
                        },
                        {
                          type: SegmentType.BLANK,
                          blankId: 'blank-b1-termin-fib-3',
                        },
                        { type: SegmentType.TEXT, text: ' Uhr.' },
                      ],
                      blanks: [
                        {
                          id: 'blank-b1-termin-fib-3',
                          correct: '14',
                          variant: BlankVariant.OPTIONS,
                          options: ['14', 'nachts', 'Morgenrot'],
                        },
                      ],
                    },
                  ],
                },
              },
              {
                id: 'exercise-b1-termin-mc-1',
                type: ExerciseType.MULTIPLE_CHOICE,
                title: 'Formelle E-Mail: beste Option',
                instructions: 'Wahlen Sie die formal passende Antwort.',
                multipleChoice: {
                  question:
                    'Welche Formulierung ist fur eine formelle Terminbestatigung am geeignetsten?',
                  allowsMultiple: false,
                  choices: [
                    {
                      id: 'choice-b1-termin-mc-1',
                      order: 1,
                      text: 'Hiermit bestatige ich unseren Termin am Freitag um 9 Uhr.',
                      isCorrect: true,
                    },
                    {
                      id: 'choice-b1-termin-mc-2',
                      order: 2,
                      text: 'Cool, Freitag passt irgendwie, glaube ich.',
                      isCorrect: false,
                    },
                    {
                      id: 'choice-b1-termin-mc-3',
                      order: 3,
                      text: 'Dann halt irgendwann am Freitag.',
                      isCorrect: false,
                    },
                  ],
                },
              },
              {
                id: 'exercise-b1-termin-mc-2',
                type: ExerciseType.MULTIPLE_CHOICE,
                title: 'Mehrfachauswahl: passende Reaktionen',
                instructions:
                  'Wahlen Sie alle Antworten, die in einer beruflichen Terminabsage angemessen sind.',
                multipleChoice: {
                  question:
                    'Welche Aussagen passen zu einer professionellen Terminabsage?',
                  allowsMultiple: true,
                  choices: [
                    {
                      id: 'choice-b1-termin-mc-4',
                      order: 1,
                      text: 'Es tut mir leid, ich muss den Termin verschieben.',
                      isCorrect: true,
                    },
                    {
                      id: 'choice-b1-termin-mc-5',
                      order: 2,
                      text: 'Konnten wir einen neuen Termin fur nachste Woche finden?',
                      isCorrect: true,
                    },
                    {
                      id: 'choice-b1-termin-mc-6',
                      order: 3,
                      text: 'Ich komme vielleicht, vielleicht auch nicht.',
                      isCorrect: false,
                    },
                    {
                      id: 'choice-b1-termin-mc-7',
                      order: 4,
                      text: 'Passt schon, ich melde mich irgendwann.',
                      isCorrect: false,
                    },
                  ],
                },
              },
            ],
          },
          {
            id: 'lesson-b1-probleme-loesen',
            title: 'Probleme erklaren und losen',
            order: 2,
            contents: [
              {
                id: 'content-b1-problem-1',
                type: ContentType.TEXT,
                text: 'Sie lernen, Probleme klar zu beschreiben und Losungsvorschlage zu machen.',
              },
              {
                id: 'content-b1-problem-2',
                type: ContentType.IMAGE,
                imageUrl: 'https://placehold.co/960x540/png',
                imageAlt:
                  'Team bespricht eine technische Storung im Konferenzraum.',
              },
            ],
            contentPages: [
              {
                id: 'content-page-b1-problem-1',
                title: 'Struktur einer Problembeschreibung',
                order: 1,
                contents: [
                  {
                    id: 'content-page-block-b1-problem-1',
                    type: ContentType.TEXT,
                    text: '1) Situation, 2) Auswirkung, 3) Vorschlag: Seit gestern funktioniert..., deshalb...',
                  },
                ],
              },
            ],
            exercises: [
              {
                id: 'exercise-b1-problem-fib-1',
                type: ExerciseType.FILL_IN_THE_BLANK,
                title: 'Support-Dialog vervollstandigen',
                fillInBlank: {
                  steps: [
                    {
                      id: 'step-b1-problem-fib-1',
                      order: 1,
                      prompt: 'Beschreiben Sie das Problem prazise.',
                      threadId: 'thread-support',
                      threadTitle: 'IT-Support',
                      segments: [
                        {
                          type: SegmentType.TEXT,
                          text: 'Seit gestern funktioniert mein ',
                        },
                        {
                          type: SegmentType.BLANK,
                          blankId: 'blank-b1-problem-fib-1',
                        },
                        { type: SegmentType.TEXT, text: ' nicht mehr.' },
                      ],
                      blanks: [
                        {
                          id: 'blank-b1-problem-fib-1',
                          correct: 'Laptop',
                          variant: BlankVariant.OPTIONS,
                          options: ['Laptop', 'Garten', 'Schokolade'],
                        },
                      ],
                    },
                    {
                      id: 'step-b1-problem-fib-2',
                      order: 2,
                      prompt: 'Nennen Sie die Konsequenz.',
                      threadId: 'thread-support',
                      threadTitle: 'IT-Support',
                      segments: [
                        {
                          type: SegmentType.TEXT,
                          text: 'Deshalb kann ich die Prasentation nicht ',
                        },
                        {
                          type: SegmentType.BLANK,
                          blankId: 'blank-b1-problem-fib-2',
                        },
                        { type: SegmentType.TEXT, text: '.' },
                      ],
                      blanks: [
                        {
                          id: 'blank-b1-problem-fib-2',
                          correct: 'offnen',
                          variant: BlankVariant.TYPING,
                        },
                      ],
                    },
                  ],
                },
              },
              {
                id: 'exercise-b1-problem-mc-1',
                type: ExerciseType.MULTIPLE_CHOICE,
                title: 'Angemessene Losung vorschlagen',
                instructions: 'Wahlen Sie die beste Losung im Arbeitskontext.',
                multipleChoice: {
                  question:
                    'Welche Antwort ist fur eine professionelle Problemlosung am passendsten?',
                  allowsMultiple: false,
                  choices: [
                    {
                      id: 'choice-b1-problem-mc-1',
                      order: 1,
                      text: 'Konnten wir das Meeting auf 15 Uhr verschieben, damit ich das Problem zuerst lose?',
                      isCorrect: true,
                    },
                    {
                      id: 'choice-b1-problem-mc-2',
                      order: 2,
                      text: 'Keine Ahnung, dann machen wir halt nichts.',
                      isCorrect: false,
                    },
                    {
                      id: 'choice-b1-problem-mc-3',
                      order: 3,
                      text: 'Das ist nicht mein Problem.',
                      isCorrect: false,
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
      {
        id: 'module-b1-argumentation',
        title: 'Modul 2: Meinungen und Argumentation',
        order: 2,
        lessons: [
          {
            id: 'lesson-b1-meinung',
            title: 'Standpunkte begrunden',
            order: 1,
            contents: [
              {
                id: 'content-b1-meinung-1',
                type: ContentType.TEXT,
                text: 'Auf B1-Niveau sollen Sie Ihre Meinung klar auBern und mit Beispielen begrunden.',
              },
              {
                id: 'content-b1-meinung-2',
                type: ContentType.IMAGE,
                imageUrl: 'https://placehold.co/960x540/png',
                imageAlt:
                  'Lerngruppe diskutiert Vor- und Nachteile von Homeoffice.',
              },
            ],
            contentPages: [
              {
                id: 'content-page-b1-meinung-1',
                title: 'Konnektoren fur Argumente',
                order: 1,
                contents: [
                  {
                    id: 'content-page-block-b1-meinung-1',
                    type: ContentType.TEXT,
                    text: 'Nutzliche Konnektoren: einerseits, andererseits, auBerdem, dennoch.',
                  },
                ],
              },
            ],
            exercises: [
              {
                id: 'exercise-b1-meinung-fib-1',
                type: ExerciseType.FILL_IN_THE_BLANK,
                title: 'Argumentation im Teammeeting',
                fillInBlank: {
                  steps: [
                    {
                      id: 'step-b1-meinung-fib-1',
                      order: 1,
                      prompt: 'Verbinden Sie zwei Argumente.',
                      threadId: 'thread-meeting',
                      threadTitle: 'Teammeeting',
                      segments: [
                        {
                          type: SegmentType.TEXT,
                          text: 'Einerseits sparen wir Zeit, ',
                        },
                        {
                          type: SegmentType.BLANK,
                          blankId: 'blank-b1-meinung-fib-1',
                        },
                        {
                          type: SegmentType.TEXT,
                          text: ' andererseits fehlen spontane Gesprache.',
                        },
                      ],
                      blanks: [
                        {
                          id: 'blank-b1-meinung-fib-1',
                          correct: 'aber',
                          variant: BlankVariant.OPTIONS,
                          options: ['aber', 'morgen', 'Fahrrad'],
                        },
                      ],
                    },
                    {
                      id: 'step-b1-meinung-fib-2',
                      order: 2,
                      prompt: 'Erganzen Sie eine Begrundung.',
                      threadId: 'thread-meeting',
                      threadTitle: 'Teammeeting',
                      segments: [
                        {
                          type: SegmentType.TEXT,
                          text: 'Ich finde Homeoffice sinnvoll, ',
                        },
                        {
                          type: SegmentType.BLANK,
                          blankId: 'blank-b1-meinung-fib-2',
                        },
                        {
                          type: SegmentType.TEXT,
                          text: ' ich mich besser konzentrieren kann.',
                        },
                      ],
                      blanks: [
                        {
                          id: 'blank-b1-meinung-fib-2',
                          correct: 'weil',
                          variant: BlankVariant.TYPING,
                        },
                      ],
                    },
                  ],
                },
              },
              {
                id: 'exercise-b1-meinung-mc-1',
                type: ExerciseType.MULTIPLE_CHOICE,
                title: 'Mehrfachauswahl: starke Argumente erkennen',
                instructions:
                  'Wahlen Sie alle Aussagen, die eine gut begrundete Meinung zeigen.',
                multipleChoice: {
                  question:
                    'Welche Aussagen enthalten eine nachvollziehbare B1-Argumentation?',
                  allowsMultiple: true,
                  choices: [
                    {
                      id: 'choice-b1-meinung-mc-1',
                      order: 1,
                      text: 'Ich bevorzuge den Zug, weil ich wahrend der Fahrt arbeiten kann.',
                      isCorrect: true,
                    },
                    {
                      id: 'choice-b1-meinung-mc-2',
                      order: 2,
                      text: 'Das ist halt so.',
                      isCorrect: false,
                    },
                    {
                      id: 'choice-b1-meinung-mc-3',
                      order: 3,
                      text: 'Meiner Meinung nach sind feste Absprachen wichtig, damit alle planen konnen.',
                      isCorrect: true,
                    },
                    {
                      id: 'choice-b1-meinung-mc-4',
                      order: 4,
                      text: 'Daruber will ich nicht nachdenken.',
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
