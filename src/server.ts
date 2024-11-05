import fs from 'fs';
import https from 'https';
import express from 'express';
import { Server as SocketIOServer, Socket } from 'socket.io';
import * as SocketHandlers from './socketHandlers';
import * as Types from './types';

// 인증서 파일 읽기
const key: Buffer = fs.readFileSync('./certs/cert.key');
const cert: Buffer = fs.readFileSync('./certs/cert.crt');

// Express 설정
const app = express();

// HTTPS 서버 및 Socket.IO 설정
const server = https.createServer({ key, cert }, app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
  },
});

server.listen(8181, () => console.log('Server is running on port 8181'));

// 소켓 이벤트 처리
io.on('connection', (socket: Socket) => {
  console.log(`클라이언트 연결됨: ${socket.id}`);

  socket.on('room:create', (userName: string, ackFunction: (roomKey: string) => void) => {
    const roomKey = SocketHandlers.createRoom(socket, userName);
    ackFunction(roomKey);
  });

  socket.on(
    'room:join',
    (roomKey: string, userName: string, ackFunction: (response: string) => void) => {
      const success = SocketHandlers.joinRoom(socket, roomKey, userName);
      ackFunction(success ? 'success' : 'failure');
    },
  );

  socket.on('room:leave', (roomKey: string) => {
    SocketHandlers.leaveRoom(socket, roomKey, io);
  });

  socket.on('signal:offer', (roomKey: string, data: Types.SignalData) => {
    SocketHandlers.handleOffer(socket, roomKey, data);
  });

  socket.on('signal:answer', (roomKey: string, data: Types.SignalData) => {
    SocketHandlers.handleAnswer(socket, roomKey, data);
  });

  socket.on('signal:iceCandidate', (roomKey: string, data: Types.SignalData) => {
    SocketHandlers.handleIceCandidate(socket, roomKey, data);
  });

  socket.on('participant:micStatusChanged', (data: { roomKey: string; micEnabled: boolean }) => {
    const { roomKey, micEnabled } = data;
    // 다른 참가자들에게 마이크 상태 전송
    socket.to(roomKey).emit('participant:micStatusChanged', {
      socketId: socket.id,
      micEnabled,
    });
  });

  socket.on('signal:trackInfo', (roomKey: string, data: Types.TrackInfoData) => {
    SocketHandlers.handleTrackInfo(socket, roomKey, data);
  });

  socket.on('disconnect', () => {
    console.log(`클라이언트 연결 해제됨: ${socket.id}`);
    SocketHandlers.handleDisconnect(socket, io);
  });
});
