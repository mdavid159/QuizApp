export interface Question {
  id: number;
  text: string;
  correctAnswer: string;
  answers: string[];
  quizId: number;
}
