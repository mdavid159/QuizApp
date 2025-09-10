import { Body, Controller, Post } from '@nestjs/common';
import { QuizCreationService } from './quiz-creation.service';
import { FullQuizDto } from '../dto/full-quiz.dto';

@Controller('create-quiz')
export class QuizCreationController {
  constructor(public quizCreationService: QuizCreationService) {}

  @Post()
  createQuiz(@Body() fullQuizDto: FullQuizDto) {
    return this.quizCreationService.createQuiz(fullQuizDto);
  }
}
