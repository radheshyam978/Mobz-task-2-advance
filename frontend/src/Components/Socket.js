import { io } from 'socket.io-client';


const SOCKET_URL = 'https://mobz-task-2-advance-1.onrender.com' || window.location.origin;
export const socket = io(SOCKET_URL, {
autoConnect: false,
});