import { io } from "socket.io-client"


export function join() {
    const socket = io(import.meta.env.VITE_SOCKET_HOST)
    socket.on("connect", () => { 
        console.log("Connected")
        socket.emit("join", "teacher")
    })

    socket.on("message", msg => {
        console.log(msg)
    })
}
