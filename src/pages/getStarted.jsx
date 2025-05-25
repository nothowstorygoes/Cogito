import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

import TitleBar from "../components/TitleBar";
import { motion } from "framer-motion";

const FOCUS_OPTIONS = [
    { value: "work", label: "Work" },
    { value: "study", label: "Study" },
    { value: "fitness", label: "Fitness" },
    { value: "creative", label: "Creative Projects" },
];

export default function GetStarted() {
    const [focus, setFocus] = useState("");
    const [name, setName] = useState("");
    const [hours, setHours] = useState("");
    const [error, setError] = useState("");
    const [step, setStep] = useState(0); // 0: name, 1: focus, 2: hours
    const navigate = useNavigate();
    const focusRef = useRef(null);

    // Slide up by 60px per step (adjust as needed)
    const yOffsets = [0, -10, -20];

    const handleNameKeyDown = (e) => {
        if (e.key === "Enter" && name.trim() !== "") {
            setStep(1);
            setTimeout(() => {
                focusRef.current && focusRef.current.focus();
            }, 0);
            e.preventDefault();
        }
    };

    const handleFocusChange = (e) => {
        setFocus(e.target.value);
        if (e.target.value) setStep(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (!focus || !hours || !name) {
            setError("Oops you missed something!");
            return;
        }
        if (isNaN(hours) || Number(hours) <= 0) {
            setError("Please enter a valid number of hours.");
            return;
        }
        await window.electron.invoke("set-onboarding-data", {
            name,
            focus,
            hours: Number(hours),
            onboarded: true,
            allStars: 0,
            average: 0,
            goalReached: 0,
            grandTotal: 0,
            propic: ""
        });
        let date = new Date().toLocaleDateString();
        await window.electron.invoke("set-logger-data", [{
            date: date.slice(0, 5),
            time: 0,
            stars: 0,
            sessions: []
        }]);
        navigate("/home");


    };

    return (
        <main className="w-screen h-screen bg-[#D2D6EF] flex flex-col items-center justify-center">
            <TitleBar />
            <motion.div
                animate={{ y: yOffsets[step] }}
                transition={{ type: "spring", stiffness: 80, damping: 15 }}
                className="rounded-lg p-8 flex flex-col items-center"
            >
                <h2 className="text-3xl font-bold mb-6 text-[#6331c9]">Get Started</h2>
                <form className="w-2/3 flex flex-col gap-6 justify-center items-center" onSubmit={handleSubmit}>
                    {/* Name input */}
                    <div className="flex flex-col items-center w-full">
                        <label className="block mb-2 text-[#6331c9] font-semibold text-center">
                            How do you wish to be called?
                        </label>
                        <input
                            type="text"
                            className="text-center w-70 border border-[#a6aae3] rounded px-3 py-2 focus:outline-none"
                            placeholder="Your name"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            onKeyDown={handleNameKeyDown}
                            autoFocus={step === 0}
                            disabled={step > 0}
                        />
                    </div>

                    {/* Focus select */}
                    {step >= 1 && (
                        <div className="flex flex-col items-center w-full">
                            <label className="block mb-2 text-[#6331c9] font-semibold text-center">
                                What do you want to focus on?
                            </label>
                            <select
                                ref={focusRef}
                                className="text-center w-70 border border-[#a6aae3] rounded px-3 py-2 focus:outline-none"
                                value={focus}
                                onChange={handleFocusChange}
                                required
                                autoFocus={step === 1}
                                disabled={step < 1}
                            >
                                <option value="">Select...</option>
                                {FOCUS_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Hours input */}
                    {step === 2 && focus && (
                        <div className="flex flex-col items-center w-full">
                            <label className="block mb-2 text-[#6331c9] font-semibold text-center">
                                How many hours per day would you like to dedicate to {FOCUS_OPTIONS.find(opt => opt.value === focus)?.label.toLowerCase()}?
                            </label>
                            <input
                                type="number"
                                min="1"
                                step="0.5"
                                className="text-center w-70 border border-[#a6aae3] rounded px-3 py-2 focus:outline-none"
                                value={hours}
                                onChange={e => setHours(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>
                    )}

                    {/* Error message */}
                    {error && (
                        <div className="text-red-500 text-sm">{error}</div>
                    )}

                    {/* Submit button only when all fields are filled */}
                    {step === 2 && focus && hours && (
                        <button
                            type="submit"
                            className="mt-8 w-30 bg-[#a6aae3] text-[#6331c9] cursor-pointer rounded-4xl py-2 font-semibold hover:bg-[#6331c9] hover:text-white hover:rounded-2xl hover:w-70 transition-all duration-300"
                        >
                            Let's start
                        </button>
                    )}
                </form>
            </motion.div>
        </main>
    );
}