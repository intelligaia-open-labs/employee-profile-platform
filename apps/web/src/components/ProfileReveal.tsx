"use client";

import { useState, useEffect, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

const STAGES = [
  { label: "Initializing", color: "#ef4444", dash: 35, duration: 500 },
  { label: "Shared intent arriving", color: "#d4a017", dash: 70, duration: 600 },
  { label: "Shared intent ready", color: "#a3b836", dash: 110, duration: 500 },
  { label: "Shared context loading", color: "#65a30d", dash: 145, duration: 500 },
  { label: "Ready", color: "#22c55e", dash: 176, duration: 400 },
] as const;

const TOTAL_ARC = 176;

export function ProfileReveal({ children }: Props) {
  const [stage, setStage] = useState(0);
  const [done, setDone] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    function advance(i: number) {
      if (i < STAGES.length) {
        setStage(i);
        timeout = setTimeout(() => advance(i + 1), STAGES[i].duration);
      } else {
        setDone(true);
        timeout = setTimeout(() => setShowContent(true), 600);
      }
    }

    advance(0);
    return () => clearTimeout(timeout);
  }, []);

  if (showContent) {
    return <div className="animate-profile-enter">{children}</div>;
  }

  const current = STAGES[Math.min(stage, STAGES.length - 1)];

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background:
          "linear-gradient(135deg, #3d5a6e 0%, #5a7d8f 30%, #8aa5b5 60%, #c4d4de 100%)",
      }}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Ring */}
        <div className="relative w-20 h-20">
          <svg className="w-20 h-20" viewBox="0 0 80 80" fill="none">
            {/* Track */}
            <circle
              cx="40"
              cy="40"
              r="34"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="4.5"
            />
            {/* Progress arc */}
            <circle
              cx="40"
              cy="40"
              r="34"
              strokeWidth="4.5"
              strokeLinecap="round"
              style={{
                stroke: current.color,
                strokeDasharray: `${current.dash} ${TOTAL_ARC + 38}`,
                transform: "rotate(-90deg)",
                transformOrigin: "center",
                transition: "stroke 0.4s ease, stroke-dasharray 0.5s cubic-bezier(0.4,0,0.2,1)",
              }}
            />
          </svg>

          {/* Success checkmark */}
          {done && (
            <svg
              className="absolute inset-0 w-20 h-20 animate-check-draw"
              viewBox="0 0 80 80"
              fill="none"
            >
              <path
                d="M27 41 L35 49 L53 31"
                stroke="#22c55e"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="40"
                strokeDashoffset="40"
                className="animate-check-path"
              />
            </svg>
          )}
        </div>

        {/* Stage label */}
        <p
          className="text-xs font-medium tracking-[0.15em] uppercase transition-all duration-300"
          style={{ color: done ? "#22c55e" : "rgba(255,255,255,0.55)" }}
        >
          {done ? "Connected" : current.label}
        </p>

        {/* Stage dots */}
        <div className="flex gap-2">
          {STAGES.map((s, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full transition-all duration-300"
              style={{
                backgroundColor: i <= stage ? s.color : "rgba(255,255,255,0.2)",
                transform: i === stage && !done ? "scale(1.4)" : "scale(1)",
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes check-path {
          to { stroke-dashoffset: 0; }
        }
        .animate-check-path {
          animation: check-path 0.4s cubic-bezier(0.65, 0, 0.35, 1) 0.15s forwards;
        }
        @keyframes check-draw {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-check-draw {
          animation: check-draw 0.3s ease-out forwards;
        }
        @keyframes profile-enter {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-profile-enter {
          animation: profile-enter 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
