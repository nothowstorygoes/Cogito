import TitleBar from "../components/TitleBar";
import { useEffect, useState } from "react";
import { Line } from 'react-chartjs-2';
import { useNavigate } from "react-router-dom";
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend } from 'chart.js';
import { useTheme } from "../components/themeProvider";

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function InDepth() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const navigate = useNavigate();
    const { dark } = useTheme();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const stats = await window.electron.invoke("get-logger-data");
                setData(stats);
            } catch (error) {
                console.error("Error fetching in-depth data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Prepara i dati per il grafico
    let chartData = null;
    let maxTime = 0;
    let maxDate = "";
    let totalMinutes = 0;
    let daysSpent = 0;
    let aboveAveragePercent = 0;

    if (data && Array.isArray(data) && data.length > 0) {
        const labels = data.map(entry => entry.date || "");
        const values = data.map(entry => (entry.time / 60));
        chartData = {
            labels,
            datasets: [
                {
                    label: "Time",
                    data: values,
                    fill: true,
                    backgroundColor: dark ? "rgba(210,214,239,0.2)" : "rgba(99,49,201,0.2)",
                    borderColor: dark ? "#D2D6EF" : "#6331c9",
                    tension: 0.4,
                }
            ]
        };

        // Trova il giorno con più tempo
        let maxEntry = data.reduce((prev, curr) => (curr.time > prev.time ? curr : prev), data[0]);
        maxTime = (maxEntry.time / 60).toFixed(2); // in ore
        maxDate = maxEntry.date;

        // Calcola giorni totali spesi (minuti / 60 / 24)
        totalMinutes = data.reduce((sum, entry) => sum + entry.time, 0);
        daysSpent = (totalMinutes / 60 / 24).toFixed(2);

        // Calcola la media giornaliera in minuti
        const avgTime = totalMinutes / data.length;

        // Calcola la percentuale di giorni sopra la media
        const daysAboveAvg = data.filter(entry => entry.time > avgTime).length;
        aboveAveragePercent = ((daysAboveAvg / data.length) * 100).toFixed(1);
    }

    const options = {
        responsive: true,
        plugins: {
            legend: { display: false },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    color: dark ? "#D2D6EF" : "#6331c9"
                }
            },
            x: {
                ticks: {
                    color: dark ? "#D2D6EF" : "#6331c9",
                    display: false
                }
            }
        }
    };

    return (
        <main className={`w-screen h-screen flex flex-col items-center transition-colors duration-300 ${dark ? "bg-[#181825]" : "bg-[#D2D6EF]"}`}>
            <TitleBar />
            {loading ? (
                <h2 className={`mt-10 text-xl ${dark ? "text-[#D2D6EF]" : "text-[#6331c9]"}`}>Loading...</h2>
            ) : (
                <div className={`mt-10 text-xl flex flex-col justify-center items-center ${dark ? "text-[#D2D6EF]" : "text-[#6331c9]"}`}>
                    <h2 className="font-bold">In Depth</h2>
                    <p className="text-center w-100 text-sm mt-5">The graph reflects your performance across all time.</p>
                    <div className="w-110 h-50 px-6 flex items-center justify-center">
                        {chartData ? (
                            <Line data={chartData} options={options} />
                        ) : (
                            <p>No data available</p>
                        )}
                    </div>
                    <p className={`mt-4 text-base w-full px-12 ${dark ? "text-[#D2D6EF]" : "text-[#6331c9]"}`}>
                        On the <b>{maxDate}</b> you recorded <br/> your longest session! &nbsp; <b>({maxTime}h)</b><br />
                        <br/>
                        You spent a total of <b>{daysSpent} days</b> <br/>focusing on what's important to you.<br /><br/>
                        <b>{aboveAveragePercent}%</b> of your sessions were above average.<br/>
                    </p>
                </div>
            )}
            <button
                onClick={() => navigate("/statistics")}
                className={`absolute top-132 right-10 w-30 h-10 rounded-2xl transition-all duration-300 cursor-pointer
                    ${dark
                        ? "bg-[#D2D6EF] text-[#181825] border border-[#D2D6EF] hover:bg-[#b8bce0]"
                        : "bg-[#6331c9] text-white hover:bg-[#4b2496]"
                    } hover:w-45`}
            >
                Go Back
            </button>
        </main>
    )
}