import TitleBar from "../components/TitleBar";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../components/themeProvider";

function formatTime(totalSeconds) {
    // Controllo di sicurezza per evitare NaN
    if (isNaN(totalSeconds) || totalSeconds < 0) {
        totalSeconds = 0;
    }
    
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
    const { dark } = useTheme();

    // Recupera info integrazione e examName da location.state (passato da Today)
    const integrationOn = location.state?.integrationOn || false;
    const examName = location.state?.examName || null;

    useEffect(() => {
        // Recupera il tempo corrente dal main process all'inizio
        window.electron.timerGetSeconds().then(initialSeconds => {
            // Controllo di sicurezza per evitare NaN
            const safeSeconds = isNaN(initialSeconds) || initialSeconds < 0 ? 0 : initialSeconds;
            setSeconds(safeSeconds);
        });
        
        // Ascolta gli aggiornamenti del timer dal main process
        const handleTimerUpdate = (currentSeconds) => {
            // Controllo di sicurezza per evitare NaN
            const safeSeconds = isNaN(currentSeconds) || currentSeconds < 0 ? 0 : currentSeconds;
            setSeconds(safeSeconds);
        };
        window.electron.onTimerUpdate(handleTimerUpdate);
        
        return () => {
            window.electron.removeListener('timer-update', handleTimerUpdate);
        };
    }, []);

    const handleStart = () => {
        setRunning(true);
        window.electron.timerStart();
    };
    
    const handlePause = () => {
        setRunning(false);
        window.electron.timerPause();
    };

    const handleFinish = async () => {
        // Prima ottieni il tempo corrente dal main process
        const currentSeconds = await window.electron.timerGetSeconds();
        
        const hours = Math.floor(currentSeconds / 3600);
        const minutes = Math.ceil((currentSeconds % 3600) / 60);
        
        // Usa sempre lo stesso formato per la struttura time
        let result = {
            time: { hours, minutes }
        };
        
        // Aggiungi exam solo se integrazione è attiva e examName è presente
        if (integrationOn && examName) {
            result.exam = examName;
        }
        
        // Reset del timer nel main process DOPO aver calcolato il risultato
        window.electron.timerReset();
        
        window.electron.send('renderer-log', "About to send session-result", result);
        window.electron.send("session-result", result);
        window.electron.send("close-session");
        navigate("/today");
    };

    return (
        <main className={`w-screen h-screen flex flex-col items-center justify-center transition-colors duration-300 ${dark ? "bg-[#181825]" : "bg-[#D2D6EF]"}`}>
            <TitleBar />
            <div className={`mt-6 text-3xl font-bold ${dark ? "text-[#D2D6EF]" : "text-[#6331c9]"}`}>{formatTime(seconds)}</div>
            <div className="flex flex-row gap-x-3 mt-4 justify-center items-center">
                {!running && (
                    <button
                        className="cursor-pointer"
                        onClick={handleStart}
                        // Se integrazione attiva ma examName non passato, disabilita
                        disabled={integrationOn && !examName}
                    >
                        <svg width="30" height="30" viewBox="0 0 24 24" fill={dark ? "#D2D6EF" : "#6331c9"}>
                            <polygon points="10,8 18,12 10,16" fill={dark ? "#D2D6EF" : "#6331c9"} />
                        </svg>
                    </button>
                )}
                {running && (
                    <button className="cursor-pointer" onClick={handlePause}>
                        <svg width="30" height="30" viewBox="0 0 24 24" fill={dark ? "#D2D6EF" : "#6331c9"}>
                            <rect x="8" y="8" width="3" height="8" fill={dark ? "#D2D6EF" : "#6331c9"} />
                            <rect x="13" y="8" width="3" height="8" fill={dark ? "#D2D6EF" : "#6331c9"} />
                        </svg>
                    </button>
                )}
                <button className="mb-1 cursor-pointer" onClick={handleFinish}>
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
                        <polyline points="7,13 11,17 17,9" fill="none" stroke={dark ? "#D2D6EF" : "#6331c9"} strokeWidth="2" />
                    </svg>
                </button>
            </div>
        </main>
    );
}