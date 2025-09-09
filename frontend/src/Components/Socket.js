import { io } from 'socket.io-client';


const SOCKET_URL = 'http://localhost:3500' || window.location.origin;
export const socket = io(SOCKET_URL, {
autoConnect: false,
});