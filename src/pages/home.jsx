import React from "react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import TitleBar from "../components/TitleBar";
import Star from "../components/star";
import emptyPng from "../assets/empty.png";
import Spinner from "../components/Spinner";
import { useTheme } from "../components/themeProvider";

export default function Home() {
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loggerData, setLoggerData] = useState(null);
    const fileInputRef = useRef(null);
    const { dark } = useTheme();

    useEffect(() => {
        const fetchData = async () => {
            let data = await window.electron.invoke("get-onboarding-data");
            let loggerData = await window.electron.invoke("get-logger-data");
            if (!data.propic) {
                data.propic = emptyPng; // Set default profile picture if not set
            }
            setLoggerData(loggerData);

            // Calculate average time using fetched data, not state
            window.electron.send('renderer-log', "Fetched grand data:", data.grandTotal, loggerData.length);
            let average = loggerData && loggerData.length > 0
                ? (data.grandTotal/60).toFixed(2) / loggerData.length
                : 0;
            average = average.toFixed(2);

            setUserData(prev => ({
                ...data,
                average: average,
                allStars: data.allStars,
                goalReached: data.goalReached,
            }));
            window.electron.invoke("set-onboarding-data", {
                ...data,
                average: average,
                allStars: data.allStars,
                goalReached: data.goalReached,
            });
            setLoading(false);
        };
        fetchData();
    }, []);

    // Handle image click
    const handleImageClick = () => {
        fileInputRef.current.click();
    };

    // Handle file selection
    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result;
            // Save to onboarding data
            const updatedData = { ...userData, propic: base64String };
            await window.electron.invoke("set-onboarding-data", updatedData);
            setUserData(updatedData);
        };
        reader.readAsDataURL(file);
    };

    // Pulsanti: colori più contrastati
    const buttonBase = "rounded-4xl w-35 h-10 font-semibold hover:w-50 cursor-pointer transition-all duration-500";
    const buttonLight = "bg-[#6331c9] text-white hover:bg-[#4b2496]";
    const buttonDark = "bg-[#D2D6EF] text-[#181825] hover:bg-[#b8bce0] border border-[#D2D6EF]";

    return (
        <main className={`w-screen h-screen overflow-hidden flex justify-center items-center flex-col transition-colors duration-300
            ${dark ? "bg-[#181825]" : "bg-[#D2D6EF]"}`}>
            <TitleBar />
            {loading || !userData ? (
                <Spinner/>
            ) : (
                <>
                    <div className={`flex flex-row -mt-25 p-10 justify-between items-center w-full 
                        ${dark ? "text-[#D2D6EF]" : "text-[#6331c9]"}`}>
                        <div className="flex flex-col">
                            <h2 className="text-2xl">Welcome back,  <br /> <b> {userData.name}</b> </h2>
                            <div className="flex flex-row items-center mt-4">
                                <Star achieved />
                                <p className="text-4xl">&nbsp;{userData.allStars}</p>
                            </div>
                        </div>
                        <img
                            src={userData.propic}
                            alt="Profile"
                            className="rounded-full w-30 h-30 cursor-pointer"
                            onClick={handleImageClick}
                        />
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            style={{ display: "none" }}
                            onChange={handleFileChange}
                        />
                    </div>
                    <div className={`flex flex-row justify-between items-start w-full p-10 
                        ${dark ? "text-[#D2D6EF]" : "text-[#6331c9]"}`}>
                        <div className="flex flex-col items-start">
                            <p className="mb-10">Your daily average is <br /> <b>{userData.average}h</b></p>
                            <p className="">You reached your goal <br /> <b>{userData.goalReached} times</b></p>
                        </div>
                        <div className="flex flex-col items-center mr-8">
                            <p className="mb-10 text-center">Total <br /><b>{(userData.grandTotal/60).toFixed(2)}h</b></p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate("/today")}
                        className={`absolute top-93 right-10 rounded-4xl w-35 h-10 font-semibold hover:w-45 cursor-pointer transition-all duration-500 ${dark ? buttonDark : buttonLight}`}
                    >
                        Track
                    </button>
                    <button
                        onClick={() => navigate("/statistics")}
                        className={`absolute top-130 left-10 ${buttonBase} ${dark ? buttonDark : buttonLight}`}
                    >
                        Statistics
                    </button>
                    <button
                        onClick={() => navigate("/Advanced")}
                        className={`absolute top-130 right-10 ${buttonBase} ${dark ? buttonDark : buttonLight}`}
                    >
                        Advanced
                    </button>
                </>
            )}
        </main>
    )
}