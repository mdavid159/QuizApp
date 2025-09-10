import { Type } from 'class-transformer';
import { ValidateNested, IsArray } from 'class-validator';
import { QuizCreationDto } from './quiz-creation.dto';
import { QuestionDto } from './question.dto';

export class FullQuizDto {
  @ValidateNested()
  @Type(() => QuizCreationDto)
  quiz: QuizCreationDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions: QuestionDto[];
}
