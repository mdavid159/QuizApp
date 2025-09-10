import {RouterModule, Routes} from '@angular/router';
import {CreateQuizComponent} from './create-quiz/create-quiz.component';
import {HomeComponent} from './home/home.component';
import {NgModule} from '@angular/core';
import {QuizComponent} from './quiz/quiz.component';
import {QuizLobbyComponent} from './quiz-lobby/quiz-lobby.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'create-quiz', component: CreateQuizComponent },
  { path: 'quiz/:uuid/lobby', component: QuizLobbyComponent },
  { path: 'quiz/:uuid', component: QuizComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})

export class AppRoutingModule {}
