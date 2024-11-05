import { Socket } from 'socket.io';
import { Server as SocketIOServer } from 'socket.io';
import * as Types from './types';
import { v4 as uuidv4 } from 'uuid';

// 방 정보 저장
export const rooms: Record<string, Types.Room> = {};

// 방 키 생성
export const generateRoomKey = (): string => {
  return uuidv4();
};

// 방 생성
export const createRoom = (socket: Socket, userName: string): string => {
  const roomKey = generateRoomKey();
  rooms[roomKey] = {
    participants: [],
  };

  joinRoom(socket, roomKey, userName);
  return roomKey;
};

// 방 참가
export const joinRoom = (socket: Socket, roomKey: string, userName: string): boolean => {
  const room = rooms[roomKey];
  if (room) {
    room.participants.push({ socketId: socket.id, userName });
    socket.join(roomKey);
    socket.emit('room:joined', roomKey);

    // 기존 참가자 정보 전달
    const existingParticipants = room.participants.filter((p) => p.socketId !== socket.id);
    socket.emit('room:existingParticipants', existingParticipants);

    // 다른 참가자들에게 새로운 참가자 알림
    socket.broadcast.to(roomKey).emit('participant:new', {
      socketId: socket.id,
      userName,
    });

    return true;
  } else {
    socket.emit('room:notFound');
    return false;
  }
};

// 방 나가기
export const leaveRoom = (socket: Socket, roomKey: string, io: SocketIOServer): void => {
  const room = rooms[roomKey];
  if (!room) return;

  room.participants = room.participants.filter((p) => p.socketId !== socket.id);
  socket.leave(roomKey);

  // 다른 참가자들에게 알림
  io.to(roomKey).emit('participant:left', socket.id);

  // 방에 참가자가 없으면 방 삭제
  if (room.participants.length === 0) {
    delete rooms[roomKey];
  }
};

// 소켓 연결 해제 처리
export const handleDisconnect = (socket: Socket, io: SocketIOServer): void => {
  Object.keys(rooms).forEach((roomKey) => {
    const room = rooms[roomKey];
    const participant = room.participants.find((p) => p.socketId === socket.id);
    if (participant) {
      leaveRoom(socket, roomKey, io);
    }
  });
};

// 시그널링 처리
export const handleOffer = (socket: Socket, roomKey: string, data: Types.SignalData): void => {
  const { content, to } = data;
  socket.to(to).emit('signal:offerAwaiting', {
    senderSocketId: socket.id,
    content,
  });
};

export const handleAnswer = (socket: Socket, roomKey: string, data: Types.SignalData): void => {
  const { content, to } = data;
  socket.to(to).emit('signal:answerResponse', {
    senderSocketId: socket.id,
    content,
  });
};

export const handleIceCandidate = (
  socket: Socket,
  roomKey: string,
  data: Types.SignalData,
): void => {
  const { content, to } = data;
  socket.to(to).emit('signal:iceCandidateReceived', {
    senderSocketId: socket.id,
    content,
  });
};

export const handleTrackInfo = (
  socket: Socket,
  roomKey: string,
  data: Types.TrackInfoData,
): void => {
  const { to, trackId, mediaType } = data;
  socket.to(to).emit('signal:trackInfo', {
    senderSocketId: socket.id,
    content: {
      trackId,
      mediaType,
    },
  });
};
