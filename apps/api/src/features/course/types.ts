import { Field, ID, Int, ObjectType, registerEnumType } from 'type-graphql'

export enum ContentType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
}

export enum ExerciseType {
  FILL_IN_THE_BLANK = 'FILL_IN_THE_BLANK',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  REORDERING = 'REORDERING',
}

export enum SegmentType {
  TEXT = 'TEXT',
  BLANK = 'BLANK',
}

export enum BlankVariant {
  TYPING = 'TYPING',
  OPTIONS = 'OPTIONS',
}

export enum CheckoutChannel {
  WEB = 'WEB',
  MOBILE = 'MOBILE',
}

registerEnumType(ContentType, { name: 'ContentType' })
registerEnumType(ExerciseType, { name: 'ExerciseType' })
registerEnumType(SegmentType, { name: 'SegmentType' })
registerEnumType(BlankVariant, { name: 'BlankVariant' })
registerEnumType(CheckoutChannel, { name: 'CheckoutChannel' })

@ObjectType()
export class ContentBlock {
  @Field(() => ID)
  id!: string

  @Field(() => ContentType)
  type!: ContentType

  @Field(() => String, { nullable: true })
  text?: string

  @Field(() => String, { nullable: true })
  imageUrl?: string

  @Field(() => String, { nullable: true })
  imageAlt?: string

  @Field(() => String, { nullable: true })
  lexicalJson?: string
}

@ObjectType()
export class SentenceSegment {
  @Field(() => SegmentType)
  type!: SegmentType

  @Field(() => String, { nullable: true })
  text?: string

  @Field(() => String, { nullable: true })
  blankId?: string
}

@ObjectType()
export class ExerciseBlank {
  @Field(() => ID)
  id!: string

  @Field(() => String)
  correct!: string

  @Field(() => BlankVariant)
  variant!: BlankVariant

  @Field(() => [String], { nullable: true })
  options?: string[]
}

@ObjectType()
export class ExerciseStep {
  @Field(() => ID)
  id!: string

  @Field(() => Int)
  order!: number

  @Field(() => String)
  prompt!: string

  @Field(() => String)
  threadId!: string

  @Field(() => String, { nullable: true })
  threadTitle?: string

  @Field(() => [SentenceSegment])
  segments!: SentenceSegment[]

  @Field(() => [ExerciseBlank])
  blanks!: ExerciseBlank[]
}

@ObjectType()
export class FillInBlankExerciseContent {
  @Field(() => [ExerciseStep])
  steps!: ExerciseStep[]
}

@ObjectType()
export class MultipleChoiceChoice {
  @Field(() => ID)
  id!: string

  @Field(() => Int)
  order!: number

  @Field(() => String)
  text!: string

  @Field(() => Boolean)
  isCorrect!: boolean
}

@ObjectType()
export class MultipleChoiceExerciseContent {
  @Field(() => String)
  question!: string

  @Field(() => Boolean)
  allowsMultiple!: boolean

  @Field(() => [MultipleChoiceChoice])
  choices!: MultipleChoiceChoice[]
}

@ObjectType()
export class ReorderingItem {
  @Field(() => ID)
  id!: string

  @Field(() => Int)
  order!: number

  @Field(() => String)
  text!: string

  @Field(() => Boolean)
  isDistractor!: boolean
}

@ObjectType()
export class ReorderingExerciseContent {
  @Field(() => String)
  prompt!: string

  @Field(() => [ReorderingItem])
  items!: ReorderingItem[]
}

@ObjectType()
export class Exercise {
  @Field(() => ID)
  id!: string

  @Field(() => ExerciseType)
  type!: ExerciseType

  @Field(() => String)
  title!: string

  @Field(() => String, { nullable: true })
  instructions?: string

  @Field(() => FillInBlankExerciseContent, { nullable: true })
  fillInBlank?: FillInBlankExerciseContent

  @Field(() => MultipleChoiceExerciseContent, { nullable: true })
  multipleChoice?: MultipleChoiceExerciseContent

  @Field(() => ReorderingExerciseContent, { nullable: true })
  reordering?: ReorderingExerciseContent
}

@ObjectType()
export class Lesson {
  @Field(() => ID)
  id!: string

  @Field(() => String)
  title!: string

  @Field(() => Int)
  order!: number

  @Field(() => [ExerciseStep], { nullable: true })
  exerciseDrafts?: ExerciseStep[]

  @Field(() => [ContentBlock])
  contents!: ContentBlock[]

  @Field(() => [LessonContentPage])
  contentPages!: LessonContentPage[]

  @Field(() => [Exercise])
  exercises!: Exercise[]
}

@ObjectType()
export class LessonContentPage {
  @Field(() => ID)
  id!: string

  @Field(() => String)
  title!: string

  @Field(() => Int)
  order!: number

  @Field(() => [ContentBlock])
  contents!: ContentBlock[]
}

@ObjectType()
export class Module {
  @Field(() => ID)
  id!: string

  @Field(() => String)
  title!: string

  @Field(() => Int)
  order!: number

  @Field(() => [Lesson])
  lessons!: Lesson[]
}

@ObjectType()
export class Course {
  @Field(() => ID)
  id!: string

  @Field(() => ID)
  versionId!: string

  @Field(() => Int)
  version!: number

  @Field(() => String)
  status!: string

  @Field(() => String)
  title!: string

  @Field(() => String)
  description!: string

  @Field(() => Int, { nullable: true })
  priceCents?: number | null

  @Field(() => String)
  currency!: string

  @Field(() => String, { nullable: true })
  stripePriceId?: string | null

  @Field(() => Boolean)
  isPaid!: boolean

  @Field(() => [String])
  categoryIds!: string[]

  @Field(() => [String])
  tags!: string[]

  @Field(() => String)
  languageCode!: string

  @Field(() => String, { nullable: true })
  previewLessonId?: string | null

  @Field(() => String, { nullable: true })
  changeNote?: string | null

  @Field(() => String)
  createdAt!: string

  @Field(() => String)
  createdBy!: string

  @Field(() => String, { nullable: true })
  publishedAt?: string | null

  @Field(() => String, { nullable: true })
  archivedAt?: string | null

  @Field(() => LearnerResumePosition, { nullable: true })
  resumePosition?: LearnerResumePosition | null

  @Field(() => [Module])
  modules!: Module[]
}

@ObjectType()
export class CourseVersionHistory {
  @Field(() => ID)
  versionId!: string

  @Field(() => Int)
  version!: number

  @Field(() => String)
  status!: string

  @Field(() => String)
  title!: string

  @Field(() => String, { nullable: true })
  changeNote?: string | null

  @Field(() => String)
  createdAt!: string

  @Field(() => String)
  createdBy!: string

  @Field(() => String, { nullable: true })
  publishedAt?: string | null

  @Field(() => String, { nullable: true })
  archivedAt?: string | null
}

@ObjectType()
export class CourseVersionDiff {
  @Field(() => ID)
  courseId!: string

  @Field(() => ID)
  fromVersionId!: string

  @Field(() => ID)
  toVersionId!: string

  @Field(() => Int)
  fromVersion!: number

  @Field(() => Int)
  toVersion!: number

  @Field(() => Boolean)
  titleChanged!: boolean

  @Field(() => Boolean)
  descriptionChanged!: boolean

  @Field(() => [String])
  addedFields!: string[]

  @Field(() => [String])
  removedFields!: string[]

  @Field(() => [String])
  changedFields!: string[]
}

@ObjectType()
export class AttemptAnswer {
  @Field(() => String)
  key!: string

  @Field(() => String)
  value!: string
}

@ObjectType()
export class LearnerExerciseAttempt {
  @Field(() => ID)
  id!: string

  @Field(() => ID)
  userId!: string

  @Field(() => ID)
  courseId!: string

  @Field(() => ID)
  courseVersionId!: string

  @Field(() => String)
  lessonId!: string

  @Field(() => String)
  exerciseId!: string

  @Field(() => [AttemptAnswer])
  answers!: AttemptAnswer[]

  @Field(() => Boolean)
  isCorrect!: boolean

  @Field(() => String)
  attemptedAt!: string
}

@ObjectType()
export class LearnerExerciseAttemptHistoryEntry {
  @Field(() => ID)
  id!: string

  @Field(() => ID)
  userId!: string

  @Field(() => ID)
  courseId!: string

  @Field(() => ID)
  courseVersionId!: string

  @Field(() => String)
  lessonId!: string

  @Field(() => String)
  exerciseId!: string

  @Field(() => [AttemptAnswer])
  answers!: AttemptAnswer[]

  @Field(() => Boolean)
  isCorrect!: boolean

  @Field(() => String)
  attemptedAt!: string
}

@ObjectType()
export class ExerciseAttemptStatus {
  @Field(() => String)
  exerciseId!: string

  @Field(() => Boolean)
  attempted!: boolean

  @Field(() => Boolean, { nullable: true })
  isCorrect!: boolean | null

  @Field(() => String, { nullable: true })
  attemptedAt!: string | null
}

@ObjectType()
export class LessonProgress {
  @Field(() => String)
  lessonId!: string

  @Field(() => Int)
  completedExercises!: number

  @Field(() => Int)
  totalExercises!: number

  @Field(() => Int)
  percentComplete!: number

  @Field(() => [ExerciseAttemptStatus])
  exerciseAttempts!: ExerciseAttemptStatus[]
}

@ObjectType()
export class ModuleProgress {
  @Field(() => String)
  moduleId!: string

  @Field(() => Int)
  completedExercises!: number

  @Field(() => Int)
  totalExercises!: number

  @Field(() => Int)
  percentComplete!: number

  @Field(() => [LessonProgress])
  lessons!: LessonProgress[]
}

@ObjectType()
export class CourseProgress {
  @Field(() => ID)
  courseId!: string

  @Field(() => ID)
  courseVersionId!: string

  @Field(() => Int)
  completedExercises!: number

  @Field(() => Int)
  totalExercises!: number

  @Field(() => Int)
  percentComplete!: number

  @Field(() => [ModuleProgress])
  modules!: ModuleProgress[]
}

@ObjectType()
export class LearnerResumePosition {
  @Field(() => ID)
  courseId!: string

  @Field(() => String)
  lessonId!: string

  @Field(() => String)
  block!: 'summary' | 'contentPage' | 'exercise'

  @Field(() => String, { nullable: true })
  contentPageId!: string | null

  @Field(() => String, { nullable: true })
  exerciseId!: string | null

  @Field(() => String)
  visitedAt!: string
}

@ObjectType()
export class PublicCourse {
  @Field(() => ID)
  id!: string

  @Field(() => String)
  slug!: string

  @Field(() => String)
  title!: string

  @Field(() => String)
  description!: string

  @Field(() => Int, { nullable: true })
  priceCents?: number | null

  @Field(() => String)
  currency!: string

  @Field(() => Boolean)
  isPaid!: boolean

  @Field(() => [String])
  categoryIds!: string[]

  @Field(() => [String])
  tags!: string[]

  @Field(() => String)
  languageCode!: string

  @Field(() => String, { nullable: true })
  previewLessonId?: string | null

  @Field(() => Int)
  enrollmentCount!: number

  @Field(() => Int)
  popularityScore!: number

  @Field(() => [Module], { nullable: true })
  modules?: Module[]

  @Field(() => String, { nullable: true })
  ownerDisplayName?: string
}

@ObjectType()
export class PublicPreviewLesson {
  @Field(() => PublicCourse)
  course!: PublicCourse

  @Field(() => Lesson)
  lesson!: Lesson
}

@ObjectType()
export class MyCourse {
  @Field(() => ID)
  id!: string

  @Field(() => String)
  slug!: string

  @Field(() => String)
  title!: string

  @Field(() => String)
  description!: string

  @Field(() => Int)
  version!: number

  @Field(() => String)
  status!: string

  @Field(() => String)
  enrolledAt!: string
}

@ObjectType()
export class Enrollment {
  @Field(() => ID)
  id!: string

  @Field(() => ID)
  courseId!: string

  @Field(() => String)
  status!: string

  @Field(() => String)
  enrolledAt!: string
}

@ObjectType()
export class CheckoutSession {
  @Field(() => String)
  url!: string

  @Field(() => String)
  sessionId!: string
}

@ObjectType()
export class Payment {
  @Field(() => ID)
  id!: string

  @Field(() => ID)
  userId!: string

  @Field(() => ID)
  courseId!: string

  @Field(() => String)
  stripeSessionId!: string

  @Field(() => String, { nullable: true })
  stripePaymentIntentId?: string | null

  @Field(() => Int)
  amountCents!: number

  @Field(() => String)
  currency!: string

  @Field(() => String)
  status!: string

  @Field(() => String)
  createdAt!: string
}

@ObjectType()
export class EnrollmentStatus {
  @Field(() => Boolean)
  enrolled!: boolean

  @Field(() => String, { nullable: true })
  status?: string | null
}
