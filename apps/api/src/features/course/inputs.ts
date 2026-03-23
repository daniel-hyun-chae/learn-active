import { Field, ID, InputType, Int } from 'type-graphql'
import {
  BlankVariant,
  ContentType,
  ExerciseType,
  SegmentType,
} from './types.js'

@InputType()
export class ContentBlockInput {
  @Field(() => ID, { nullable: true })
  id?: string

  @Field(() => ContentType)
  type!: ContentType

  @Field(() => String, { nullable: true })
  text?: string

  @Field(() => String, { nullable: true })
  html?: string

  @Field(() => String, { nullable: true })
  imageUrl?: string

  @Field(() => String, { nullable: true })
  imageAlt?: string

  @Field(() => String, { nullable: true })
  lexicalJson?: string
}

@InputType()
export class SentenceSegmentInput {
  @Field(() => SegmentType)
  type!: SegmentType

  @Field(() => String, { nullable: true })
  text?: string

  @Field(() => String, { nullable: true })
  blankId?: string
}

@InputType()
export class ExerciseBlankInput {
  @Field(() => ID, { nullable: true })
  id?: string

  @Field(() => String)
  correct!: string

  @Field(() => BlankVariant)
  variant!: BlankVariant

  @Field(() => [String], { nullable: true })
  options?: string[]
}

@InputType()
export class ExerciseStepInput {
  @Field(() => ID, { nullable: true })
  id?: string

  @Field(() => Int)
  order!: number

  @Field(() => String)
  prompt!: string

  @Field(() => String)
  threadId!: string

  @Field(() => String, { nullable: true })
  threadTitle?: string

  @Field(() => [SentenceSegmentInput])
  segments!: SentenceSegmentInput[]

  @Field(() => [ExerciseBlankInput])
  blanks!: ExerciseBlankInput[]
}

@InputType()
export class FillInBlankExerciseContentInput {
  @Field(() => [ExerciseStepInput])
  steps!: ExerciseStepInput[]
}

@InputType()
export class MultipleChoiceChoiceInput {
  @Field(() => ID, { nullable: true })
  id?: string

  @Field(() => Int, { nullable: true })
  order?: number

  @Field(() => String)
  text!: string

  @Field(() => Boolean)
  isCorrect!: boolean
}

@InputType()
export class MultipleChoiceExerciseContentInput {
  @Field(() => String)
  question!: string

  @Field(() => Boolean)
  allowsMultiple!: boolean

  @Field(() => [MultipleChoiceChoiceInput])
  choices!: MultipleChoiceChoiceInput[]
}

@InputType()
export class ReorderingItemInput {
  @Field(() => ID, { nullable: true })
  id?: string

  @Field(() => Int, { nullable: true })
  order?: number

  @Field(() => String)
  text!: string

  @Field(() => Boolean, { nullable: true })
  isDistractor?: boolean
}

@InputType()
export class ReorderingExerciseContentInput {
  @Field(() => String)
  prompt!: string

  @Field(() => [ReorderingItemInput])
  items!: ReorderingItemInput[]
}

@InputType()
export class ExerciseInput {
  @Field(() => ID, { nullable: true })
  id?: string

  @Field(() => ExerciseType)
  type!: ExerciseType

  @Field(() => String)
  title!: string

  @Field(() => String, { nullable: true })
  instructions?: string

  @Field(() => FillInBlankExerciseContentInput, { nullable: true })
  fillInBlank?: FillInBlankExerciseContentInput

  @Field(() => MultipleChoiceExerciseContentInput, { nullable: true })
  multipleChoice?: MultipleChoiceExerciseContentInput

  @Field(() => ReorderingExerciseContentInput, { nullable: true })
  reordering?: ReorderingExerciseContentInput
}

@InputType()
export class LessonInput {
  @Field(() => ID, { nullable: true })
  id?: string

  @Field(() => String)
  title!: string

  @Field(() => Int)
  order!: number

  @Field(() => [ContentBlockInput])
  contents!: ContentBlockInput[]

  @Field(() => [LessonContentPageInput])
  contentPages!: LessonContentPageInput[]

  @Field(() => [ExerciseInput])
  exercises!: ExerciseInput[]
}

@InputType()
export class LessonContentPageInput {
  @Field(() => ID, { nullable: true })
  id?: string

  @Field(() => String)
  title!: string

  @Field(() => Int)
  order!: number

  @Field(() => [ContentBlockInput])
  contents!: ContentBlockInput[]
}

@InputType()
export class ModuleInput {
  @Field(() => ID, { nullable: true })
  id?: string

  @Field(() => String)
  title!: string

  @Field(() => Int)
  order!: number

  @Field(() => [LessonInput])
  lessons!: LessonInput[]
}

@InputType()
export class CourseInput {
  @Field(() => ID, { nullable: true })
  id?: string

  @Field(() => String)
  title!: string

  @Field(() => String)
  description!: string

  @Field(() => Int, { nullable: true })
  priceCents?: number

  @Field(() => String, { nullable: true })
  currency?: string

  @Field(() => [String], { nullable: true })
  categoryIds?: string[]

  @Field(() => [String], { nullable: true })
  tags?: string[]

  @Field(() => String, { nullable: true })
  languageCode?: string

  @Field(() => String, { nullable: true })
  previewLessonId?: string

  @Field(() => [ModuleInput])
  modules!: ModuleInput[]
}

@InputType()
export class PublicCatalogQueryInput {
  @Field(() => String, { nullable: true })
  search?: string

  @Field(() => [String], { nullable: true })
  categoryIds?: string[]

  @Field(() => String, { nullable: true })
  priceFilter?: 'all' | 'free' | 'paid'

  @Field(() => [String], { nullable: true })
  languageCodes?: string[]

  @Field(() => String, { nullable: true })
  sort?: 'popular' | 'title'

  @Field(() => Int, { nullable: true })
  limit?: number
}

@InputType()
export class AttemptAnswerInput {
  @Field(() => String)
  key!: string

  @Field(() => String)
  value!: string
}

@InputType()
export class LearnerExerciseAttemptInput {
  @Field(() => String)
  courseId!: string

  @Field(() => String)
  courseVersionId!: string

  @Field(() => String)
  lessonId!: string

  @Field(() => String)
  exerciseId!: string

  @Field(() => [AttemptAnswerInput])
  answers!: AttemptAnswerInput[]
}

@InputType()
export class LearnerResumePositionInput {
  @Field(() => String)
  courseId!: string

  @Field(() => String)
  lessonId!: string

  @Field(() => String)
  block!: string

  @Field(() => String, { nullable: true })
  contentPageId?: string

  @Field(() => String, { nullable: true })
  exerciseId?: string
}
