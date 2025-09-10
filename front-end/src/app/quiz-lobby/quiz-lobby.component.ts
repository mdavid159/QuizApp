import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import { SocketService } from '../socket.service';
import { FormsModule } from '@angular/forms';
import {NgStyle, Location} from '@angular/common';
import {QuizService} from '../quiz.service';
import {Player} from '../models/player.model';

@Component({
  selector: 'app-quiz-lobby',
  templateUrl: './quiz-lobby.component.html',
  imports: [
    FormsModule,
    NgStyle,
  ],
  styleUrls: ['./quiz-lobby.component.scss']
})
export class QuizLobbyComponent implements OnInit, OnDestroy{
  chat = document.querySelector('.chat-messages');
  doesPlayerExist = false;
  playerName = '';
  quizUuid: string = '';
  isHost = '';
  players: Player[] = [];
  showModal = false;
  showModalMessage = '';
  isNameTaken = false;
  countdown: number | null = null;
  messages: { sender: string; text: string }[] = [];
  messageText = '';

  constructor(public quizService: QuizService, private socketService: SocketService, private route: ActivatedRoute, private router: Router, private location: Location) {}

  updatePlayersFromSocket(players: Player[]) {
    this.players = players;
    this.quizService.setPlayers(players);
  }

  handleKickedPlayer = (data: { message: string }) => {
    console.log('Kicked player:', data);
    alert(data.message);
    this.router.navigate([``]);
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.quizUuid = params['uuid'];
    });

    this.location.subscribe(event => {
      console.log('User used back or forward button:', event);
      this.sendPlayerBack(this.players.find((player) => player.name === this.playerName) as Player);
      console.log('Player:', this.players.find((player) => player.name === this.playerName) as Player);
    });

    this.socketService.onJoinedLobby((player: Player) => {
      this.isHost = player.isHost ? player.name : '';
      console.log('You joined the lobby as:', player);
    });

    this.socketService.onUpdatePlayers((players: Player[]) => {
      this.players = players;
    });

    this.socketService.alreadyJoinedLobby((data) => {
      this.showModal = true;
      this.showModalMessage = data.message;
      this.isNameTaken = true;
      this.doesPlayerExist = false;
    });

    this.socketService.goToQuiz(() => {
      this.router.navigate([`/quiz/${this.quizUuid}`]);
    });

    this.socketService.socket.on('countdown', (seconds: number) => {
      this.countdown = seconds;
      console.log('Countdown:', this.countdown);
    })

    this.socketService.socket.off('receive-message');
    this.socketService.socket.on('receive-message', (message: { sender: string; text: string }) => {
      console.log('Message:', message);
      this.messages.push(message);
    });

    this.socketService.socket.off('kicked-player');
    this.socketService.socket.on('kicked-player', this.handleKickedPlayer);
  }
  ngOnDestroy() {
    this.socketService.socket.off('kicked-player', this.handleKickedPlayer);
    this.socketService.socket.off('receive-message');
    this.socketService.socket.off('countdown');
  }

  joinQuiz() {
    this.doesPlayerExist = true;
    console.log('Player:', this.players);
    this.socketService.joinLobby(this.playerName, this.quizUuid);
  }

  closeModal() {
    this.showModal = false;
    this.showModalMessage = '';
  }

  startQuiz() {
    this.socketService.startQuiz(this.quizUuid);
    this.updatePlayersFromSocket(this.players);
    console.log("Players:", this.players);
  }

  togglePlayerReady() {
    const player = this.players.find((player) => player.name === this.playerName);
    if (player) {
      this.socketService.socket.emit('toggle-ready', {
        name: this.playerName,
        quizUuid: this.quizUuid,
        isReady: !player.isReady,
      });
    }
  }

  kickPlayer(player: Player){
    if (this.isHost === this.playerName) {
      this.socketService.socket.emit('kick-player', { name: player.name, quizUuid: this.quizUuid });
    }
  }

  sendPlayerBack(player: Player){
    this.socketService.socket.emit('go-back', { name: player.name, quizUuid: this.quizUuid });
  }

  get isAllPlayersReady() {
    return this.players.every((player) => player.isReady);
  }

  sendMessage() {
    if (this.messageText.trim() !== '') {
      console.log('Sending message:', this.messageText);
      this.socketService.socket.emit('send-message', {
        quizUuid: this.quizUuid,
        sender: this.playerName,
        text: this.messageText,
      });
      this.messageText = '';
    }
  }
}
