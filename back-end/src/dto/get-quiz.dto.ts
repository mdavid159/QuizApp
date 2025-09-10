import { IsString } from 'class-validator';

export class GetQuizDto {
  @IsString()
  password: string;
}
