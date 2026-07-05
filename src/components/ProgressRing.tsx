import React from "react";

interface ProgressRingProps {
  percent: number; // 0 to 100
  size?: number;   // size of the circle container (px)
  strokeWidth?: number;
  color?: string;
  children?: React.ReactNode;
}

export default function ProgressRing({
  percent,
  size = 280,
  strokeWidth = 8,
  color = "#6366f1",
  children
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  // Ensure percent is between 0 and 100
  const clampedPercent = Math.min(100, Math.max(0, percent));
  // Progress ring fills up as progress increases
  const strokeDashoffset = circumference - (clampedPercent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center select-none" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90 absolute top-0 left-0"
      >
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-slate-800/60 dark:stroke-slate-850/40"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress Circle with round cap */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
        />
      </svg>
      {/* Center content */}
      <div className="z-10 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}
