type GameProps = {
    backgroundSrc: string;
};

export abstract class Game {
    private props: GameProps;
    private canvas: HTMLCanvasElement
    private ctx: CanvasRenderingContext2D

    constructor(canvas: HTMLCanvasElement, props: GameProps) {
        this.props = props;
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d")!
    }

    getProps() {
        return this.props;
    }

    getCanvas() {
        return this.canvas
    }

    getContext() {
        return this.ctx
    }

    /**
     * Run on the first frame
     */
    abstract start(): void

    /**
     * Run once every frame
     * @param time Contains time since last frame
     */
    abstract update(time: Time): void

    abstract onClick(x: number, y: number): void
}

export class Time {
    /**
     * Total time since frame 0 in seconds
     */
    time: number = 0

    /**
     * Time since last frame in seconds
     */
    deltaTime: number = 0

    private start: number | null = null
    private last: number = 0;

    update(timestamp: number) {
        if(this.start === null) {
            this.start = timestamp;
        }

        this.time = (timestamp - this.start) / 1000;
        this.deltaTime = (timestamp - this.last) / 1000;
        this.last = timestamp;
    }
}