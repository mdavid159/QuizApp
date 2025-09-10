import { IsArray, IsString } from 'class-validator';

export class QuestionDto {
  @IsString()
  question: string;

  @IsString()
  text: string;

  @IsArray()
  @IsString({ each: true })
  answers: string[];

  @IsString()
  correctAnswer: string;
}
