import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetQuizDto } from '../dto/get-quiz.dto';

@Injectable()
export class QuizService {
  constructor(private prismaService: PrismaService) {}

  async getQuiz(getQuizDto: GetQuizDto, uuid: string) {
    const { password } = getQuizDto;
    console.log('Incoming UUID:', uuid);
    console.log('Incoming password from DTO:', getQuizDto.password);

    const quiz = await this.prismaService.quiz.findUnique({
      where: {
        uuid: uuid,
      },
      select: {
        questions: true,
        passcode: true,
      },
    });

    console.log('Passcode from DB:', quiz?.passcode);

    if (!quiz) {
      throw new BadRequestException('Quiz not found');
    }

    if (password.trim() !== quiz.passcode.trim()) {
      throw new BadRequestException('Incorrect password');
    }

    return { questions: quiz.questions };
  }
}
