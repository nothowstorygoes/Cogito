import { Routes, Route, useNavigate } from "react-router-dom";
import React, { useEffect } from "react";
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
    window.electron.receive('navigate', handler);
    return () => window.electron.removeListener('navigate', handler);
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

    // Aggiorna la dark mode ogni volta che la pagina cambia
    setDarkModeClass();
    window.addEventListener("focus", setDarkModeClass);
    return () => window.removeEventListener("focus", setDarkModeClass);
  }, []);

  return (
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
  );
}