import React, { useEffect } from "react";
import TitleBar from "../components/TitleBar";
import { useNavigate } from "react-router-dom";
import Vara from "vara";

export default function Landing() {
  const navigate = useNavigate();
  useEffect(() => {
    const container = document.getElementById("vara-title");
    if (container) container.innerHTML = "";
    new Vara(
      "#vara-title",
      "https://raw.githubusercontent.com/akzhy/Vara/master/fonts/Satisfy/SatisfySL.json",
      [
        {
          text: "Welcome to Cogito",
          textAlign: "center",
          y: 20,
          fromCurrentPosition: { y: false },
          duration: 2000,
          color: "#6331c9",
          autoAnimation: true,
        },
      ],
      {
        fontSize: 52,
        strokeWidth: 3,
      }
    );
  }, []);

  return (
    <main className="w-screen h-screen bg-[#D2D6EF] overflow-hidden">
      <TitleBar />
      <div className="mt-[20%] flex justify-center items-start w-full h-full" >
        <div className="rounded-lg p-6 w-full flex justify-center flex-col items-center">
          <div id="vara-title" className="w-screen flex justify-center items-center"></div>
          <div className="mt-32 flex justify-center items-center flex-col">
            <p className="text-[#6331c9] text-center">
              Your journey to a more productive life starts here.
            </p>
            <button 
            onClick={() => navigate("/getStarted")}
            className="w-30 bg-[#a6aae3] text-[#6331c9] rounded-4xl h-10 mt-4 cursor-pointer hover:bg-[#6331c9] hover:text-white hover:w-55 hover:rounded-2xl transition-all duration-500 ease-in-out">
              Start
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}