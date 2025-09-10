import { Component } from '@angular/core';
import {FormsModule} from '@angular/forms';
import {NgStyle} from '@angular/common';
import {QuizCreationService} from '../quiz-creation.service';
import {Router} from '@angular/router';

interface QuizQuestion {
  id: number;
  question: string;
  answers: string[];
  correctAnswer: string;
}

@Component({
  selector: 'app-create-quiz',
  imports: [
    FormsModule,
    NgStyle
  ],
  templateUrl: './create-quiz.component.html',
  styleUrl: './create-quiz.component.scss'
})
export class CreateQuizComponent {
  constructor(public QuizCreation: QuizCreationService, public router: Router) {}

  questions: QuizQuestion[] = [];
  currentQuestion: string = '';
  currentAnswers: string[] = ['', '', '', ''];
  correctAnswer: string = '';
  quizPasscode: string = '';
  successShowModal = false;
  createdQuizUuid: string = '';

  addQuestion() {
    const newQuestion: QuizQuestion = {
      id: this.questions.length + 1,
      question: this.currentQuestion,
      answers: [...this.currentAnswers],
      correctAnswer: this.correctAnswer,
    };

    this.questions.push(newQuestion);

    this.currentQuestion = '';
    this.currentAnswers = ['', '', '', ''];
    this.correctAnswer = '';

  }

  createQuiz(): void {
    if (this.questions.length === 0) {
      alert('Please add at least one question first');
    } else {
      this.QuizCreation.createQuiz(this.quizPasscode, this.questions).subscribe({
        next: (data) => {
          console.log('Response', data);
          this.createdQuizUuid = data.uuid;
          this.successShowModal = true;
        },
        error: (error) => {
          console.error('Error creating quiz:', error);
        }
      });
    }
  }

  copyQuizId(): void {
    navigator.clipboard.writeText(this.createdQuizUuid).then(() => {
      alert('Quiz ID copied to clipboard!');
    });
  }

  closeModal(): void {
    this.successShowModal = false;
  }

  copyQuizUrl(): void {
    navigator.clipboard.writeText(`http://localhost:4200/quiz/${this.createdQuizUuid}`).then(() => {
      alert('Quiz URL copied to clipboard!');
    });
  }

  startQuiz(quizUuid: string): void {
    this.router.navigate([`/quiz/${quizUuid}`]);
  }
}
