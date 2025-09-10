import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import {Player} from './models/player.model';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  socket: Socket;
  public players$ = new BehaviorSubject<Player[]>([]);
  public responseData: any;

  constructor() {
    this.socket = io('http://localhost:3000');
    this.socket.on('connect', () => {
      console.log('Connected to server');
    });
    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });
    this.setupSocketListeners();
  }

  joinLobby(name: string, quizUuid: string) {
    this.socket.emit('join-lobby', { name, quizUuid });
  }

  onJoinedLobby(callback: (player: Player) => void) {
    this.socket.on('joined-lobby', callback);
  }

  onUpdatePlayers(callback: (players: Player[]) => void) {
    this.socket.on('update-players', callback);
  }

  alreadyJoinedLobby(callback: (data: { message: string }) => void) {
    this.socket.on('already-joined-lobby', callback);
  }

  startQuiz(quizUuid: string) {
    this.socket.emit('start-quiz', { quizUuid });
  }

  goToQuiz(callback: () => void) {
    this.socket.on('go-to-quiz', callback);
  }

  private setupSocketListeners() {
    // Listen for player updates
    this.socket.on('playersUpdated', (players: Player[]) => {
      this.players$.next(players);
    });
  }

  // EMIT EVENTS TO SERVER

  // Start quiz
  emitQuizStart(data: { quizUuid: string, questionCount: number; timePerQuestion: number; resultsTime: number }) {
    this.socket.emit('start-questions', data);
  }

  // Start question timer
  emitQuestionTimerStart(data: { quizUuid: string; questionIndex: number; timePerQuestion: number }) {
    this.socket.emit('question-timer-start', data);
  }

  // Submit player answer
  emitPlayerAnswer(data: {
    questionIndex: number;
    answer: string;
    timestamp: string
  }) {
    this.socket.emit('player:answer', data);
  }

  // Start results phase
  emitResultsPhase(data: { quizUuid: string, questionIndex: number  }) {
    this.socket.emit('results-timer-start', data);
  }

  // Move to next question
  emitNextQuestion(data: { currentQuestionIndex: number }) {
    this.socket.emit('question:next', data);
  }

  // Finish quiz
  emitQuizFinish(data: { totalQuestions: number }) {
    this.socket.emit('quiz:finish', data);
  }

  // LISTEN TO EVENTS FROM SERVER

  // Quiz started
  onQuizStarted(callback: (data: any) => void) {
    this.socket.on('quiz:started', callback);
  }

  // Question started
  onQuestionStarted(callback: (data: any) => void) {
    this.socket.on('question:started', callback);
  }

  // All players answered
  onAllPlayersAnswered(callback: (data: any) => void) {
    this.socket.on('allPlayersAnswered', callback);
  }

  // Question results
  onQuestionResults(callback: (data: any) => void) {
    this.socket.on('question:results', callback);
  }

  // Next question
  onNextQuestion(callback: (data: any) => void) {
    this.socket.on('question:next', callback);
  }

  // Quiz finished
  onQuizFinished(callback: (data: any) => void) {
    this.socket.on('quiz:finished', callback);
  }

  // Player answered
  onPlayerAnswered(callback: (data: any) => void) {
    this.socket.on('player:answered', callback);
  }

  // Timer updates from server (optional)
  onTimerUpdate(callback: (data: { timeRemaining: number }) => void) {
    this.socket.on('timer:update', callback);
  }

  // Clean up listeners
  removeSocketListeners() {
    this.socket.off('quiz:started');
    this.socket.off('question:started');
    this.socket.off('allPlayersAnswered');
    this.socket.off('question:results');
    this.socket.off('question:next');
    this.socket.off('quiz:finished');
    this.socket.off('player:answered');
    this.socket.off('timer:update');
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
