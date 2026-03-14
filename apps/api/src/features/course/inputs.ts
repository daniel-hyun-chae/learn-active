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
export class ExerciseInput {
  @Field(() => ID, { nullable: true })
  id?: string

  @Field(() => ExerciseType)
  type!: ExerciseType

  @Field(() => String)
  title!: string

  @Field(() => String, { nullable: true })
  instructions?: string

  @Field(() => [ExerciseStepInput])
  steps!: ExerciseStepInput[]
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

  @Field(() => [ModuleInput])
  modules!: ModuleInput[]
}
