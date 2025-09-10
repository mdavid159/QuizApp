import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { QuizCreationModule } from './quiz-creation/quiz-creation.module';
import { QuizModule } from './quiz/quiz.module';
import { QuizGateway } from './gateways/quiz.gateway';

@Module({
  imports: [PrismaModule, QuizCreationModule, QuizModule],
  controllers: [AppController],
  providers: [
    AppService,
    PrismaModule,
    QuizCreationModule,
    QuizModule,
  ],
})
export class AppModule {}
