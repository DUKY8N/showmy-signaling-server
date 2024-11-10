export interface Participant {
  socketId: string;
  userName: string;
}

export interface Room {
  participants: Participant[];
}

export interface SignalData {
  content: string;
  to: string;
}

export interface TrackInfoData {
  to: string;
  trackId: string;
  mediaType: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: number;
}
