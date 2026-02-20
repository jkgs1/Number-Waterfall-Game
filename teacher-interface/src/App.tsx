import { useState } from "react";
import "./App.css";
import { useSocket } from "./socket/useSocket";
import { delay } from "./util/delay";

function App() {

    const [rounds, setRounds] = useState(1)
    const [startDisabled, setStartDisabled] = useState(false)
    const [stopDisabled, setStopDisabled] = useState(false)

    const [numberSet, setNumberSet] = useState("animals")

    const socket = useSocket({
        "connect": () => {
            socket.emit("join", "teacher")
            console.log("Connected to WS")
        }
    })


    async function start() {
        setStartDisabled(true)
        socket.emit("start", {
            rounds,
            numberType: numberSet, 
        })
        await delay(500)
        setStartDisabled(false)
    }

    async function stop() {
        setStopDisabled(true)
        socket.emit("stop")
        await delay(500)
        setStopDisabled(false)
    }
    
    return (
    <>
        <div className="container">
            <h1>Inställningar</h1>
            <div className="settings">

                <label>
                    <span>Antal Rundor</span>
                    <input type="number" className="rounds" value={rounds} onChange={e => setRounds(+e.target.value)}/>
                </label>

                <label>
                    <span>Siffror-set</span>
                    <select className="select" value={numberSet} onChange={e => setNumberSet(e.target.value)}>
                        <option value="animals">Dinosaurier</option>
                        <option value="colored">Färger</option>
                        <option value="plain">Vanliga</option>
                    </select>
                </label>

                <label>
                    <button onClick={start} className="start" disabled={startDisabled}>Start</button>
                </label>
                
                <label>
                    <button onClick={stop} className="stop" disabled={stopDisabled}>Stopp</button>
                </label>
            </div>
        </div>
    </>
    );
}

export default App;
