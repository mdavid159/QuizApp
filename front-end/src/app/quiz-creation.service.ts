import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class QuizCreationService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  createQuiz(passcode: string, questions: any[]): Observable<any> {
    const url = `${this.apiUrl}/create-quiz`;
    const payload = {
      quiz: {
        passcode,
      },
      questions: questions.map((question) => ({
        text: question.question,
        answers: question.answers,
        correctAnswer: question.correctAnswer,
      })),
    };
    const httpOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    return this.http.post(url, payload, httpOptions);
  }
}
