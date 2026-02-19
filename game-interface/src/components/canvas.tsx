import { useEffect, useRef } from "react"
import {WaterfallGame} from "../games/waterfall-game.ts"
import { Time } from "../games/Game"
import { unlockAudio as unlockAudio } from "../sound/SoundManager"
import {connect} from "../socket/websocket.ts";

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
        socket.on("start_game", (data: { rounds: number }) => {
            console.log("[WS] start_game", data)
            game.externalStart(data.rounds)
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

        canvas.addEventListener("click", handleClick)

        return () => {
            canvas.removeEventListener("click", handleClick)
            window.removeEventListener("resize", updateSize)
        }
    }, [])

    return <canvas ref={canvasRef} style={{ display: "block" }} />
}
