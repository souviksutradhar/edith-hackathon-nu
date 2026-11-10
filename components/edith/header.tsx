"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Clock, Menu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onMenuClick?: () => void;
  isSseConnected?: boolean;
}

export function Header({ onMenuClick, isSseConnected = true }: HeaderProps) {
  const [mounted, setMounted] = useState(false);
  const [timeStr, setTimeStr] = useState({ ist: "", utc: "" });

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      const ist = now.toLocaleTimeString("en-GB", {
        timeZone: "Asia/Kolkata",
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const utc = now.toLocaleTimeString("en-GB", {
        timeZone: "UTC",
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setTimeStr({ ist, utc });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E6E1FA] bg-[#F4F2FF]/80 px-4 backdrop-blur-md md:px-6">
      {/* Left: Logo & System Status */}
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8 text-[#5E5A7A] hover:text-[#15122B]"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="size-4" />
          </Button>
        )}

        <div className="flex items-center gap-3">
          <span className="text-base font-extrabold tracking-tight text-[#15122B]">
            E.D.I.T.H. Command Center
          </span>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E3F6EE] text-[#12704A] border border-[#1E9E6A]/20 text-xs font-semibold">
            <span className="size-1.5 rounded-full bg-[#1E9E6A]" />
            SOC Active
          </span>
        </div>
      </div>

      {/* Right: Simulated Device Badge & IST Clock */}
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ECE8FF] text-[#5B35F5] px-3 py-1 text-xs font-semibold">
          <span className="size-1.5 rounded-full bg-[#5B35F5]" />
          Simulated device
        </span>

        <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-[#E6E1FA] bg-white px-3 py-1 text-xs font-medium text-[#5E5A7A]">
          <Clock className="size-3 text-[#5E5A7A]" />
          <span className="font-mono" suppressHydrationWarning>
            {mounted && timeStr.ist ? `${timeStr.ist} IST` : "--:--:-- IST"}
          </span>
        </div>
      </div>
    </header>
  );
}
