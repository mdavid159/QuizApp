import { IsString } from 'class-validator';

export class QuizCreationDto {
  @IsString()
  name: string;

  @IsString()
  passcode: string;
}
