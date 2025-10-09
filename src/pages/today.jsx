import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TitleBar from "../components/TitleBar";
import Star from "../components/star";
import { CircularProgressbar } from "react-circular-progressbar";
import Spinner from "../components/Spinner";
// Theme via CSS variables
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
  const [showManualLogPopup, setShowManualLogPopup] = useState(false);
  const [manualMinutes, setManualMinutes] = useState("");

  

  // Helper to get today's date string (first 5 chars)
  const getTodayShort = () => new Date().toLocaleDateString().slice(0, 5);

  // Manual logging function
  const handleManualLog = () => {
    const minutes = parseInt(manualMinutes);
    if (isNaN(minutes) || minutes <= 0) {
      alert("Please enter a valid number of minutes");
      return;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    // Create result object in the same format as session
    const result = {
      time: { hours, minutes: remainingMinutes },
    };

    // Add exam if integration is on and exam is selected
    if (integrationOn && selectedExam) {
      result.exam = selectedExam.name;
    }

    // Use the same function as session end
    processAndSaveSessionResult(result);

    // Close popup and reset
    setShowManualLogPopup(false);
    setManualMinutes("");
  };

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

    // 3. Calculate stars for today (base + bonus over-goal)
    const previousStars = todayEntry.stars || 0;
    let baseStars = 0;
    if (todayEntry.time >= 150 && todayEntry.time < 200) {
      baseStars = 1;
    } else if (todayEntry.time >= 200 && todayEntry.time < 300) {
      baseStars = 2;
    } else if (todayEntry.time >= 300) {
      baseStars = 3;
    }

    // Bonus stars: +1 per +20% over the goal (only if goal is set)
    const goalMinutes = Number(userData?.hours || 0) * 60;
    let bonusStars = 0;
    if (goalMinutes > 0) {
      const progressRatio = todayEntry.time / goalMinutes;
      if (progressRatio > 1) {
        bonusStars = Math.floor((progressRatio - 1) / 0.2);
      }
    }

    todayEntry.stars = baseStars + bonusStars;

    // Count goalReached the first time the user hits 3 base stars
    if (baseStars >= 3 && previousStars < 3) {
      userData.goalReached = (userData.goalReached || 0) + 1;
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
    Promise.all([
      window.electron.invoke("get-logger-data"),
      window.electron.invoke("get-onboarding-data"),
    ]).then(async ([resLogger, resUser]) => {
      let dataArr = Array.isArray(resLogger) ? resLogger : [];
      let userData = resUser ? resUser : {};
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
        await window.electron.invoke("set-logger-data", dataArr);
        setTodayData(todayEntry);
        setLoading(false);
        return;
      }

      // Recompute stars (base + bonus) from current time and goal
      const previousStars = todayEntry.stars || 0;
      let baseStars = 0;
      if (todayEntry.time >= 150 && todayEntry.time < 200) {
        baseStars = 1;
      } else if (todayEntry.time >= 200 && todayEntry.time < 300) {
        baseStars = 2;
      } else if (todayEntry.time >= 300) {
        baseStars = 3;
      }
      const goalMinutes = Number(userData?.hours || 0) * 60;
      let bonusStars = 0;
      if (goalMinutes > 0) {
        const progressRatio = todayEntry.time / goalMinutes;
        if (progressRatio > 1) bonusStars = Math.floor((progressRatio - 1) / 0.2);
      }
      const newStars = baseStars + bonusStars;

      if (newStars !== previousStars) {
        todayEntry.stars = newStars;
        const idx = dataArr.findIndex(
          (entry) => entry.date && entry.date.slice(0, 5) === todayShort
        );
        if (idx !== -1) dataArr[idx] = todayEntry;

        // Update allStars by the delta
        const delta = Math.max(0, newStars - previousStars);
        if (delta > 0) {
          userData.allStars = (userData.allStars || 0) + delta;
        }
        // Count goalReached the first time base >= 3
        if (baseStars >= 3 && previousStars < 3) {
          userData.goalReached = (userData.goalReached || 0) + 1;
        }
        await window.electron.invoke("set-onboarding-data", userData);
        await window.electron.invoke("set-logger-data", dataArr);
      }

      setTodayData({ ...todayEntry });
      setLoading(false);
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
    <main className={`w-screen h-screen overflow-hidden flex flex-col items-center justify-center transition-colors duration-300 bg-secondary`}>
      {loading || !todayData ? (
        <Spinner />
      ) : (
        <>
          <TitleBar />
          <div className={`z-10 text-xl flex flex-row p-10 justify-between items-center w-full text-primary ${integrationOn ? "absolute top-0" : "-mt-10"}`}>
            <h2>Today</h2>
            <p>{todayData.date}</p>
          </div>
          <div className={`flex flex-row items-center absolute left-9 ${integrationOn ? "top-21" : "top-27 "}`}>
            <Star achieved />
            <p className={`text-xl ml-2 font-bold text-primary`}>
              {todayData.stars}/3
            </p>
          </div>
          {(() => {
            const totalMinutesGoal = goalHours * 60;
            const safeMax = totalMinutesGoal > 0 ? totalMinutesGoal : 1;
            const percentText = totalMinutesGoal > 0 ? `${Math.round((todayData.time / totalMinutesGoal) * 100)}%` : "0%";
            return (
              <div
                className={`w-40 h-40 flex justify-center items-center mx-auto mb-4 ${
                  integrationOn ? "mt-10" : ""
                }`}
              >
                <CircularProgressbar
                  value={todayData.time}
                  maxValue={safeMax}
                  text={percentText}
                  styles={{
                    path: {
                      strokeWidth: "8",
                      stroke: getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#6331c9',
                      strokeLinecap: "round",
                    },
                    text: {
                      fill: getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#6331c9',
                      fontSize: "20px",
                      fontWeight: "bold",
                      dominantBaseline: "central",
                      textAnchor: "middle",
                    },
                  }}
                />
              </div>
            );
          })()}
          {(() => {
            const totalMinutesGoal = goalHours * 60;
            const progressRatio = totalMinutesGoal > 0 ? Math.min(1, todayData.time / totalMinutesGoal) : 0;
            const seg = 1 / 3;
            const clamp01 = (v) => Math.max(0, Math.min(1, v));
            const starFills = [0, 1, 2].map((i) => clamp01((progressRatio - i * seg) / seg));
            return (
              <div
                className={`absolute right-10 gap-y-4 flex flex-col items-center ${
                  integrationOn ? "top-21" : "top-35"
                }`}
              >
                <Star fillPercent={starFills[0]} />
                <Star fillPercent={starFills[1]} />
                <Star fillPercent={starFills[2]} />
              </div>
            );
          })()}
          {/* Dropdown per la scelta dell'esame se integrazione attiva */}
          {integrationOn && (
            <div className="mb-2">
              <DropDownListComponent
                dataSource={examList}
                fields={{ text: "name", value: "name" }}
                value={selectedExam ? selectedExam.name : ""}
                placeholder="-- Select --"
                className={`bg-primary-weak text-primary rounded-4xl px-4 py-2 border border-primary`}
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
      color: var(--color-primary) !important;
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
              className={`cursor-pointer rounded-4xl w-50 h-12 font-bold transition-all duration-500 hover:w-75 bg-primary text-secondary hover:opacity-90
                          ${
                            integrationOn && !selectedExam
                ? "bg-grey-500 text-primary hover:!w-50 cursor-not-allowed"
                              : ""
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
          <div className={`flex flex-row items-start w-full p-10 -mt-3 text-primary`}>
            <div className="flex flex-col">
              <p>
                Your sessions <br /> so far{" "}
              </p>
              {todayData.sessions.length > 0 ? (
                todayData.sessions.slice(0, 3).map((session, index) => (
                  <div key={index} className="flex flex-row items-center mt-2">
                    <p className={`text-xl text-primary ${session.time > 60 ? "font-bold" : ""}`}>
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
              <p className={`text-xl ml-2 font-bold text-primary`}>
                {(todayData.time / 60).toFixed(2)}h
              </p>
            </div>
            <div className="absolute top-122 right-10 gap-x-5 flex flex-row">
            <button
              className={` w-35 h-10 mt-10 rounded-2xl cursor-pointer transition-all duration-300 hover:w-45 bg-primary text-secondary font-semibold`}
              onClick={() => setShowManualLogPopup(true)}
            >
              Log Manually
            </button>
            <button
              className={` w-25 h-10 mt-10 rounded-2xl cursor-pointer transition-all duration-300 hover:w-30 bg-primary text-secondary font-semibold`}
              onClick={() => navigate("/home")}
            >
              Go Back
            </button>
            </div>
          </div>
        </>
      )}

      {/* Manual Log Popup */}
      {showManualLogPopup && (
  <div className="fixed inset-0 overlay-secondary flex items-center justify-center z-50">
          <div className={`p-8 rounded-xl w-96 shadow-2xl bg-secondary text-primary`}>
            <h2 className="text-2xl font-bold mb-4 text-center">
              Log Minutes Manually
            </h2>
            <p className="mb-4 text-center">
              How many minutes would you like to log?
            </p>
            <style>
              {`
  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type="number"] {
    -moz-appearance: textfield;
  }
`}
            </style>
            <input
              type="number"
              min="1"
              max="2000"
              value={manualMinutes}
              onChange={(e) => setManualMinutes(e.target.value)}
              placeholder="Enter minutes..."
              className={`w-full p-3 rounded-lg border mb-4 text-center outline-none bg-primary-weak border-primary text-primary placeholder-primary/50`}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleManualLog();
                if (e.key === "Escape") {
                  setShowManualLogPopup(false);
                  setManualMinutes("");
                }
              }}
            />

            <div className="flex gap-4 justify-center">
              <button
                className={`w-35 h-10 hover:w-40 rounded-2xl font-semibold transition-all duration-300 cursor-pointer bg-primary text-secondary`}
                onClick={handleManualLog}
              >
                Log Minutes
              </button>
              <button
                className={`w-25 hover:w-30 rounded-2xl font-semibold transition-all duration-300 cursor-pointer bg-secondary text-primary border border-primary`}
                onClick={() => {
                  setShowManualLogPopup(false);
                  setManualMinutes("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
