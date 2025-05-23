import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
const { ipcRenderer } = window.require("electron");
import TitleBar from "../components/TitleBar";

const FOCUS_OPTIONS = [
    { value: "work", label: "Work" },
    { value: "study", label: "Study" },
    { value: "fitness", label: "Fitness" },
    { value: "creative", label: "Creative Projects" },
];

export default function GetStarted() {
    const [focus, setFocus] = useState("");
    const [hours, setHours] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!focus || !hours) {
            setError("Please select a focus and enter hours.");
            return;
        }
        if (isNaN(hours) || Number(hours) <= 0) {
            setError("Please enter a valid number of hours.");
            return;
        }
        // Save data to JSON file via Electron main process
        await ipcRenderer.invoke("set-app-data", {
            focus,
            hours: Number(hours),
            onboarded: true,
        });
        navigate("/home");
    };

    return (
        <main className="w-screen h-screen bg-[#D2D6EF] flex flex-col items-center justify-center">
            <TitleBar />
            <div className="rounded-lg p-8 flex flex-col items-center">
                <h2 className="text-3xl font-bold mb-6 text-[#6331c9]">Get Started</h2>
                <form className="w-2/3 flex flex-col gap-6 justify-center items-center" onSubmit={handleSubmit}>
                    <div className="flex flex-col items-center">
                        <label className="block mb-2 text-[#6331c9] font-semibold text-center">
                            What do you want to focus on?
                        </label>
                        <select
                            className="w-3/4 border border-[#a6aae3] rounded px-3 py-2 focus:outline-none"
                            value={focus}
                            onChange={e => setFocus(e.target.value)}
                            required
                        >
                            <option value="">Select...</option>
                            {FOCUS_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    {focus && (
                    <div className="flex flex-col items-center mt-8">
                            <label className="block mb-2 text-[#6331c9] font-semibold text-center">
                                How many hours per day would you like to dedicate to {FOCUS_OPTIONS.find(opt => opt.value === focus)?.label.toLowerCase()}?
                            </label>
                            <input
                                type="number"
                                min="1"
                                step="0.5"
                                className="w-2/3 border border-[#a6aae3] rounded px-3 py-2 focus:outline-none"
                                value={hours}
                                onChange={e => setHours(e.target.value)}
                                required
                            />
                        </div>
                    )}
                    {error && <div className="text-red-500 text-sm">{error}</div>}
                    <button
                        type="submit"
                        className=" mt-15 w-30 bg-[#a6aae3] text-[#6331c9] cursor-pointer rounded-4xl py-2 font-semibold hover:bg-[#6331c9] hover:text-white hover:rounded-2xl hover:w-70 transition-all duration-300"
                    >
                        Let's start
                    </button>
                </form>
            </div>
        </main>
    );
}