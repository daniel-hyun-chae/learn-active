import { Query, registerEnumType, Resolver } from 'type-graphql'

export enum QuizFormat {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  IMAGE_HOTSPOT = 'IMAGE_HOTSPOT',
  ORDERING = 'ORDERING',
  MATCHING = 'MATCHING',
}

registerEnumType(QuizFormat, {
  name: 'QuizFormat',
})

@Resolver()
export class QuizResolver {
  @Query(() => [QuizFormat])
  quizFormats() {
    return [
      QuizFormat.MULTIPLE_CHOICE,
      QuizFormat.IMAGE_HOTSPOT,
      QuizFormat.ORDERING,
      QuizFormat.MATCHING,
    ]
  }
}
