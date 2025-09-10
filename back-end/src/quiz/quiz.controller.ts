import { Body, Controller, Param, Post } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { GetQuizDto } from '../dto/get-quiz.dto';

@Controller('quiz')
export class QuizController {
  constructor(public quizService: QuizService) {}
  @Post('/:uuid/lobby')
  getQuiz(@Body() getQuizDto: GetQuizDto, @Param('uuid') uuid: string) {
    return this.quizService.getQuiz(getQuizDto, uuid);
  }
}
