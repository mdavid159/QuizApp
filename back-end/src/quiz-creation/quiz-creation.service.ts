import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FullQuizDto } from '../dto/full-quiz.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class QuizCreationService {
  constructor(private readonly prismaService: PrismaService) {}

  async createQuiz(fullQuizDto: FullQuizDto) {
    const { quiz, questions } = fullQuizDto;
    const uuid = uuidv4();
    console.log('Uuid:', uuid);

    // Create the quiz
    const createdQuiz = await this.prismaService.quiz.create({
      data: {
        passcode: quiz.passcode,
        uuid: uuid,
      },
    });

    // Create questions linked to the quiz
    for (const question of questions) {
      await this.prismaService.question.create({
        data: {
          text: question.text,
          answers: question.answers,
          correctAnswer: question.correctAnswer,
          quizId: createdQuiz.id,
        },
      });
    }

    return { success: true, quizId: createdQuiz.id, uuid: uuid };
  }
}
