"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, Clock, Radio, Menu } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onMenuClick?: () => void;
  isSseConnected?: boolean;
}

export function Header({ onMenuClick, isSseConnected = true }: HeaderProps) {
  const [timeStr, setTimeStr] = useState({ ist: "", utc: "" });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const ist = now.toLocaleTimeString("en-GB", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const utc = now.toLocaleTimeString("en-GB", {
        timeZone: "UTC",
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
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-zinc-800/80 bg-zinc-950/90 px-4 backdrop-blur-md md:px-6">
      {/* Left: Logo & System Status */}
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8 text-zinc-400 hover:text-zinc-100"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="size-4" />
          </Button>
        )}

        <div className="flex items-center gap-2.5">
          <span className="font-mono text-base font-extrabold tracking-widest text-zinc-100">
            E.D.I.T.H.
          </span>
          <Badge
            variant="outline"
            className="border-zinc-800 bg-zinc-900 text-[10px] font-mono text-zinc-400 font-semibold px-2 py-0.5 rounded"
          >
            DEFENSE SOC v2.4
          </Badge>

          <div className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900/80 text-[11px] font-mono text-zinc-300">
            <span
              className={`size-1.5 rounded-full ${
                isSseConnected ? "bg-emerald-400" : "bg-amber-400"
              }`}
            />
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
              {isSseConnected ? "SYSTEM ACTIVE" : "CONNECTING..."}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Compliance Chips & Live Clock */}
      <div className="flex items-center gap-2 md:gap-3">
        <Badge
          variant="outline"
          className="hidden md:inline-flex items-center gap-1 border-zinc-800 bg-zinc-900 text-[10px] font-mono text-zinc-300 px-2 py-0.5 font-medium rounded"
        >
          <ShieldCheck className="size-3 text-emerald-400" />
          DPDP 2023 COMPLIANT
        </Badge>

        <Badge
          variant="outline"
          className="hidden lg:inline-flex items-center gap-1 border-zinc-800 bg-zinc-900 text-[10px] font-mono text-zinc-300 px-2 py-0.5 font-medium rounded"
        >
          <span className="size-1 rounded-full bg-cyan-400" />
          TRAI DLT VERIFIED
        </Badge>

        <div className="inline-flex items-center gap-1.5 border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 rounded text-[11px] font-mono text-zinc-300">
          <Clock className="size-3 text-zinc-500" />
          <span>{timeStr.ist || "--:--:--"} IST</span>
        </div>
      </div>
    </header>
  );
}
