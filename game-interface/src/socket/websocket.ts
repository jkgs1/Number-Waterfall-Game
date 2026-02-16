import { io, Socket } from "socket.io-client"

export type Role = "teacher" | "student"

export interface ClickEvent {
    x: number
    y: number
    timestamp: number
}

export interface DragEvent {
    startX: number
    startY: number
    endX: number
    endY: number
    timestamp: number
}

export interface GameState {
    running: boolean
    currentQuestion?: string
    options?: number[]
}

export interface ServerMessage {
    type: string
    payload?: never
}

let socket: Socket | null = null

export function connect(role: Role = "teacher"): Socket {
    if (socket && socket.connected) {
        return socket
    }

    socket = io(import.meta.env.VITE_SOCKET_HOST, {
        transports: ["websocket"], // force ws (lower latency than polling)
    })

    socket.on("connect", () => {
        console.log("[ws] Connected:", socket?.id)
        socket?.emit("join", role)
    })

    socket.on("disconnect", () => {
        console.log("[ws] Disconnected")
    })

    socket.on("connect_error", (err) => {
        console.error("[ws] Connection error:", err)
    })


    socket.on("message", (msg: ServerMessage) => {
        console.log("[ws] message:", msg)
    })

    socket.on("game_state", (state: GameState) => {
        console.log("[ws] game_state:", state)
    })

    socket.on("start", () => {
        console.log("[ws] Game started")
    })

    socket.on("stop", () => {
        console.log("[ws] Game stopped")
    })

    return socket
}

export function disconnect() {
    if (socket) {
        socket.disconnect()
        socket = null
    }
}

export function startGame() {
    if (!socket) throw new Error("Socket not connected")
    socket.emit("start")
}

export function stopGame() {
    if (!socket) throw new Error("Socket not connected")
    socket.emit("stop")
}

export function onMessage(handler: (msg: ServerMessage) => void) {
    socket?.on("message", handler)
}

export function onGameState(handler: (state: GameState) => void) {
    socket?.on("game_state", handler)
}

export function onStart(handler: () => void) {
    socket?.on("start", handler)
}

export function onStop(handler: () => void) {
    socket?.on("stop", handler)
}

// Inputs

export function sendClick(evt: ClickEvent) {
    if (!socket) return
    socket.emit("click", evt)
}

export function sendDrag(evt: DragEvent) {
    if (!socket) return
    socket.emit("drag", evt)
}
