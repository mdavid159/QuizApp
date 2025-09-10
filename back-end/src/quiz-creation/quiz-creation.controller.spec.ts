import { Test, TestingModule } from '@nestjs/testing';
import { QuizCreationController } from './quiz-creation.controller';

describe('QuizCreationController', () => {
  let controller: QuizCreationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QuizCreationController],
    }).compile();

    controller = module.get<QuizCreationController>(QuizCreationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
