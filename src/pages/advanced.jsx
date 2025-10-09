import TitleBar from "../components/TitleBar";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
// removed useTheme: theming via CSS variables
import React, { useEffect } from "react";

export default function Advanced() {
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"
  const [appVersion, setAppVersion] = useState("");
  const [toggleOn, setToggleOn] = useState(false);
  const [onboardingHours, setOnboardingHours] = useState(0);
  const [ErgoExists, setErgoExists] = useState(false);

  // Pulsanti: colori più contrastati
  const buttonBase =
    "rounded-3xl w-35 h-10 font-semibold hover:w-40 cursor-pointer transition-all duration-300";
  const buttonSolid = "bg-primary text-secondary hover:opacity-90 w-40 hover:w-45";
  const buttonOutline = "bg-secondary text-primary border border-primary hover:bg-primary/10";

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
    <main className={`w-screen h-screen overflow-hidden flex flex-col transition-colors duration-300 bg-secondary`}>
      <TitleBar />
      <div className="flex flex-col items-center h-full mt-10">
        <h1 className={`text-3xl font-semibold mb-4 text-primary`}>
          Advanced Settings
        </h1>
        <p className={`text-md mb-4 w-96 text-center text-primary`}>
          In this section you can import preexisting data or export a backup of
          your log.
        </p>
        <div className="flex flex-row items-center justify-between w-90 mb-5 gap-4">
          <button
            className={`${buttonBase} ${buttonSolid}`}
            onClick={() => navigate("/import")}
          >
            Import Data
          </button>
          <button
            className={`${buttonBase} ${buttonSolid}`}
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? "Exporting..." : "Export Log"}
          </button>
        </div>
        <div className="flex flex-row w-90 justify-between items-center"> 
        <button
            className={` ${buttonBase} ${buttonSolid}`}
            onClick={() => window.electron.invoke('open-app-folder')}
          >
            Open App Folder

        </button>
        <button
            className={`${buttonBase} ${buttonSolid}`}
            onClick={() => navigate('/theme')}
          >
            Theme
          </button>
          </div>
        <div className="mt-8 w-80 flex flex-col items-center">
          {ErgoExists ? (
            <div className="flex items-center gap-2 w-full justify-between">
              <span className={`text-sm ${toggleOn ? 'text-primary' : 'text-gray-400'}`}>
                Enable Ergo's Integration
              </span>
              <button
                type="button"
                aria-pressed={toggleOn}
                onClick={() => setToggleOn((v) => !v)}
                className={`cursor-pointer w-12 h-7 rounded-full transition-colors duration-300 relative
                  ${toggleOn ? "bg-primary" : "bg-gray-300"}`}
              >
                <span
                  className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-all duration-300
                    ${toggleOn ? "translate-x-5" : ""}`}
                />
              </button>
            </div>
          ) : (
            <h2 className="text-md font-semibold text-primary text-center">
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
                className="text-primary font-semibold"
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
              className={`text-md text-primary`}
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
              className={`rounded-3xl px-4 py-2 w-24 ml-4 border transition-colors duration-300 outline-none bg-primary-weak border-primary text-primary focus:border-primary`}
            />
          </div>
          </div>
        <div className="absolute top-110 mx-auto text-sm text-primary">
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
          className={`${buttonBase} ${buttonOutline} absolute top-130 right-10`}
          onClick={() => navigate("/home")}
        >
          Go Back
        </button>
      </div>
    </main>
  );
}
