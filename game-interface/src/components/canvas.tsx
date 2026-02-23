import { useEffect, useRef } from "react";
import { Time } from "../games/Game";
import { WaterfallGame } from "../games/waterfall-game.ts";
import { connect } from "../socket/websocket.ts";
import { unlockAudio } from "../sound/SoundManager";

export default function GameCanvas() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null)

    useEffect(() => {
        const canvas = canvasRef.current!

        const updateSize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }

        window.addEventListener("resize", updateSize)
        updateSize()

        const game = new WaterfallGame(canvas, {
            backgroundSrc: ""
        })

        const time = new Time()

        const socket = connect("student")
        socket.on("start_game", (data: { rounds: number, style: string }) => {
            console.log("[WS] start_game", data)
            if (data.style) {
                game.setNumberSet(data.style)
            }
            game.externalStart(data.rounds, data.style)
        })

        socket.on("stop_game", () => {
            console.log("[WS] stop_game")
            game.externalStop()
        })

        function loop(ts: number) {
            time.update(ts)
            game.update(time)
            requestAnimationFrame(loop)
        }

        game.start()
        // game.start() already calls resetGame() which sets state to "waiting"
        requestAnimationFrame(loop)

        // click handling
        const handleClick = (e: MouseEvent) => {
            unlockAudio()
            const rect = canvas.getBoundingClientRect()
            const x = e.clientX - rect.left
            const y = e.clientY - rect.top
            game.onClick(x, y)
        }

        // x and y are given in percentages from top left
        socket.on("click", ({x, y}) => {
            const rect = canvas.getBoundingClientRect()
            const realX = x * rect.right
            const realY = y * rect.bottom
            game.onClick(realX, realY)
        })

        canvas.addEventListener("click", handleClick)

        return () => {
            canvas.removeEventListener("click", handleClick)
            window.removeEventListener("resize", updateSize)
        }
    }, [])

    return <canvas ref={canvasRef} style={{ display: "block" }} />
}
