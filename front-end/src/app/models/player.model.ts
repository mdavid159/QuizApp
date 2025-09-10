export interface Player {
  id: number;
  name: string;
  socketId: string;
  points: number;
  correctAnswers: number;
  hasAnswered: boolean;
  isReady: boolean;
  isHost: boolean;
}
