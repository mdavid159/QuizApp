import { Test, TestingModule } from '@nestjs/testing';
import { QuizCreationService } from './quiz-creation.service';

describe('QuizCreationService', () => {
  let service: QuizCreationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QuizCreationService],
    }).compile();

    service = module.get<QuizCreationService>(QuizCreationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
