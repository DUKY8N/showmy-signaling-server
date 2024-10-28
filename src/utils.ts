import { Socket } from 'socket.io';
import { Server as SocketIOServer } from 'socket.io';
import * as Types from './types';
import { v4 as uuidv4 } from 'uuid';

export const generateRoomKey = (): string => {
  return uuidv4();
};

export const notifyNewParticipant = (socket: Socket, roomKey: string, userName: string): void => {
  socket.broadcast.to(roomKey).emit('participant:new', {
    socketId: socket.id,
    userName,
  });
};

export const removeParticipantFromRoom = (
  socketId: string,
  roomKey: string,
  rooms: Record<string, Types.Room>,
  io: SocketIOServer,
): void => {
  const room = rooms[roomKey];
  if (!room) return;

  room.participants = room.participants.filter((p) => p.socketId !== socketId);

  // 다른 참가자들에게 알림
  io.to(roomKey).emit('participant:left', socketId);

  if (room.participants.length === 0) delete rooms[roomKey];
};

export const handleSignal = (socket: Socket, data: Types.SignalData, event: string): void => {
  const { content, to } = data;
  socket.to(to).emit(event, {
    senderSocketId: socket.id,
    content,
  });
};
