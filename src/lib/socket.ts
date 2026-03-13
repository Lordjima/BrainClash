import { io } from 'socket.io-client';
export const socket = io(window.location.origin, { autoConnect: false, reconnection: true, reconnectionAttempts: 3, reconnectionDelay: 3000, reconnectionDelayMax: 10000, timeout: 10000, transports: ['websocket'] });
export function ensureSocketConnected() { if (!socket.connected && !socket.active) socket.connect(); }
