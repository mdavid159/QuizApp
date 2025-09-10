import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';

interface Player {
  id: number;
  name: string;
  socketId: string;
  points: number;
  correctAnswers: number;
  hasAnswered: boolean;
  isReady: boolean;
  isHost: boolean;
}

interface Question {
  id: number;
  text: string;
  correctAnswer: string;
  answers: string[];
  quizId: number;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class QuizGateway {
  @WebSocketServer()
  server: Server;
  private playersSocketIds: Record<string, Player[]> = {};
  private playerIdCounter = 1;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  private getSocketIdByName(quizUuid: string, name: string): string | null {
    const player = this.playersSocketIds[quizUuid].find(
      (player) => player.name === name,
    );
    return player?.socketId ?? null;
  }

  private getQuizBySocketId(socketId: string): string | null {
    const quizUuid = Object.keys(this.playersSocketIds).find((quizUuid) => {
      return this.playersSocketIds[quizUuid].some(
        (player) => player.socketId === socketId,
      );
    });
    return quizUuid ?? null;
  }

  @SubscribeMessage('join-lobby')
  handleJoinLobby(
    @MessageBody() data: { name: string; quizUuid: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.quizUuid);
    const player: Player = {
      id: this.playerIdCounter++,
      name: data.name,
      socketId: client.id,
      points: 0,
      correctAnswers: 0,
      hasAnswered: false,
      isReady: false,
      isHost: false,
    };

    console.log(
      `[JOIN-LOBBY] Player "${data.name}" is joining quiz UUID: ${data.quizUuid}`,
    );

    // Initialize players list for the quiz if not already present
    this.playersSocketIds[data.quizUuid] =
      this.playersSocketIds[data.quizUuid] || [];

    // Check if player already joined
    // Check if name exists AND socketId is valid
    const existingPlayerIndex = this.playersSocketIds[data.quizUuid].findIndex(
      (p) => p.name === data.name,
    );

    if (existingPlayerIndex !== -1) {
      const existingPlayer =
        this.playersSocketIds[data.quizUuid][existingPlayerIndex];
      const stillConnected = this.server.sockets.sockets.has(
        existingPlayer.socketId,
      );

      if (stillConnected) {
        client.emit('already-joined-lobby', {
          message: 'Player is already in this lobby',
        });
        return;
      } else {
        // Remove stale disconnected player with same name
        this.playersSocketIds[data.quizUuid].splice(existingPlayerIndex, 1);
      }
    }

    // Make the first player the host
    if (this.playersSocketIds[data.quizUuid].length === 0) {
      player.isHost = true;
    }

    // Add player to the players list for the quiz
    this.playersSocketIds[data.quizUuid].push(player);
    console.log(this.playersSocketIds);

    // Broadcast updated player list
    this.server
      .to(data.quizUuid)
      .emit('update-players', this.playersSocketIds[data.quizUuid]);

    // Acknowledge join to the player
    client.emit('joined-lobby', player);
  }

  @SubscribeMessage('toggle-ready')
  handleToggleReady(
    @MessageBody() data: { name: string; quizUuid: string; isReady: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const player = this.playersSocketIds[data.quizUuid].find(
      (player) => player.name === data.name,
    );

    if (player) {
      player.isReady = data.isReady;
    }

    this.server
      .to(data.quizUuid)
      .emit('update-players', this.playersSocketIds[data.quizUuid]);
  }

  @SubscribeMessage('kick-player')
  handleKickPlayer(
    @MessageBody() data: { name: string; quizUuid: string },
    @ConnectedSocket() client: Socket,
  ) {
    const playerIndex = this.playersSocketIds[data.quizUuid].findIndex(
      (player) => player.name === data.name,
    );
    const kickedPlayerId = this.getSocketIdByName(data.quizUuid, data.name);
    const socketToKick = kickedPlayerId
      ? this.server.sockets.sockets.get(kickedPlayerId)
      : null;

    if (playerIndex !== -1) {
      this.playersSocketIds[data.quizUuid].splice(playerIndex, 1);
      this.playerIdCounter--;

      if (kickedPlayerId) {
        //socketToKick?.leave(data.quizUuid);
        this.server.to(kickedPlayerId).emit('kicked-player', {
          message: 'You got kicked!',
        });
        //socketToKick?.disconnect();

        this.server
          .to(data.quizUuid)
          .emit('update-players', this.playersSocketIds[data.quizUuid]);
      }
    }
  }

  @SubscribeMessage('start-quiz')
  handleStartQuiz(@MessageBody() data: { quizUuid: string }) {
    let countDown = 5;
    const interval = setInterval(() => {
      if (countDown > 0) {
        this.server.to(data.quizUuid).emit('countdown', countDown);
        countDown--;
      } else {
        clearInterval(interval);
        this.server.to(data.quizUuid).emit('go-to-quiz');
      }
    }, 1000);
  }

  @SubscribeMessage('send-message')
  handleTextChat(
    @MessageBody() data: { sender: string; text: string; quizUuid: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log('Message:', data);
    const message = {
      sender: data.sender,
      text: data.text,
    };
    this.server.to(data.quizUuid).emit('receive-message', message);
    console.log('Message sent:', message);
  }

  @SubscribeMessage('go-back')
  handleGoBack(
    @MessageBody() data: { name: string; quizUuid: string },
    @ConnectedSocket() client: Socket,
  ) {
    const playerIndex = this.playersSocketIds[data.quizUuid].findIndex(
      (player) => player.name === data.name,
    );
    const kickedPlayerId = this.getSocketIdByName(data.quizUuid, data.name);
    const socketToKick = kickedPlayerId
      ? this.server.sockets.sockets.get(kickedPlayerId)
      : null;

    if (playerIndex !== -1) {
      this.playersSocketIds[data.quizUuid].splice(playerIndex, 1);
      this.playerIdCounter--;

      if (kickedPlayerId) {
        //socketToKick?.leave(data.quizUuid);
        this.server.to(kickedPlayerId).emit('go-back-menu');
        //client.disconnect();

        this.server
          .to(data.quizUuid)
          .emit('update-players', this.playersSocketIds[data.quizUuid]);
      }
    }
  }

  @SubscribeMessage('question-timer-start')
  handleQuestionTimer(
    @MessageBody()
    data: {
      quizUuid: string;
      questionIndex: number;
      timePerQuestion: number;
    },
  ) {
    let remainingTime = data.timePerQuestion;

    const interval = setInterval(() => {
      if (remainingTime > 0) {
        this.server.to(data.quizUuid).emit('timePerQuestion', remainingTime);
        remainingTime--;
      } else {
        clearInterval(interval);
        // EMIT RESULTS PHASE
      }
    }, 1000);
  }

  @SubscribeMessage('results-timer-start')
  handleResultsTimer(
    @MessageBody()
    data: {
      quizUuid: string;
      questionIndex: number;
    },
  ) {
    let duration = 5;

    const interval = setInterval(() => {
      if (duration > 0) {
        this.server.to(data.quizUuid).emit('results-countdown', duration);
        duration--;
      } else {
        clearInterval(interval);
        this.server.to(data.quizUuid).emit('go-to-next-question', {
          quizUuid: data.quizUuid,
          questionIndex: data.questionIndex + 1,
        });
      }
    }, 1000);
  }

  private emitLeaderboard(quizUuid: string, questionIndex: number) {
    const leaderboard = [...this.playersSocketIds[quizUuid]].sort(
      (a, b) => b.points - a.points,
    );

    // Reset hasAnswered for next question
    leaderboard.forEach((p) => (p.hasAnswered = false));

    this.server.to(quizUuid).emit('leaderboard-update', {
      questionIndex,
      leaderboard,
    });
  }

  @SubscribeMessage('submit-answer')
  handleSubmitAnswer(
    @MessageBody()
    data: {
      quizUuid: string;
      playerName: string;
      answer: string;
      correctAnswer: string;
      questionIndex: number;
    },
  ) {
    const player = this.playersSocketIds[data.quizUuid]?.find(
      (p) => p.name === data.playerName,
    );

    if (!player || player.hasAnswered) return;

    player.hasAnswered = true;

    if (data.answer === data.correctAnswer) {
      // POINTS LOGIC HERE
    }

    const allAnswered = this.playersSocketIds[data.quizUuid].every(
      (p) => p.hasAnswered,
    );

    if (allAnswered) {
      this.emitLeaderboard(data.quizUuid, data.questionIndex);
    }
  }

  @SubscribeMessage('start-questions')
  handleQuestionsStart(
    @MessageBody()
    data: {
      quizUuid: string;
      questionCount: number;
      timePerQuestion: number;
      resultsTime: number;
    },
    @ConnectedSocket() client: Socket,
  ) {}
}
