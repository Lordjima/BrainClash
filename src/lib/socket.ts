import { io, type Socket } from 'socket.io-client';

let hasTriedToConnect = false;

export const socket: Socket = io(window.location.origin, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 3,
  reconnectionDelay: 3000,
  reconnectionDelayMax: 10000,
  timeout: 10000,
  transports: ['websocket'],
});

export function ensureSocketConnected() {
  if (socket.connected || socket.active) return;
  hasTriedToConnect = true;
  socket.connect();
}
