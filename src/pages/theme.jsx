import React from 'react';
import TitleBar from '../components/TitleBar';
import ThemePicker from '../components/ThemePicker';
import { useNavigate } from 'react-router-dom';

export default function ThemePage() {
  const navigate = useNavigate();
  return (
    <main className="w-screen h-screen bg-secondary overflow-hidden flex flex-col items-center">
      <TitleBar />
      <div className="w-full max-w-[720px] mt-20 px-6 flex flex-col items-center gap-6">
        <ThemePicker />
        <button
          className="absolute top-120 left-10 w-35 h-10 rounded-3xl bg-primary text-secondary font-semibold hover:w-45 transition-all duration-300 cursor-pointer"
          onClick={() => navigate('/advanced')}
        >
          Go Back
        </button>
      </div>
    </main>
  );
}
