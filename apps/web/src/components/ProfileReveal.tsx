"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

const STAGES = [
  { duration: 600 },
  { duration: 700 },
  { duration: 600 },
  { duration: 500 },
  { duration: 400 },
] as const;

export function ProfileReveal({ children }: Props) {
  const [stage, setStage] = useState(0);
  const [animDone, setAnimDone] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [showContent, setShowContent] = useState(false);

  // Animation timer
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    function advance(i: number) {
      if (i < STAGES.length) {
        setStage(i);
        timeout = setTimeout(() => advance(i + 1), STAGES[i].duration);
      } else {
        setAnimDone(true);
      }
    }
    advance(0);
    return () => clearTimeout(timeout);
  }, []);

  // Wait for all images in the profile to load
  const contentRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node || imagesLoaded) return;
      const imgs = node.querySelectorAll("img");
      if (imgs.length === 0) {
        setImagesLoaded(true);
        return;
      }
      let loaded = 0;
      const total = imgs.length;
      const check = () => {
        loaded++;
        if (loaded >= total) setImagesLoaded(true);
      };
      imgs.forEach((img) => {
        if (img.complete) {
          check();
        } else {
          img.addEventListener("load", check, { once: true });
          img.addEventListener("error", check, { once: true });
        }
      });
    },
    [imagesLoaded],
  );

  // Show content when both animation AND images are done
  useEffect(() => {
    if (animDone && imagesLoaded) {
      const t = setTimeout(() => setShowContent(true), 300);
      return () => clearTimeout(t);
    }
  }, [animDone, imagesLoaded]);

  return (
    <>
      {/* Hidden: render children so images start loading */}
      <div
        ref={contentRef}
        style={{
          position: "fixed",
          top: "-9999px",
          left: "-9999px",
          visibility: "hidden",
          pointerEvents: "none",
        }}
      >
        {children}
      </div>

      {showContent ? (
        <div className="animate-content-enter">{children}</div>
      ) : (
        <div className="min-h-screen bg-[#fbfbfb] flex flex-col items-center justify-center px-8">
          {/* Building illustration */}
          <div className="relative w-full max-w-[320px] mb-4 animate-building-float">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/profile/building.png"
              alt=""
              className="w-full h-auto"
              style={{
                opacity: animDone ? 1 : 0.6 + stage * 0.08,
                transition: "opacity 0.5s ease",
              }}
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `linear-gradient(to right, rgba(251,251,251,${animDone ? 0 : 0.5 - stage * 0.1}) 0%, rgba(251,251,251,0) 50%)`,
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

          {/* Loading indicator — only if animation done but images still loading */}
          {animDone && !imagesLoaded && (
            <div className="flex items-center gap-2 text-[12px] text-[#141414]/40">
              <div className="w-4 h-4 border-2 border-[#e0e0e0] border-t-[#141414] rounded-full animate-spin" />
              Loading profile...
            </div>
          )}

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
      )}
    </>
  );
}
