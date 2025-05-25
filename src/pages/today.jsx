import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TitleBar from "../components/TitleBar";
import Star from "../components/star";

import { CircularProgressbar } from "react-circular-progressbar";

export default function Today() {
    const navigate = useNavigate();
    const [todayData, setTodayData] = useState(null);
    const [loading, setLoading] = useState(true);

    // Helper to get today's date string (first 5 chars)
    const getTodayShort = () => new Date().toLocaleDateString().slice(0, 5);

    // Unified function: process result, update logger, update state
    const processAndSaveSessionResult = async (result) => {
        window.electron.send('renderer-log', "processAndSaveSessionResult called with:", result);
        if (!result) return;

        const todayShort = getTodayShort();
        const res = await window.electron.invoke("get-logger-data");
        const resUser = await window.electron.invoke("get-onboarding-data");
        let dataArr = Array.isArray(res) ? res : [];
        let userData = resUser ? resUser : {};

        window.electron.send('renderer-log', "todayShort:", todayShort, "loggerData:", dataArr);

        // Find or create today's entry
        let todayEntry = dataArr.find(entry => entry.date && entry.date.slice(0, 5) === todayShort);
        if (!todayEntry) {
            todayEntry = {
                date: todayShort,
                time: 0,
                stars: 0,
                sessions: []
            };
            dataArr.push(todayEntry);
        }

        // Calculate session minutes from result
        let sessionMinutes = 0;
        if (result.hours) sessionMinutes += result.hours * 60;
        if (result.minutes) sessionMinutes += result.minutes;

        // 1. Add result to grandTotal on onboarding data (convert minutes to hours)
        userData.grandTotal = Number(userData.grandTotal) + sessionMinutes;

        // 2. Add to today time the result
        todayEntry.time += sessionMinutes;

        // 3. Calculate stars for today (FIXED: corrected star thresholds)
        const previousStars = todayEntry.stars || 0;

        if (todayEntry.time >= 150 && todayEntry.time < 200) { // 2.5 hours = 150 min, 200 min threshold
            todayEntry.stars = 1;
        } else if (todayEntry.time >= 200 && todayEntry.time < 300) { // 200-300 min range
            todayEntry.stars = 2;
        } else if (todayEntry.time >= 300) { // 5+ hours = 300+ min
            todayEntry.stars = 3;
            // Increment goalReached only when reaching 3 stars for the first time today
            if (previousStars < 3) {
                userData.goalReached = (userData.goalReached || 0) + 1;
            }
        }

        // 4. Add new stars to allStars (only the difference, no repetitions)
        const newStarsEarned = Math.max(0, todayEntry.stars - previousStars);
        userData.allStars = (userData.allStars || 0) + newStarsEarned;

        // 5. Prepend to the start of the array of sessions, then slice to keep max 3
        todayEntry.sessions = [sessionMinutes, ...todayEntry.sessions].slice(0, 3);

        window.electron.send('renderer-log', "User data:", userData);

        // 6. Save to files
        await window.electron.invoke("set-onboarding-data", userData);

        // Update today's entry in logger data
        const idx = dataArr.findIndex(entry => entry.date && entry.date.slice(0, 5) === todayShort);
        if (idx !== -1) {
            dataArr[idx] = todayEntry;
        } else {
            dataArr.push(todayEntry);
        }

        window.electron.send('renderer-log', "Writing logger data:", dataArr);
        await window.electron.invoke("set-logger-data", dataArr);
        setTodayData({ ...todayEntry });
    };

    // Initial load
    useEffect(() => {
        const todayShort = getTodayShort();
        window.electron.invoke("get-logger-data").then((res) => {
            let dataArr = Array.isArray(res) ? res : [];
            let todayEntry = dataArr.find(entry => entry.date && entry.date.slice(0, 5) === todayShort);
            if (!todayEntry) {
                todayEntry = {
                    date: todayShort,
                    time: 0,
                    stars: 0,
                    sessions: []
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
    return () => window.electron.removeListener("session-result", handleSessionResult);
}, []);
    return (
        <main className="w-screen h-screen bg-[#D2D6EF] overflow-hidden">
            {loading || !todayData ? (
                <h2>Loading...</h2>
            ) : (<>
                <TitleBar />
                <div className="text-xl mt-4 flex flex-row p-10 justify-between items-center w-full text-[#6331c9]">
                    <h2>Today</h2>
                    <p>{todayData.date}</p>
                </div>
                <div className="flex flex-row items-center p-10 -mt-18 ">
                    <Star achieved />
                    <p className="text-xl ml-2 text-[#6331c9] font-bold">{todayData.stars}/3</p>
                </div>
                <div className="w-40 h-40 flex justify-center items-center mx-auto mb-4">
                    <CircularProgressbar
                        className="text-[#6331c9]"
                        value={todayData.time}
                        maxValue={300}
                        text={`${Math.round((todayData.time / 300) * 100)}%`}
                        styles={{
                            path: { strokeWidth: "8", stroke: "#6331c9", strokeLinecap: "round" },
                            text: {
                                fill: "#6331c9",
                                fontSize: "20px",
                                fontWeight: "bold",
                                dominantBaseline: "central",
                                textAnchor: "middle"
                            }
                        }}
                    />
                </div>
                <div className="absolute top-45 right-10 gap-y-4 flex flex-col items-center">
                    <Star achieved={todayData.stars >= 1} />
                    <Star achieved={todayData.stars >= 2} />
                    <Star achieved={todayData.stars >= 3} />
                </div>
                <div className="w-full flex justify-center items-center">
                    <button
                        className="cursor-pointer bg-[#6331c9] rounded-4xl w-50 h-12 hover:w-65 transition-all duration-500 text-white font-bold"
                        onClick={() => {

                            navigate('/session');
                            setTimeout(() => {
                                window.electron.send("resize-for-session");
                            }, 0);
                        }}                    >Open new session</button>
                </div>
                <div className="flex flex-row items-start w-full p-10 text-[#6331c9] -mt-3">
                    <div className="flex flex-col">
                        <p>Your sessions <br /> so far </p>
                        {todayData.sessions.length > 0 ? (
                            todayData.sessions.map((session, index) => (
                                <div key={index} className="flex flex-row items-center mt-2">
                                    <p className={`text-xl text-[#6331c9] ${session > 60 ? "font-bold" : ""}`}>{session} min</p>
                                </div>
                            ))
                        ) : (
                            <p className="font-bold"><br />No sessions yet</p>
                        )}
                    </div>
                    <div className="flex flex-col ml-48 items-center text-center">
                        <p className="text-center"> Total</p>
                        <p className="text-xl ml-2 text-[#6331c9] font-bold">{(todayData.time / 60).toFixed(2)}h</p>
                    </div>
                    <button className="absolute top-117 right-10 w-25 h-10 mt-10 bg-[#6331c9] text-white rounded-2xl cursor-pointer hover:h-15 transition-all duration-300" onClick={() => navigate("/home")}>Go Back</button>

                </div>
            </>)}
        </main>
    )
}