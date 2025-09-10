import { Module } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { PrismaService } from '../prisma/prisma.service';
import { QuizGateway } from '../gateways/quiz.gateway';

@Module({
  providers: [QuizService, PrismaService, QuizGateway],
  controllers: [QuizController],
})
export class QuizModule {}
