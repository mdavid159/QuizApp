import { Module } from '@nestjs/common';
import { QuizCreationController } from './quiz-creation.controller';
import { QuizCreationService } from './quiz-creation.service';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClient } from '@prisma/client';

@Module({
  controllers: [QuizCreationController],
  providers: [QuizCreationService, PrismaService],
})
export class QuizCreationModule {}
