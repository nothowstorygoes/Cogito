import { Routes, Route, useNavigate } from "react-router-dom";
import React from "react";
import Landing from "./pages/landing";
import Home from "./pages/home";
import GetStarted from "./pages/getStarted";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={< Landing />} />
      <Route path="/getStarted" element={< GetStarted />} />
      <Route path="/home" element={< Home />} />

    </Routes>
  )
}