"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function SplashScreen({
  children,
}: {
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  const startFadeOut = () => {
    setFadeOut(true);
    // Waktu disesuaikan dengan transisi exit (1000ms)
    setTimeout(() => setVisible(false), 1000);
  };

  useEffect(() => {
    // Splash screen tampil selama 3.5 detik
    const timer = setTimeout(startFadeOut, 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <style>{`
        /* Gaya Vercel: Transisi sangat halus dengan kurva cubic-bezier khusus */
        
        .vercel-logo-anim {
          opacity: 0;
          transform: scale(0.8) translateY(15px);
          animation: smoothPopIn 1s cubic-bezier(0, 0.7, 0.2, 1) forwards;
        }

        @keyframes smoothPopIn {
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>

      {visible && (
        <div
          className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#0a0a0a] transition-all duration-1000 ease-in-out ${
            fadeOut ? "opacity-0 scale-105 pointer-events-none" : "opacity-100 scale-100"
          }`}
        >
          {/* Wrapper utama logo */}
          <div className="relative flex items-center justify-center z-10 vercel-logo-anim">
            <Image
              src="/image/logo.gif"
              alt="Logo SplashScreen"
              width={400}
              height={400}
              priority
              unoptimized
              className="w-48 h-48 md:w-64 md:h-64 object-contain drop-shadow-xl" 
            />
          </div>
        </div>
      )}
      {children}
    </>
  );
}