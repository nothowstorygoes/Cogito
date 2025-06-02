import TitleBar from "../components/TitleBar";
import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../components/themeProvider";

function formatTime(totalSeconds) {
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
}

export default function Session() {
    const navigate = useNavigate();
    const location = useLocation();
    const [seconds, setSeconds] = useState(0);
    const [running, setRunning] = useState(false);
    const intervalRef = useRef(null);
    const { dark } = useTheme();

    // Recupera info integrazione e examName da location.state (passato da Today)
    const integrationOn = location.state?.integrationOn || false;
    const examName = location.state?.examName || null;

    useEffect(() => {
        if (running) {
            intervalRef.current = setInterval(() => {
                setSeconds(prev => prev + 1);
            }, 1000);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        return () => clearInterval(intervalRef.current);
    }, [running]);

    const handleStart = () => setRunning(true);
    const handlePause = () => setRunning(false);

    const handleFinish = () => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.ceil((seconds % 3600) / 60);
        let result;
        if (integrationOn && examName) {
            result = {
                time: { hours, minutes },
                exam: examName
            };
        } else {
            result = hours > 0 ? { hours, minutes } : { minutes };
        }
        window.electron.send('renderer-log', "About to send session-result", result);
        window.electron.send("session-result", result);
        window.electron.send("close-session");
        navigate("/today");
    };

    return (
        <main className={`w-screen h-screen flex flex-col items-center justify-center transition-colors duration-300 ${dark ? "bg-[#181825]" : "bg-[#D2D6EF]"}`}>
            <TitleBar />
            <div className={`text-3xl font-bold ${dark ? "text-[#D2D6EF]" : "text-[#6331c9]"}`}>{formatTime(seconds)}</div>
            <div className="flex flex-row gap-x-3 mt-4 justify-center items-center">
                {!running && (
                    <button
                        className="cursor-pointer"
                        onClick={handleStart}
                        // Se integrazione attiva ma examName non passato, disabilita
                        disabled={integrationOn && !examName}
                    >
                        <svg width="40" height="40" viewBox="0 0 24 24" fill={dark ? "#D2D6EF" : "#6331c9"}>
                            <polygon points="10,8 18,12 10,16" fill={dark ? "#D2D6EF" : "#6331c9"} />
                        </svg>
                    </button>
                )}
                {running && (
                    <button className="cursor-pointer" onClick={handlePause}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill={dark ? "#D2D6EF" : "#6331c9"}>
                            <rect x="8" y="8" width="3" height="8" fill={dark ? "#D2D6EF" : "#6331c9"} />
                            <rect x="13" y="8" width="3" height="8" fill={dark ? "#D2D6EF" : "#6331c9"} />
                        </svg>
                    </button>
                )}
                <button className="mb-1 cursor-pointer" onClick={handleFinish} disabled={seconds === 0}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                        <polyline points="7,13 11,17 17,9" fill="none" stroke={dark ? "#D2D6EF" : "#6331c9"} strokeWidth="2" />
                    </svg>
                </button>
            </div>
        </main>
    );
}