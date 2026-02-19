import { useEffect, useRef } from "react"
import {WaterfallGame} from "../games/waterfall-game.ts"
import { Time } from "../games/Game"

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

        function loop(ts: number) {
            time.update(ts)
            game.update(time)
            requestAnimationFrame(loop)
        }

        game.start()
        requestAnimationFrame(loop)

        // click handling
        const handleClick = (e: MouseEvent) => {
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
