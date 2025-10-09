import React, { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import TitleBar from "../components/TitleBar";
import { useNavigate } from "react-router-dom";

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

export default function ExamStatistics() {
  const [loading, setLoading] = useState(true);
  const [examData, setExamData] = useState([]);
  const [selectedExamName, setSelectedExamName] = useState(null);
  const navigate = useNavigate();
  const primary = (typeof window !== 'undefined')
    ? getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#6331c9'
    : '#6331c9';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const logger = await window.electron.invoke("get-logger-data");
        if (!Array.isArray(logger)) {
          setExamData([]);
          setLoading(false);
          return;
        }

        // { [examName]: { [date]: totalTime } }
        const examMap = {};

        logger.forEach((entry) => {
          const date = entry.date;
          if (!Array.isArray(entry.sessions)) return;
          entry.sessions.forEach((session) => {
            if (session && typeof session === "object" && session.exam) {
              const exam = session.exam;
              const time = session.time || 0;
              if (!examMap[exam]) examMap[exam] = {};
              if (!examMap[exam][date]) examMap[exam][date] = 0;
              examMap[exam][date] += time;
            }
          });
        });

        // Trasforma in array [{name, sessions: [{date, time (in ore)}], total}]
        const dataset = Object.entries(examMap).map(([name, dateObj]) => {
          const sessions = Object.entries(dateObj).map(([date, time]) => ({
            date,
            time: time / 60, // in ore
          }));
          const total = Object.values(dateObj).reduce((acc, t) => acc + t, 0); // totale in minuti
          return { name, sessions, total };
        });

        // Inverte l'array per mostrare gli esami in ordine inverso
        const reversed = dataset.reverse();
        setExamData(reversed);
        if (reversed.length > 0) {
          setSelectedExamName(reversed[0].name);
        }
      } catch (err) {
        setExamData([]);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Chart options
  const getChartData = (sessions, examName) => {
    // Ordina per data crescente
    const sorted = [...sessions].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
    return {
      labels: sorted.map((s) => s.date),
      datasets: [
        {
          label: examName,
          data: sorted.map((s) => s.time),
          fill: true,
          backgroundColor: primary + '33', // ~20% opacity
          borderColor: primary,
          tension: 0.4,
        },
      ],
    };
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.parsed.y} `,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 6,
        ticks: {
          color: primary,
          callback: (value) => `${value} `,
          stepSize: 1,
        },
      },
      x: {
        display: false, // nasconde le etichette asse X
      },
    },
  };

  return (
    <main className={`w-screen h-screen flex flex-col items-center transition-colors duration-300 bg-secondary`}>
      <TitleBar />
      <div className="w-full flex flex-row justify-between items-center px-10 mt-10">
        <h2 className={`text-2xl font-semibold text-primary`}>
          Exam Statistics
        </h2>
        <button
          onClick={() => navigate("/inDepth")}
          className={`rounded-2xl w-35 h-10 transition-all duration-300 cursor-pointer bg-primary text-secondary font-semibold hover:opacity-90 hover:w-40` }
        >
          Go Back
        </button>
      </div>
      {loading ? (
        <h2 className={`mt-10 text-xl text-primary`}>
          Loading...
        </h2>
      ) : examData.length === 0 ? (
        <p className={`mt-10 text-lg text-primary`}>
          No exam sessions found.
        </p>
      ) : (
        <div className="flex flex-col gap-4 w-full px-10 mt-6">
          {selectedExamName ? (
            (() => {
              const selected = examData.find((e) => e.name === selectedExamName) || examData[0];
              return (
                <div className="w-[80%] mx-auto">
                  <h3 className={`mb-2 text-xl font-semibold text-primary`}>
                    {selected.name}
                  </h3>
                  <Line data={getChartData(selected.sessions, selected.name)} options={options} />
                  <div className={`mt-4 text-center text-lg text-primary`}>
                    For <span className="font-semibold">{selected.name}</span> you spent a total of <span className="font-semibold">{(selected.total / 60).toFixed(2)} hours</span>!
                  </div>
                </div>
              );
            })()
          ) : null}

          {/* Exam filter buttons */}
          <div className="w-[80%] mx-auto mt-6 flex flex-wrap gap-3 justify-center">
            {examData.map((exam) => {
              const active = exam.name === selectedExamName;
              return (
                <button
                  key={exam.name}
                  onClick={() => setSelectedExamName(exam.name)}
                  className={`px-4 h-10 rounded-2xl cursor-pointer font-semibold transition-all duration-200 border 
                    ${active ? 'bg-primary text-secondary border-primary' : 'bg-secondary text-primary border-primary hover:bg-primary-weak'}`}
                  title={exam.name}
                >
                  {exam.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
      
    </main>
  );
}