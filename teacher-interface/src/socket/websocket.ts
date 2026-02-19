import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_SOCKET_HOST, {
    transports: ["websocket"]
})

export function getSocket() {
    return socket;
}