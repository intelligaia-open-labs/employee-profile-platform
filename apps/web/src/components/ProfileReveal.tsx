"use client";

import { useState, useEffect, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

const STAGES = [
  { label: "Initializing", color: "#ef4444", dash: 35, duration: 600 },
  { label: "Shared intent arriving", color: "#d4a017", dash: 75, duration: 700 },
  { label: "Shared intent ready", color: "#a3b836", dash: 115, duration: 600 },
  { label: "Shared context loading", color: "#65a30d", dash: 150, duration: 500 },
  { label: "Ready", color: "#22c55e", dash: 176, duration: 400 },
] as const;

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
        timeout = setTimeout(() => setShowContent(true), 700);
      }
    }

    advance(0);
    return () => clearTimeout(timeout);
  }, []);

  if (showContent) {
    return <div className="animate-content-enter">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[#fbfbfb] flex flex-col items-center justify-center px-8">
      {/* Building illustration */}
      <div className="relative w-full max-w-[320px] mb-10 animate-building-float">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/profile/building.png"
          alt=""
          className="w-full h-auto"
          style={{
            opacity: done ? 1 : 0.6 + stage * 0.08,
            transition: "opacity 0.5s ease",
          }}
        />
        {/* Fade overlay — clears as loading progresses */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `linear-gradient(to right, rgba(251,251,251,${done ? 0 : 0.5 - stage * 0.1}) 0%, rgba(251,251,251,0) 50%)`,
            transition: "all 0.5s ease",
          }}
        />
      </div>

      {/* Logo + tagline */}
      <div className="flex flex-col items-center mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/profile/logo-dark.svg"
          alt="Intelligaia"
          className="h-[24px] w-auto"
        />
        <p className="mt-2 text-[13px] text-[#141414]/60 font-normal">
          humanizing AI for enterprises
        </p>
      </div>


      <style>{`
        @keyframes building-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .animate-building-float {
          animation: building-float 3s ease-in-out infinite;
        }
@keyframes content-enter {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-content-enter {
          animation: content-enter 0.5s ease forwards;
        }
      `}</style>
    </div>
  );
}
