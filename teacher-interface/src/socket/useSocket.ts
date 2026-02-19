import { getSocket } from "./websocket"

type Handler<T> = (data: T) => void

export function useSocket(params: {
    [channel: string]: Handler<unknown>
}) {

    const socket = getSocket()

    for(const channel in params) {
        socket.on(channel, params[channel])
    }

    return socket

}