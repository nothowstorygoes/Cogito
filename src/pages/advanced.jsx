import TitleBar from "../components/TitleBar";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useTheme } from "../components/themeProvider";
import React, { useEffect } from "react";

export default function Advanced() {
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"
  const { dark, toggleTheme } = useTheme();
  const [appVersion, setAppVersion] = useState("");
  const [toggleOn, setToggleOn] = useState(false);
  const [onboardingHours, setOnboardingHours] = useState(0);
  const [ErgoExists, setErgoExists] = useState(false);

  // Pulsanti: colori più contrastati
  const buttonBase =
    "rounded-3xl w-35 h-10 font-semibold hover:w-40 cursor-pointer transition-all duration-300";
  const buttonLight = "bg-[#6331c9] text-white hover:bg-[#4b2496]";
  const buttonDark =
    "bg-[#D2D6EF] text-[#181825] hover:bg-[#b8bce0] border border-[#D2D6EF]";

  useEffect(() => {
    window.electron.examShelfOnboardingExists().then((exists) => {
      if (exists) {
        // If onboarding exists, navigate to home
        setErgoExists(true);
      }
    });
  });

  async function checkExamIntegration() {
    const exists = await window.electron.invoke("check-exam-integration");
    setToggleOn(!!exists);
  }

  // Funzione per eliminare ExamIntegration.json
  async function deleteExamIntegration() {
    await window.electron.invoke("delete-exam-integration");
  }

  // All'avvio: controlla se ExamIntegration.json esiste
  useEffect(() => {
    if (ErgoExists) checkExamIntegration();
    // eslint-disable-next-line
  }, [ErgoExists]);

  // Quando il toggle cambia
  useEffect(() => {
    if (!ErgoExists) return;
    if (toggleOn) {
      window.electron.invoke("ergo-integration");
    } else {
      deleteExamIntegration();
    }
    // eslint-disable-next-line
  }, [toggleOn, ErgoExists]);

  useEffect(() => {
    window.electron.invoke("get-onboarding-data").then((res) => {
      if (res) {
        setOnboardingHours(res.hours || 0);
      }
    });
  }, []);

  useEffect(() => {
    window.electron
      .getAppVersion()
      .then((version) => setAppVersion(version || "Unknown"));
  }, []);

  // Export log handler
  const handleExport = async () => {
    setExporting(true);
    setMessage("");
    try {
      const loggerData = await window.electron.invoke("get-logger-data");
      if (!loggerData) {
        setMessage("No log data found.");
        setMessageType("error");
        setExporting(false);
        return;
      }
      const filePath = await window.electron.invoke("show-save-dialog", {
        title: "Export Log",
        defaultPath: "logger.json",
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (!filePath) {
        setExporting(false);
        return;
      }
      await window.electron.invoke("save-file", {
        filePath,
        content: JSON.stringify(loggerData, null, 2),
      });
      setMessage("Log exported successfully!");
      setMessageType("success");
    } catch (err) {
      setMessage("Export failed: " + (err?.message || "Unknown error"));
      setMessageType("error");
    }
    setExporting(false);
  };

  return (
    <main
      className={`w-screen h-screen overflow-hidden flex flex-col transition-colors duration-300
            ${dark ? "bg-[#181825]" : "bg-[#D2D6EF]"}`}
    >
      <TitleBar />
      <div className="flex flex-col items-center h-full mt-10">
        <h1
          className={`text-3xl font-bold mb-4 transition-colors duration-300 ${
            dark ? "text-[#D2D6EF]" : "text-[#6331c9]"
          }`}
        >
          Advanced Settings
        </h1>
        <p
          className={`text-md mb-4 w-96 text-center transition-colors duration-300 ${
            dark ? "text-[#D2D6EF]" : "text-[#6331c9]"
          }`}
        >
          In this section you can import preexisting data or export a backup of
          your log.
        </p>
        <div className="flex flex-row items-center justify-between w-80 mb-10">
          <button
            className={`${buttonBase} ${dark ? buttonDark : buttonLight}`}
            onClick={() => navigate("/import")}
          >
            Import Data
          </button>
          <button
            className={`${buttonBase} ${dark ? buttonDark : buttonLight}`}
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? "Exporting..." : "Export Log"}
          </button>
        </div>
        {/* Single Light/Dark Switch */}
        <div className="flex flex-row gap-4 items-center mb-6 absolute top-129 left-15 ">
          <button
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            className={`cursor-pointer p-2 rounded-full border-2 transition-colors duration-200 ${
              dark
                ? "border-[#D2D6EF] bg-[#181825]"
                : "border-[#6331c9] bg-[#D2D6EF]"
            }`}
            onClick={() => toggleTheme(!dark)}
          >
            {dark ? (
              // Sun SVG for switching to light mode
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="5" fill="#D2D6EF" />
                <g stroke="#D2D6EF" strokeWidth="2" strokeLinecap="round">
                  <line x1="12" y1="2" x2="12" y2="4" />
                  <line x1="12" y1="20" x2="12" y2="22" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="2" y1="12" x2="4" y2="12" />
                  <line x1="20" y1="12" x2="22" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </g>
              </svg>
            ) : (
              // Moon SVG for switching to dark mode
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 12.79A9 9 0 0111.21 3a7 7 0 100 14 9 9 0 009.79-4.21z"
                  fill="#6331c9"
                />
              </svg>
            )}
          </button>
        </div>
        <div className="mt-8 w-80 flex flex-col items-center">
          {ErgoExists ? (
            <div className="flex items-center gap-2 w-full justify-between">
              <span
                className={`text-sm ${
                  toggleOn
                    ? "text-[#6331c9] dark:text-[#D2D6EF]"
                    : "text-gray-400"
                }`}
              >
                Enable Ergo's Integration
              </span>
              <button
                type="button"
                aria-pressed={toggleOn}
                onClick={() => setToggleOn((v) => !v)}
                className={`cursor-pointer w-12 h-7 rounded-full transition-colors duration-300 relative
                  ${
                    toggleOn ? "bg-[#6331c9] dark:bg-[#D2D6EF]" : "bg-gray-300"
                  }`}
              >
                <span
                  className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-all duration-300
                    ${toggleOn ? "translate-x-5" : ""}`}
                />
              </button>
            </div>
          ) : (
            <h2 className="text-md font-semibold text-[#6331c9] dark:text-[#D2D6EF] text-center">
              Cogito is part of Ergo Ecosystem,
              <br />
              check out{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  window.electron.invoke(
                    "open-external",
                    "https://github.com/nothowstorygoes/ExamShelf"
                  );
                }}
                className="text-[#6331c9] font-bold"
              >
                ExamShelf.
              </a>
            </h2>
          )}
        </div>
        <div className="mt-8 w-80 flex flex-col items-center">
          {/* Onboarding hours input */}
          <div className="flex flex-row items-center justify-between w-full mb-6">
            <label
              htmlFor="onboarding-hours"
              className={`text-md ${dark ? "text-[#D2D6EF]" : "text-[#6331c9]"}`}
            >
              Daily Goal (hours)
            </label>
            <input
              id="onboarding-hours"
              type="number"
              min={1}
              max={24}
              step={1}
              value={onboardingHours}
              onChange={async (e) => {
                const val = Math.max(1, Math.min(24, Number(e.target.value)));
                setOnboardingHours(val);
                await window.electron.invoke("get-onboarding-data").then((data) => {
                  if (data) {
                    data.hours = val;
                    window.electron.invoke("set-onboarding-data", data);
                  }
                })
              }}
              className={`rounded-3xl px-4 py-2 w-24 ml-4 border transition-colors duration-300 outline-none
                ${dark
                  ? "bg-[#181825] border-[#D2D6EF] text-[#D2D6EF] focus:border-[#6331c9]"
                  : "bg-white border-[#6331c9] text-[#6331c9] focus:border-[#181825]"
                }`}
            />
          </div>
          </div>

        <div className="absolute top-110 mx-auto text-sm text-[#6331c9] dark:text-[#D2D6EF]">
          v.{appVersion}
        </div>
        {/* Status Message */}
        {message && (
          <div
            className={`mt-4 p-3 rounded-lg w-[96] text-center ${
              messageType === "success"
                ? "bg-green-100 text-green-800 border border-green-300"
                : "bg-red-100 text-red-800 border border-red-300"
            }`}
          >
            {message}
          </div>
        )}
        <button></button>
        <button
          className={`${buttonBase} ${
            dark ? buttonDark : buttonLight
          } absolute top-130 right-10`}
          onClick={() => navigate("/home")}
        >
          Go Back
        </button>
      </div>
    </main>
  );
}
