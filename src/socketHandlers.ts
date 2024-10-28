import { Socket } from 'socket.io';
import { Server as SocketIOServer } from 'socket.io';
import * as Types from './types';
import * as Utils from './utils';

export const rooms: Record<string, Types.Room> = {};

export const createRoom = (socket: Socket, userName: string): string => {
  const roomKey = Utils.generateRoomKey();
  rooms[roomKey] = {
    participants: [],
  };

  joinRoom(socket, roomKey, userName);
  return roomKey;
};

export const joinRoom = (socket: Socket, roomKey: string, userName: string): void => {
  const room = rooms[roomKey];
  if (room) {
    room.participants.push({ socketId: socket.id, userName });
    socket.join(roomKey);
    socket.emit('room:joined', roomKey);

    // 기존 참가자 정보 전달
    const existingParticipants = room.participants.filter((p) => p.socketId !== socket.id);
    socket.emit('room:existingParticipants', existingParticipants);

    Utils.notifyNewParticipant(socket, roomKey, userName);
  } else {
    socket.emit('room:notFound');
  }
};

export const removeSocketFromRoom = (
  socketId: string,
  roomKey: string,
  io: SocketIOServer,
): void => {
  Utils.removeParticipantFromRoom(socketId, roomKey, rooms, io);
};

export const handleOffer = (socket: Socket, roomKey: string, data: Types.SignalData): void => {
  Utils.handleSignal(socket, data, 'signal:offerAwaiting');
};

export const handleAnswer = (socket: Socket, roomKey: string, data: Types.SignalData): void => {
  Utils.handleSignal(socket, data, 'signal:answerResponse');
};

export const handleIceCandidate = (
  socket: Socket,
  roomKey: string,
  data: Types.SignalData,
): void => {
  Utils.handleSignal(socket, data, 'signal:iceCandidateReceived');
};
