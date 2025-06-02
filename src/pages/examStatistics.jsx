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
import { useTheme } from "../components/themeProvider";

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
  const navigate = useNavigate();
  const { dark } = useTheme();

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

        setExamData(dataset);
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
          backgroundColor: dark
            ? "rgba(210,214,239,0.2)"
            : "rgba(99,49,201,0.2)",
          borderColor: dark ? "#D2D6EF" : "#6331c9",
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
          color: dark ? "#D2D6EF" : "#6331c9",
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
    <main
      className={`w-screen h-screen flex flex-col items-center transition-colors duration-300 ${
        dark ? "bg-[#181825]" : "bg-[#D2D6EF]"
      }`}
    >
      <TitleBar />
      <div className="w-full flex flex-row justify-between items-center px-10 mt-10">
        <h2
          className={`text-2xl font-bold ${
            dark ? "text-[#D2D6EF]" : "text-[#6331c9]"
          }`}
        >
          Exam Statistics
        </h2>
        <button
          onClick={() => navigate("/inDepth")}
          className={`rounded-2xl w-35 h-10 transition-all duration-300 cursor-pointer
            ${
              dark
                ? "bg-[#D2D6EF] text-[#181825] font-semibold border border-[#D2D6EF] hover:bg-[#b8bce0]"
                : "bg-[#6331c9] text-white hover:bg-[#4b2496]"
            } hover:w-40` }
        >
          Go Back
        </button>
      </div>
      {loading ? (
        <h2
          className={`mt-10 text-xl ${
            dark ? "text-[#D2D6EF]" : "text-[#6331c9]"
          }`}
        >
          Loading...
        </h2>
      ) : examData.length === 0 ? (
        <p
          className={`mt-10 text-lg ${
            dark ? "text-[#D2D6EF]" : "text-[#6331c9]"
          }`}
        >
          No exam sessions found.
        </p>
      ) : (
        <div
          className="flex flex-col gap-20 w-full px-10 mt-4 overflow-y-auto custom-scrollbar"
          style={{ maxHeight: "80vh" }}
        >
          {examData.map((exam, idx) => (
            <div key={exam.name} className="w-[80%] mx-auto">
              <h3
                className={`mb-2 text-xl font-semibold ${
                  dark ? "text-[#D2D6EF]" : "text-[#6331c9]"
                }`}
              >
                {exam.name}
              </h3>
              <Line
                data={getChartData(exam.sessions, exam.name)}
                options={options}
              />
              <div className={`mt-4 mb-10 text-center text-lg ${dark ? "text-[#D2D6EF]" : "text-[#6331c9]"}`}>
                For <span className="font-bold">{exam.name}</span> you spent a total of <span className="font-bold">{(exam.total / 60).toFixed(2)} hours</span>!
              </div>
            </div>
          ))}
          <style>
  {`
    .custom-scrollbar {
      scrollbar-width: thin;
      margin-right: 20px;
      scrollbar-color: ${dark ? "#D2D6EF #181825" : "#6331c9 #D2D6EF"};
    }
    .custom-scrollbar::-webkit-scrollbar {
      width: 8px;
      background: ${dark ? "#181825" : "#D2D6EF"};
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: ${dark ? "#D2D6EF" : "#6331c9"};
      border-radius: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: ${dark ? "#b8bce0" : "#4b2496"};
    }
  `}
</style>
        </div>
      )}
      
    </main>
  );
}