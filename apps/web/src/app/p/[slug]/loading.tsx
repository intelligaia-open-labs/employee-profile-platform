export default function ProfileLoading() {
  return (
    <main
      className="min-h-screen flex items-center justify-center"
      style={{
        background:
          "linear-gradient(135deg, #3d5a6e 0%, #5a7d8f 30%, #8aa5b5 60%, #c4d4de 100%)",
      }}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Animated ring loader */}
        <div className="relative w-16 h-16">
          <svg
            className="w-16 h-16 animate-loader-spin"
            viewBox="0 0 64 64"
            fill="none"
          >
            {/* Background track */}
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="4"
            />
            {/* Animated arc */}
            <circle
              cx="32"
              cy="32"
              r="28"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="120 176"
              className="animate-loader-color"
              style={{ transformOrigin: "center" }}
            />
          </svg>
        </div>

        {/* Stage label */}
        <p className="text-white/60 text-xs font-medium tracking-[0.15em] uppercase animate-loader-text">
          Loading profile
        </p>
      </div>

      <style>{`
        @keyframes loader-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes loader-color {
          0%, 10% {
            stroke: #ef4444;
            stroke-dasharray: 40 176;
          }
          25% {
            stroke: #ef4444;
            stroke-dasharray: 70 176;
          }
          40% {
            stroke: #d4a017;
            stroke-dasharray: 100 176;
          }
          55% {
            stroke: #a3b836;
            stroke-dasharray: 120 176;
          }
          70% {
            stroke: #65a30d;
            stroke-dasharray: 140 176;
          }
          85% {
            stroke: #22c55e;
            stroke-dasharray: 155 176;
          }
          100% {
            stroke: #22c55e;
            stroke-dasharray: 170 176;
          }
        }

        @keyframes loader-text-fade {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.3; }
        }

        .animate-loader-spin {
          animation: loader-spin 1.1s linear infinite;
        }

        .animate-loader-color {
          animation: loader-color 2.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        .animate-loader-text {
          animation: loader-text-fade 1.6s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}
