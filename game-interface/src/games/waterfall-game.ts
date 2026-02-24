import { Game, Time } from "./Game"
import waterfall from "../assets/Background.png"

type DigitEntity = {
    value: number
    x: number
    y: number
    speed: number
    size: number
}

type GameState =
    | "waiting"
    | "playing"
    | "feedback_correct"
    | "feedback_wrong"
    | "game_over"

export class WaterfallGame extends Game {

    private state: GameState = "waiting"

    private backgroundImg = new Image()
    private backgroundLoaded = false

    private digits: DigitEntity[] = []
    private spawnTimer = 0

    private currentA = 0
    private currentB = 0
    private answer = 0

    private score = 0
    private maxRounds = 10
    private currentProblemIndex = 0

    private readonly problems: { a: number, b: number, ans: number }[] = [
        { a: 1, b: 1, ans: 2 }, { a: 1, b: 2, ans: 3 }, { a: 2, b: 1, ans: 3 }, { a: 2, b: 2, ans: 4 }, { a: 1, b: 3, ans: 4 },
        { a: 3, b: 1, ans: 4 }, { a: 2, b: 3, ans: 5 }, { a: 3, b: 2, ans: 5 }, { a: 4, b: 1, ans: 5 }, { a: 1, b: 4, ans: 5 },
        { a: 3, b: 3, ans: 6 }, { a: 2, b: 4, ans: 6 }, { a: 4, b: 2, ans: 6 }, { a: 5, b: 1, ans: 6 }, { a: 1, b: 5, ans: 6 },
        { a: 4, b: 3, ans: 7 }, { a: 3, b: 4, ans: 7 }, { a: 5, b: 2, ans: 7 }, { a: 2, b: 5, ans: 7 }, { a: 6, b: 1, ans: 7 },
        { a: 4, b: 4, ans: 8 }, { a: 5, b: 3, ans: 8 }, { a: 3, b: 5, ans: 8 }, { a: 6, b: 2, ans: 8 }, { a: 2, b: 6, ans: 8 },
        { a: 5, b: 4, ans: 9 }, { a: 4, b: 5, ans: 9 }, { a: 6, b: 3, ans: 9 }, { a: 3, b: 6, ans: 9 }, { a: 7, b: 2, ans: 9 }
    ]

    private feedbackTimer = 0

    private lanes: number[] = []
    private laneWidth = 0

    private digitImages: HTMLImageElement[] = []

    // Deterministic spawn order for falling digits (repeatable sequence)
    private spawnOrder: number[] = [1,2,3,4,5,6,7,8,9]
    private spawnOrderIndex: number = 0
    private currentStyle: string = "plain"
    public plainColor: string = "#ff0000" //red number
    public plainColorActive: boolean = false



    start(): void {
        this.backgroundImg.src = waterfall
        this.backgroundImg.onload = () => {
            this.backgroundLoaded = true
        }
        this.setNumberSet("plain")
        this.resetGame()
    }

    public externalStart(rounds: number, style: string) {
        this.maxRounds = Math.min(rounds, 30)
        this.score = 0
        this.digits = []
        this.spawnOrderIndex = 0
        this.currentStyle = style

        if (style === "animals") {
            this.currentProblemIndex = 0
        } else if (style === "plain") {
            this.currentProblemIndex = 5
        } else if (style === "colorful") {
            this.currentProblemIndex = 10
        } else {
            this.currentProblemIndex = 0
        }

        this.startRound()
        console.log(`Game started with ${this.maxRounds} rounds using style ${style} starting at problem ${this.currentProblemIndex}`)
    }

    public externalStop() {
        this.resetGame()
    }

    private resetGame() {
        this.state = "waiting"
        this.score = 0
        this.digits = []
        this.spawnOrderIndex = 0
    }

    private startRound() {
        this.generateProblem()
        this.digits = []
        this.spawnTimer = 0
        this.state = "playing"
        this.readProblem()
    }

    private generateProblem() {
        const problem = this.problems[this.currentProblemIndex % this.problems.length]
        this.currentA = problem.a
        this.currentB = problem.b
        this.answer = problem.ans
        
        // Advance to next problem for the next round
        this.currentProblemIndex = (this.currentProblemIndex + 1) % this.problems.length
    }

    public setNumberSet(style: string) {
        this.digitImages = []

        const availableStyles = ["plain", "animals", "colored", "colorful"]
        const requestedStyle = availableStyles.includes(style) ? style : "plain"

        // Normalize style: map unimplemented colored/colorful to plain (assets + behavior)
        let assetFolder = requestedStyle
        if (requestedStyle === "colored" || requestedStyle === "colorful") {
            assetFolder = "plain"
        }
        // Use the normalized folder also as the current style so rendering logic applies consistently
        this.currentStyle = assetFolder

        // We only have 1-9.svg
        for (let i = 1; i <= 9; i++) {
            const img = new Image()
            img.src = new URL(`../assets/${assetFolder}/${i}.svg`, import.meta.url).href
            this.digitImages[i] = img
        }
    }

    private readProblem() {
        const utter = new SpeechSynthesisUtterance(`${this.currentA} plus ${this.currentB}`)
        speechSynthesis.cancel()
        speechSynthesis.speak(utter)
    }

    update(time: Time): void {
        const ctx = this.getContext()
        const canvas = this.getCanvas()

        // handle resize
        if (this.laneWidth === 0) {
            this.setupLanes()
        } else {
            const digitSize = 350
            const padding = 20
            const expectedLaneWidth = digitSize + padding
            const expectedLaneCount = Math.floor(canvas.width / expectedLaneWidth)
            if (this.lanes.length !== expectedLaneCount) {
                this.setupLanes()
            }
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height)

        switch (this.state) {
            case "waiting":
                this.drawWaiting()
                break
            case "playing":
                this.updatePlaying(time)
                this.drawGame()
                break
            case "feedback_correct":
            case "feedback_wrong":
                this.updateFeedback(time)
                this.drawGame()
                break
            case "game_over":
                this.drawGameOver()
                break
        }
    }

    // -----------------------
    // PLAYING STATE
    // -----------------------

    private updatePlaying(time: Time) {
        const canvas = this.getCanvas()

        // spawn digits
        this.spawnTimer += time.deltaTime
        if (this.spawnTimer > 0.7) {
            this.spawnTimer = 0
            this.spawnDigit()
        }

        // update positions
        for (const d of this.digits) {
            d.y += d.speed * time.deltaTime
        }

        // remove off screen
        this.digits = this.digits.filter(d => d.y < canvas.height + 50)
    }

    private spawnDigit() {
        if (this.lanes.length === 0) return

        const size = 350
        const half = size / 2

        // choose random lane
        const laneIndex = Math.floor(Math.random() * this.lanes.length)
        const x = this.lanes[laneIndex]

        // check if lane is free near top (avoid stacking)
        const tooClose = this.digits.some(d =>
            Math.abs(d.x - x) < 5 && d.y < size * 1.2
        )

        if (tooClose) return  // skip this spawn cycle

        // Deterministic value spawn from predefined order
        const value = this.spawnOrder[this.spawnOrderIndex]
        this.spawnOrderIndex = (this.spawnOrderIndex + 1) % this.spawnOrder.length

        this.digits.push({
            value,
            x,
            y: -half,
            speed: 80 + Math.random() * 40,
            size
        })
    }


    private setupLanes() {
        const canvas = this.getCanvas()

        const digitSize = 350
        const padding = 20

        // each lane must fit one digit + spacing
        this.laneWidth = digitSize + padding

        const laneCount = Math.floor(canvas.width / this.laneWidth)

        this.lanes = []

        for (let i = 0; i < laneCount; i++) {
            const x = i * this.laneWidth + this.laneWidth / 2
            this.lanes.push(x)
        }
    }



    // -----------------------
    // FEEDBACK
    // -----------------------

    private updateFeedback(time: Time) {
        this.feedbackTimer -= time.deltaTime
        if (this.feedbackTimer <= 0) {
            if (this.state === "feedback_correct") {
                if (this.score >= this.maxRounds) {
                    this.state = "game_over"
                } else {
                    this.startRound()
                }
            } else {
                this.state = "playing"
            }
        }
    }

    // -----------------------
    // RENDERING
    // -----------------------

    private drawWaiting() {
        const ctx = this.getContext()
        const canvas = this.getCanvas()

        ctx.fillStyle = "#222"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        ctx.fillStyle = "white"
        ctx.font = "48px sans-serif"
        ctx.textAlign = "center"

        ctx.fillText("Waiting for connection", canvas.width / 2, canvas.height / 2)
    }

    private drawGame() {
        const ctx = this.getContext()
        const canvas = this.getCanvas()

        if (this.backgroundLoaded) {
            ctx.drawImage(
                this.backgroundImg,
                0,
                0,
                canvas.width,
                canvas.height
            )

            // optional: blur overlay effect
            ctx.fillStyle = "rgba(0,0,0,0.25)"
            ctx.fillRect(0, 0, canvas.width, canvas.height)
        } else {
            ctx.fillStyle = "#000"
            ctx.fillRect(0, 0, canvas.width, canvas.height)
        }


        // top rectangle with math problem
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(canvas.width / 2 - 150, 20, 300, 80)

        ctx.fillStyle = "#000"
        ctx.font = "36px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(`${this.currentA} + ${this.currentB}`, canvas.width / 2, 70)

        // digits raining
        ctx.fillStyle = "white"
        ctx.font = "350px sans-serif"

        ctx.textAlign = "center"
        ctx.textBaseline = "middle"

        for (const d of this.digits) {
            const img = this.digitImages[d.value]
            const canDrawImg = !!(img && (img.complete || (img as any).decode) && img.naturalWidth > 0)
            if (canDrawImg) {
                if (this.currentStyle === "plain") {
                    // Draw using offscreen canvas and tint to solid black via alpha mask
                    const off = document.createElement('canvas')
                    off.width = d.size
                    off.height = d.size
                    const octx = off.getContext('2d')!
                    // draw the image centered into offscreen
                    octx.drawImage(
                        img,
                        0,
                        0,
                        d.size,
                        d.size
                    )
                    // tint to black preserving alpha
                    const prevComp = octx.globalCompositeOperation
                    octx.globalCompositeOperation = 'source-atop'
                    octx.fillStyle = this.plainColorActive ? this.plainColor : '#000'
                    octx.fillRect(0, 0, d.size, d.size)
                    octx.globalCompositeOperation = prevComp

                    // blit to main canvas
                    ctx.drawImage(off, d.x - d.size / 2, d.y - d.size / 2, d.size, d.size)
                } else {
                    // Non-plain: draw as-is
                    ctx.drawImage(
                        img,
                        d.x - d.size / 2,
                        d.y - d.size / 2,
                        d.size,
                        d.size
                    )
                }
            } else {
                // Fallback to drawing text if image is not loaded
                ctx.save()
                ctx.fillStyle = this.currentStyle === 'plain' ? (this.plainColorActive ? this.plainColor : '#000') : ctx.fillStyle
                ctx.fillText(d.value.toString(), d.x, d.y)
                ctx.restore()
            }
        }

        // score
        ctx.font = "24px sans-serif"
        ctx.textAlign = "left"
        ctx.textBaseline = "top"
        ctx.fillText(`Score: ${this.score}`, 20, 20)


        if (this.state === "feedback_wrong") {
            ctx.fillStyle = "rgba(255,0,0,0.3)"
            ctx.fillRect(0, 0, canvas.width, canvas.height)
        }
    }

    private drawGameOver() {
        const ctx = this.getContext()
        const canvas = this.getCanvas()

        ctx.fillStyle = "black"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        ctx.fillStyle = "white"
        ctx.font = "48px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2)

        ctx.font = "32px sans-serif"
        ctx.fillText(`Score: ${this.score}`, canvas.width / 2, canvas.height / 2 + 60)
    }

    // -----------------------
    // INPUT
    // -----------------------

    onClick(x: number, y: number): void {
        switch (this.state) {
            case "waiting":
                // No action
                break

            case "playing":
                this.handleGameClick(x, y)
                break

            case "game_over":
                this.resetGame()
                break
        }
    }

    private handleGameClick(x: number, y: number) {
        for (let i = 0; i < this.digits.length; i++) {
            const d = this.digits[i]

            const half = d.size / 2

            if (
                x >= d.x - half &&
                x <= d.x + half &&
                y >= d.y - half &&
                y <= d.y + half
            ) {
                if (d.value === this.answer) {
                    this.score++
                    this.digits = []
                    this.state = "feedback_correct"
                    this.feedbackTimer = 1.5

                    const utter = new SpeechSynthesisUtterance(
                        `Good job!`
                    )
                    speechSynthesis.speak(utter)

                } else {
                    const utter = new SpeechSynthesisUtterance(
                        `WRONG`
                    )
                    speechSynthesis.speak(utter)
                    this.digits.splice(i, 1)
                    this.state = "feedback_wrong"
                    this.feedbackTimer = 0.5
                }
                return
            }
        }
    }

}
