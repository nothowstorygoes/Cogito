import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TitleBar from "../components/TitleBar";
import Star from "../components/star";
import { CircularProgressbar } from "react-circular-progressbar";
import Spinner from "../components/Spinner";
import { useTheme } from "../components/themeProvider";
import { DropDownListComponent } from "@syncfusion/ej2-react-dropdowns";
import "@syncfusion/ej2-base/styles/material.css";
import "@syncfusion/ej2-react-dropdowns/styles/material.css";

export default function Today() {
  const navigate = useNavigate();
  const [todayData, setTodayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [integrationOn, setIntegrationOn] = useState(false);
  const [examList, setExamList] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [goalHours, setGoalHours] = useState(0); // Default goal hours

  const { dark } = useTheme();

  // Helper to get today's date string (first 5 chars)
  const getTodayShort = () => new Date().toLocaleDateString().slice(0, 5);

  // Unified function: process result, update logger, update state
  const processAndSaveSessionResult = async (result) => {
    if (!result) return;
    const todayShort = getTodayShort();
    const res = await window.electron.invoke("get-logger-data");
    const resUser = await window.electron.invoke("get-onboarding-data");
    let dataArr = Array.isArray(res) ? res : [];
    let userData = resUser ? resUser : {};

    // Find or create today's entry
    let todayEntry = dataArr.find(
      (entry) => entry.date && entry.date.slice(0, 5) === todayShort
    );
    if (!todayEntry) {
      todayEntry = {
        date: todayShort,
        time: 0,
        stars: 0,
        sessions: [],
      };
      dataArr.push(todayEntry);
    }

    // Calculate session minutes from result
    let sessionMinutes = 0;
    if (result.time && typeof result.time === "object") {
      if (result.time.hours) sessionMinutes += result.time.hours * 60;
      if (result.time.minutes) sessionMinutes += result.time.minutes;
    }
    // Fallback per il formato precedente (se mai dovesse servire)
    else {
      if (result.hours) sessionMinutes += result.hours * 60;
    }
    // 1. Add result to grandTotal on onboarding data (convert minutes to hours)
    userData.grandTotal = Number(userData.grandTotal) + sessionMinutes;

    // 2. Add to today time the result
    todayEntry.time += sessionMinutes;

    // 3. Calculate stars for today
    const previousStars = todayEntry.stars || 0;
    if (todayEntry.time >= 150 && todayEntry.time < 200) {
      todayEntry.stars = 1;
    } else if (todayEntry.time >= 200 && todayEntry.time < 300) {
      todayEntry.stars = 2;
    } else if (todayEntry.time >= 300) {
      todayEntry.stars = 3;
      if (previousStars < 3) {
        userData.goalReached = (userData.goalReached || 0) + 1;
      }
    }

    // 4. Add new stars to allStars (only the difference, no repetitions)
    const newStarsEarned = Math.max(0, todayEntry.stars - previousStars);
    userData.allStars = (userData.allStars || 0) + newStarsEarned;

    // 5. Prepend to the start of the array of sessions, then slice to keep max 3
    if (result.exam) {
      todayEntry.sessions = [
        { time: sessionMinutes, exam: result.exam },
        ...todayEntry.sessions,
      ];
    } else {
      todayEntry.sessions = [sessionMinutes, ...todayEntry.sessions].slice(
        0,
        3
      );
    }

    // 6. Save to files
    await window.electron.invoke("set-onboarding-data", userData);

    // Update today's entry in logger data
    const idx = dataArr.findIndex(
      (entry) => entry.date && entry.date.slice(0, 5) === todayShort
    );
    if (idx !== -1) {
      dataArr[idx] = todayEntry;
    } else {
      dataArr.push(todayEntry);
    }
    await window.electron.invoke("set-logger-data", dataArr);
    setTodayData({ ...todayEntry });
  };

  useEffect(() => {
    window.electron.invoke("get-onboarding-data").then((res) => {
      setGoalHours(res?.hours || 0);
    });
  });

  useEffect(() => {
    window.electron.invoke("check-exam-integration").then(setIntegrationOn);
  }, []);

  // Carica la lista esami se integrazione attiva
  useEffect(() => {
    if (integrationOn) {
      window.electron.invoke("get-exam-integration-list").then((list) => {
        setExamList(Array.isArray(list) ? list : []);
      });
    } else {
      setExamList([]);
      setSelectedExam(null);
    }
  }, [integrationOn]);

  // Initial load
  useEffect(() => {
    const todayShort = getTodayShort();
    window.electron.invoke("get-logger-data").then((res) => {
      let dataArr = Array.isArray(res) ? res : [];
      let todayEntry = dataArr.find(
        (entry) => entry.date && entry.date.slice(0, 5) === todayShort
      );
      if (!todayEntry) {
        todayEntry = {
          date: todayShort,
          time: 0,
          stars: 0,
          sessions: [],
        };
        dataArr.push(todayEntry);
        window.electron.invoke("set-logger-data", dataArr).then(() => {
          setTodayData(todayEntry);
          setLoading(false);
        });
      } else {
        setTodayData(todayEntry);
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    window.electron.send("renderer-ready");
  }, []);

  // Handle session result
  useEffect(() => {
    const handleSessionResult = (result) => {
      processAndSaveSessionResult(result);
      window.electron.send("result", result);
    };
    window.electron.receive("session-result", handleSessionResult);
    return () =>
      window.electron.removeListener("session-result", handleSessionResult);
  }, []);

  return (
    <main
      className={`w-screen h-screen overflow-hidden flex flex-col items-center justify-center transition-colors duration-300 ${
        dark ? "bg-[#181825]" : "bg-[#D2D6EF]"
      }`}
    >
      {loading || !todayData ? (
        <Spinner />
      ) : (
        <>
          <TitleBar />
          <div
            className={`text-xl flex flex-row p-10 justify-between items-center w-full ${
              dark ? "text-[#D2D6EF]" : "text-[#6331c9]"
            } ${integrationOn ? "-mt-2" : "-mt-10"}`}
          >
            <h2>Today</h2>
            <p>{todayData.date}</p>
          </div>
          <div
            className={`flex flex-row items-center absolute left-9 ${
              integrationOn ? "top-21" : "top-27 "
            }`}
          >
            <Star achieved />
            <p
              className={`text-xl ml-2 font-bold ${
                dark ? "text-[#D2D6EF]" : "text-[#6331c9]"
              }`}
            >
              {todayData.stars}/3
            </p>
          </div>
          <div className="w-40 h-40 flex justify-center items-center mx-auto mb-4">
            <CircularProgressbar
              className={dark ? "text-[#D2D6EF]" : "text-[#6331c9]"}
              value={todayData.time}
              maxValue={goalHours * 60} // Convert goal hours to minutes
              text={`${Math.round((todayData.time / (goalHours*60)) * 100)}%`}
              styles={{
                path: {
                  strokeWidth: "8",
                  stroke: dark ? "#D2D6EF" : "#6331c9",
                  strokeLinecap: "round",
                },
                text: {
                  fill: dark ? "#D2D6EF" : "#6331c9",
                  fontSize: "20px",
                  fontWeight: "bold",
                  dominantBaseline: "central",
                  textAnchor: "middle",
                },
              }}
            />
          </div>
          <div
            className={`absolute right-10 gap-y-4 flex flex-col items-center ${
              integrationOn ? "top-25" : "top-35"
            }`}
          >
            <Star achieved={todayData.stars >= 1} />
            <Star achieved={todayData.stars >= 2} />
            <Star achieved={todayData.stars >= 3} />
          </div>
          {/* Dropdown per la scelta dell'esame se integrazione attiva */}
          {integrationOn && (
            <div className="mb-2">
              <DropDownListComponent
                dataSource={examList}
                fields={{ text: "name", value: "name" }}
                value={selectedExam ? selectedExam.name : ""}
                placeholder="-- Select --"
                className={`bg-white dark:bg-[#181825] text-[#181825] dark:text-[#D2D6EF] rounded-4xl px-4 py-2 border dark:border-[#D2D6EF] border-[#6331c9]`}
                change={(e) => {
                  const exam = examList.find((ex) => ex.name === e.value);
                  setSelectedExam(exam || null);
                }}
                popupHeight="220px"
              />
              <style>
                {`
    .e-ddl input::placeholder,
    .e-ddl .e-placeholder {
      color: #6331c9 !important; /* light mode placeholder */
      opacity: 1 !important;
    }
    .dark .e-ddl input::placeholder,
    .dark .e-ddl .e-placeholder {
      color: #D2D6EF !important; /* dark mode placeholder */
      opacity: 1 !important;
    }
    .e-ddl .e-input-group-icon.e-ddl-icon {
      display: none !important;
    }
  `}
              </style>
            </div>
          )}
          <div className="w-full flex justify-center items-center">
            <button
              className={`cursor-pointer rounded-4xl w-50 h-12 font-bold transition-all duration-500 hover:w-75
                            ${
                              dark
                                ? "bg-[#D2D6EF] text-[#181825] hover:bg-[#b8bce0]"
                                : "bg-[#6331c9] font-semibold text-white hover:bg-[#4b2496]"
                            }`}
              onClick={() => {
                navigate("/session", {
                  state: {
                    integrationOn,
                    examName: selectedExam ? selectedExam.name : null,
                  },
                });
                setTimeout(() => {
                  window.electron.send("resize-for-session");
                }, 0);
              }}
              disabled={integrationOn && !selectedExam}
            >
              Open new session
            </button>
          </div>
          <div
            className={`flex flex-row items-start w-full p-10 -mt-3 ${
              dark ? "text-[#D2D6EF]" : "text-[#6331c9]"
            }`}
          >
            <div className="flex flex-col">
              <p>
                Your sessions <br /> so far{" "}
              </p>
              {todayData.sessions.length > 0 ? (
                todayData.sessions.slice(0, 3).map((session, index) => (
                  <div key={index} className="flex flex-row items-center mt-2">
                    <p
                      className={`text-xl ${
                        dark ? "text-[#D2D6EF]" : "text-[#6331c9]"
                      } ${session.time > 60 ? "font-bold" : ""}`}
                    >
                      {session.exam
                        ? `${session.time} min`
                        : `${session.time || session} min`}
                    </p>
                  </div>
                ))
              ) : (
                <p className="font-bold">
                  <br />
                  No sessions yet
                </p>
              )}
            </div>
            <div className="flex flex-col ml-48 items-center text-center">
              <p className="text-center"> Total</p>
              <p
                className={`text-xl ml-2 font-bold ${
                  dark ? "text-[#D2D6EF]" : "text-[#6331c9]"
                }`}
              >
                {(todayData.time / 60).toFixed(2)}h
              </p>
            </div>
            <button
              className={`absolute top-117 right-10 w-25 h-10 mt-10 rounded-2xl cursor-pointer transition-all duration-300 hover:h-15
                            ${
                              dark
                                ? "bg-[#D2D6EF] text-[#181825] hover:bg-[#b8bce0] font-semibold"
                                : "bg-[#6331c9] text-white hover:bg-[#4b2496]"
                            }`}
              onClick={() => navigate("/home")}
            >
              Go Back
            </button>
          </div>
        </>
      )}
    </main>
  );
}
