export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-[#fbfbfb] flex flex-col items-center justify-center px-8">
      {/* Building illustration */}
      <div className="w-full max-w-[320px] mb-10 opacity-40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/profile/building.png" alt="" className="w-full h-auto" />
      </div>

      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/profile/logo-dark.svg" alt="Intelligaia" className="h-[24px] w-auto" />
        <p className="mt-2 text-[13px] text-[#141414]/60">
          humanizing AI for enterprises
        </p>
      </div>

      {/* Spinner */}
      <div className="w-5 h-5 border-2 border-[#e5e5e5] border-t-[#ef4444] rounded-full animate-spin" />
    </div>
  );
}
