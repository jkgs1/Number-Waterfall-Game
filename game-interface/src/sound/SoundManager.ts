export class SoundManager {
    private correct = new Audio("/sounds/correct.mp3")
    private wrong = new Audio("/sounds/wrong.mp3")
    private click = new Audio("/sounds/click.mp3")

    constructor() {
        // preload
        this.correct.load()
        this.wrong.load()
        this.click.load()

        // small volume adjustments (optional)
        this.correct.volume = 0.5
        this.wrong.volume = 0.6
        this.click.volume = 0.4
    }

    playCorrect() {
        this.play(this.correct)
    }

    playWrong() {
        this.play(this.wrong)
    }

    playClick() {
        this.play(this.click)
    }

    private play(audio: HTMLAudioElement) {
        audio.currentTime = 0
        audio.play().catch(() => {
            // prevents crash if user hasn't interacted yet
        })
    }
}
