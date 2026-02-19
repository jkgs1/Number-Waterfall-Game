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
    private roundsPlayed = 0
    private maxRounds = 10

    private feedbackTimer = 0

    private lanes: number[] = []
    private laneWidth = 0



    start(): void {
        this.backgroundImg.src = waterfall
        this.backgroundImg.onload = () => {
            this.backgroundLoaded = true
        }
        this.resetGame()
    }

    public externalStart(rounds: number) {
        this.maxRounds = rounds
        this.score = 0
        this.roundsPlayed = 0
        this.digits = []
        this.startRound()
        console.log(`Game started with ${this.maxRounds} rounds`)
    }

    public externalStop() {
        this.resetGame()
    }

    private resetGame() {
        this.state = "waiting"
        this.score = 0
        this.roundsPlayed = 0
        this.digits = []
    }

    private startRound() {
        this.generateProblem()
        this.digits = []
        this.spawnTimer = 0
        this.state = "playing"
        this.readProblem()
    }

    private generateProblem() {
        this.currentA = Math.floor(Math.random() * 10)
        this.currentB = Math.floor(Math.random() * 10)
        this.answer = this.currentA + this.currentB

        // keep <= 10 for now
        if (this.answer > 10) {
            this.generateProblem()
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
            const digitSize = 132
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

        const size = 132
        const half = size / 2

        // choose random lane
        const laneIndex = Math.floor(Math.random() * this.lanes.length)
        const x = this.lanes[laneIndex]

        // check if lane is free near top (avoid stacking)
        const tooClose = this.digits.some(d =>
            Math.abs(d.x - x) < 5 && d.y < size * 1.5
        )

        if (tooClose) return  // skip this spawn cycle

        const value = Math.floor(Math.random() * 10) + 1

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

        const digitSize = 132
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
            this.roundsPlayed++
            if (this.roundsPlayed >= this.maxRounds) {
                this.state = "game_over"
            } else {
                if (this.state === "feedback_correct") {
                    this.startRound()
                } else {
                    this.state = "playing"
                }
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
        ctx.font = "132px sans-serif"

        ctx.textAlign = "center"
        ctx.textBaseline = "middle"

        for (const d of this.digits) {
            ctx.fillText(d.value.toString(), d.x, d.y)
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
