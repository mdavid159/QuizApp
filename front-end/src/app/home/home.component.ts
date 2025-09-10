import {Component} from '@angular/core';
import {Router} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {QuizService} from '../quiz.service';

@Component({
  selector: 'app-home',
  imports: [
    FormsModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent{
  constructor(public router: Router, public quizService: QuizService) {}
  uuid = '';
  password = '';

  joinQuiz() {
    if (this.uuid && this.password) {
      this.quizService.joinQuiz(this.password, this.uuid).subscribe({
        next: (data) => {
          console.log('Response', data);
          this.quizService.responseData = data;
          this.router.navigate([`/quiz/${this.uuid}/lobby`]);
        },
        error: (error) => {
          if (error.status === 400) {
            alert('Invalid password or quiz ID. Please try again.');
          }
          console.error('Error joining quiz:', error);
        }
      })
    }
  }

  createQuiz() {
    this.router.navigate(['create-quiz']);
  }
}
