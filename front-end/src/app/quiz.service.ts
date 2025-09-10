import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {BehaviorSubject, Observable} from 'rxjs';
import {Player} from './models/player.model';

@Injectable({
  providedIn: 'root'
})
export class QuizService {
  private apiUrl = 'http://localhost:3000';
  public responseData: any = null;
  private playersSubject = new BehaviorSubject<Player[]>([]);
  public players$ = this.playersSubject.asObservable();

  constructor(private http: HttpClient) { }

  setPlayers(players: Player[]) {
    this.playersSubject.next(players);
  }

  getPlayersSnapshot(): Player[] {
    return this.playersSubject.getValue();
  }

  joinQuiz(password: string, uuid: string): Observable<any> {
    const url = `${this.apiUrl}/quiz/${uuid}/lobby`;
    const httpOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
    }
    return this.http.post(url, { password, uuid }, httpOptions);
  }
}
