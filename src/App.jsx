import { Routes, Route, useNavigate } from "react-router-dom";
import React, { useEffect, useState } from "react";
import Landing from "./pages/Landing";
import Home from "./pages/home";
import GetStarted from "./pages/getStarted";
import Today from "./pages/today";
import Statistics from "./pages/statistics";
import Session from "./pages/session";
import Import from "./pages/import";
import InDepth from "./pages/inDepth";
import Advanced from "./pages/advanced";

export default function App() {
  const navigate = useNavigate();
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);

  // Espone la funzione globale per la navigazione da main process
  useEffect(() => {
    window.navigateToRoute = (route) => {
      navigate(route);
    };
    return () => {
      delete window.navigateToRoute;
    };
  }, [navigate]);

  useEffect(() => {
    const handler = (event, route) => {
      navigate(route);
    };
    window.electron.receive("navigate", handler);
    return () => window.electron.removeListener("navigate", handler);
  }, [navigate]);

  // Gestione dark mode
  useEffect(() => {
    async function setDarkModeClass() {
      const onboarding = await window.electron.invoke("get-onboarding-data");
      if (onboarding?.dark) {
        document.body.className = "dark";
      } else {
        document.body.className = "";
      }
    }
    setDarkModeClass();
    window.addEventListener("focus", setDarkModeClass);
    return () => window.removeEventListener("focus", setDarkModeClass);
  }, []);

  // Gestione update prompt globale
  useEffect(() => {
    const onUpdate = () => setShowUpdatePrompt(true);
    window.electron.onUpdateDownloaded(onUpdate);
    return () => window.electron.removeListener("update-downloaded", onUpdate);
  }, []);

  const handleUpdateAction = (action) => {
    window.electron.sendUpdateAction(action);
    setShowUpdatePrompt(false);
  };

  return (
    <>
      {showUpdatePrompt && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-[9999]">
          <div className="bg-[#D2D6EF] dark:bg-[#181825] text-white p-8 rounded-xl w-[80%] shadow-2xl text-center">
            <h2 className="text-2xl text-[#6331c9] dark:text-[#D2D6EF] font-bold mb-2">
              New Update
            </h2>
            <p className="mb-6 text-[#6331c9] dark:text-[#D2D6EF]">
              A new version of the app is available! <br />
              <br />
              Would you like to install it now or on the next app quit?
            </p>
            <div className="flex gap-4 justify-center">
              <button
                className="dark:text-[#181825] w-30 rounded-3xl bg-[#6331c9] dark:bg-[#D2D6EF] h-10 hover:w-35 transition-all duration-300 font-semibold"
                onClick={() => handleUpdateAction("install-now")}
              >
                Install now
              </button>
              <button
                className="w-35 rounded-3xl h-10 bg-zinc-600 hover:w-40 font-semibold transition-all duration-300"
                onClick={() => handleUpdateAction("install-on-quit")}
              >
                Install on quit
              </button>
            </div>
          </div>
        </div>
      )}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/getStarted" element={<GetStarted />} />
        <Route path="/home" element={<Home />} />
        <Route path="/today" element={<Today />} />
        <Route path="/statistics" element={<Statistics />} />
        <Route path="/import" element={<Import />} />
        <Route path="/advanced" element={<Advanced />} />
        <Route path="/inDepth" element={<InDepth />} />
        <Route path="/session" element={<Session />} />
      </Routes>
    </>
  );
}
