import { Routes, Route, useNavigate } from "react-router-dom";
import React from "react";
import { useEffect } from "react";
import Landing from "./pages/Landing";
import Home from "./pages/home";
import GetStarted from "./pages/getStarted";
import Today from "./pages/today";
import Statistics from "./pages/statistics";
import Session from "./pages/session";
import Import from "./pages/import";
import InDepth from "./pages/inDepth";

 

export default function App() {
    const navigate = useNavigate();

  // Espone la funzione globale per la navigazione da main process
  React.useEffect(() => {
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
    return () =>  window.electron.removeListener('navigate', handler);
  }, [navigate]);
  return (
    <Routes>
      <Route path="/" element={< Landing />} />
      <Route path="/getStarted" element={< GetStarted />} />
      <Route path="/home" element={< Home />} />
      <Route path="/today" element={<Today />} />
      <Route path="/statistics" element={<Statistics />} />
      <Route path="/import" element={<Import />} />
      <Route path="/inDepth" element={<InDepth/>}/>
      <Route path="/session" element={<Session />} />
    </Routes>
  )
}