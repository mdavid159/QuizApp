import {Component, OnDestroy, OnInit} from '@angular/core';
import {QuizService} from '../quiz.service';
import {Player} from '../models/player.model';
import {Question} from '../models/question.model';
import {Subject, Subscription, takeUntil, timer} from 'rxjs';
import {SocketService} from '../socket.service';
import {ActivatedRoute} from '@angular/router';

enum QuizStatus {
  WAITING = 'waiting',
  ANSWERING = 'answering',
  SHOWING_RESULTS = 'showing_results',
}

@Component({
  selector: 'app-quiz',
  imports: [],
  templateUrl: './quiz.component.html',
  styleUrl: './quiz.component.scss'
})
export class QuizComponent implements OnInit, OnDestroy {
  players: Player[] = [];
  questions: Question[] = [];
  currentQuestionIndex = 0;
  currentPhase = QuizStatus.WAITING;
  selectedAnswer: string = '';
  timeRemaining = 0;
  isQuizStarted = false;
  isQuizFinished = false;
  quizUuid: string = '';

  private destroy$ = new Subject<void>();
  private timerSubscription?: Subscription;

  constructor(private quizService: QuizService, private socketService: SocketService, private route: ActivatedRoute) {
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.quizUuid = params['uuid'];
    });

    this.quizService.players$.subscribe((players) => {
      this.players = players;
      console.log("Players:", this.players);
    });
    if (this.quizService.responseData) {
      this.questions = this.quizService.responseData.questions;
    }
    console.log("Questions:", this.questions);

    if (this.questions.length === 0) {
      console.error('No questions available');
      return;
    }

    this.isQuizStarted = true;
    this.currentQuestionIndex = 0;

    // Emit to backend to start quiz
    this.setupSocketListeners();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopTimer();
    this.socketService.removeSocketListeners();
  }

  private setupSocketListeners() {
    // Listen for quiz start confirmation
    this.socketService.onQuizStarted(() => {
      console.log('Quiz started by server');
      this.startQuestionCycle();
    });

    // Listen for question timer events
    this.socketService.onQuestionStarted((data: any) => {
      console.log('Question started by server:', data);
      // Server handles the timer, we just update UI
    });

    // Listen for all players answered event
    this.socketService.onAllPlayersAnswered((data: any) => {
      console.log('All players have answered!', data);
      this.stopTimer();
      this.startResultsPhase();
    });

    // Listen for question results
    this.socketService.onQuestionResults((data: any) => {
      console.log('Question results:', data);
      // You can show additional results data here
    });

    // Listen for next question
    this.socketService.onNextQuestion((data: any) => {
      console.log('Moving to next question:', data);
      this.currentQuestionIndex = data.questionIndex;
      if (this.currentQuestionIndex >= this.questions.length) {
        this.finishQuiz();
      } else {
        this.startQuestionCycle();
      }
    });

    // Listen for quiz finished
    this.socketService.onQuizFinished((data: any) => {
      console.log('Quiz finished:', data);
      this.isQuizFinished = true;
      this.stopTimer();
    });

    // Listen for player updates (when someone answers)
    this.socketService.onPlayerAnswered((data: any) => {
      console.log('Player answered:', data);
      // Update specific player's hasAnswered status
      const player = this.players.find(p => p.id === data.playerId);
      if (player) {
        player.hasAnswered = true;
      }
    });
  }

  startQuiz() {
    if (this.questions.length === 0) {
      console.error('No questions available');
      return;
    }

    this.isQuizStarted = true;
    this.currentQuestionIndex = 0;

    // Emit quiz start to server
    this.socketService.emitQuizStart({
      quizUuid: this.quizUuid,
      questionCount: this.questions.length,
      timePerQuestion: 30,
      resultsTime: 5
    });
  }

  private startQuestionCycle() {
    this.selectedAnswer = '';
    this.resetPlayerAnswerStatus();
    this.startAnsweringPhase();
  }

  private startAnsweringPhase() {
    this.currentPhase = QuizStatus.ANSWERING;
    this.timeRemaining = 30;

    // Emit question start to server
    this.socketService.emitQuestionTimerStart({
      quizUuid: this.quizUuid,
      questionIndex: this.currentQuestionIndex,
      timePerQuestion: 30
    });

    // Start local timer (server also manages timer)
    this.startTimer(() => {
      this.startResultsPhase();
    });
  }

  private startResultsPhase() {
    this.currentPhase = QuizStatus.SHOWING_RESULTS;
    this.timeRemaining = 5;

    // Emit results phase start
    this.socketService.emitResultsPhase({
      quizUuid: this.quizUuid,
      questionIndex: this.currentQuestionIndex
    });

    this.startTimer(() => {
      this.moveToNextQuestion();
    });
  }

  private moveToNextQuestion() {
    // Server will handle this and emit nextQuestion event
    this.socketService.emitNextQuestion({
      currentQuestionIndex: this.currentQuestionIndex
    });
  }

  private finishQuiz() {
    this.isQuizFinished = true;
    this.stopTimer();

    this.socketService.emitQuizFinish({
      totalQuestions: this.questions.length
    });
  }

  // Submit answer via socket
  submitAnswer() {
    if (this.currentPhase !== QuizStatus.ANSWERING) return;


    // Emit answer to server
    this.socketService.emitPlayerAnswer({
      questionIndex: this.currentQuestionIndex,
      answer: this.selectedAnswer,
      timestamp: new Date().toISOString()
    });

    console.log('Submitted answer via socket:', this.selectedAnswer);
  }

  // Timer utilities
  private startTimer(onComplete: () => void) {
    this.stopTimer();

    this.timerSubscription = timer(0, 1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.timeRemaining--;

        if (this.timeRemaining <= 0) {
          this.stopTimer();
          onComplete();
        }
      });
  }

  private stopTimer() {
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = undefined;
    }
  }

  private resetPlayerAnswerStatus() {
    this.players.forEach((player: Player) => {
      player.hasAnswered = false;
    });
  }

  // Helper methods for template
  getCurrentQuestion(): Question | null {
    return this.questions[this.currentQuestionIndex] || null;
  }

  isAnswerCorrect(answer: string): boolean {
    const currentQuestion = this.getCurrentQuestion();
    return currentQuestion ? currentQuestion.correctAnswer === answer : false;
  }

  isAnswerSelected(answer: string): boolean {
    return this.selectedAnswer === answer;
  }

  getAnswerClass(answer: string): string {
    if (this.currentPhase !== QuizStatus.SHOWING_RESULTS) {
      return this.isAnswerSelected(answer) ? 'selected' : '';
    }

    if (this.isAnswerCorrect(answer)) {
      return 'correct';
    } else if (this.isAnswerSelected(answer) && !this.isAnswerCorrect(answer)) {
      return 'incorrect';
    }

    return 'neutral';
  }

  selectAnswer(answer: string, questionIndex: number): void {
    this.selectedAnswer = answer;
    this.currentQuestionIndex = questionIndex;
    console.log('Answer:', answer,'Question index:',  questionIndex);
  }
}
