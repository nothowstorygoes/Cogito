import React from "react";

export default function Spinner({ size = 40 }) {
  return (
    <div className="flex items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        className="animate-spin"
        style={{ display: "block" }}
      >
        <circle
          cx="20"
          cy="20"
          r="16"
          stroke="#6331c9"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="80"
          strokeDashoffset="60"
        />
      </svg>
    </div>
  );
}