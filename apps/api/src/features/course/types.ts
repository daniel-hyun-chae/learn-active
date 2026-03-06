import { Field, ID, Int, ObjectType, registerEnumType } from 'type-graphql'

export enum ContentType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
}

export enum ExerciseType {
  FILL_IN_THE_BLANK = 'FILL_IN_THE_BLANK',
}

export enum SegmentType {
  TEXT = 'TEXT',
  BLANK = 'BLANK',
}

export enum BlankVariant {
  TYPING = 'TYPING',
  OPTIONS = 'OPTIONS',
}

registerEnumType(ContentType, { name: 'ContentType' })
registerEnumType(ExerciseType, { name: 'ExerciseType' })
registerEnumType(SegmentType, { name: 'SegmentType' })
registerEnumType(BlankVariant, { name: 'BlankVariant' })

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
export class Exercise {
  @Field(() => ID)
  id!: string

  @Field(() => ExerciseType)
  type!: ExerciseType

  @Field(() => String)
  title!: string

  @Field(() => String, { nullable: true })
  instructions?: string

  @Field(() => [ExerciseStep])
  steps!: ExerciseStep[]
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

  @Field(() => [Exercise])
  exercises!: Exercise[]
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

  @Field(() => String)
  title!: string

  @Field(() => String)
  description!: string

  @Field(() => String)
  language!: string

  @Field(() => [Module])
  modules!: Module[]
}
