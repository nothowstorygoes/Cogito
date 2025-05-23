import React from "react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import TitleBar from "../components/TitleBar";


export default function Home() {
    return(
    <main className="w-screen h-screen bg-[#D2D6EF] overflow-hidden">
            <TitleBar />
        </main>
    )
}