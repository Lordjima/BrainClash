import { io } from 'socket.io-client';

// Connect to the same origin where the app is served
export const socket = io(window.location.origin);
