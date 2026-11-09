"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function PrivacyDoppelganger() {
  const [emulationActive, setEmulationActive] = useState(true);

  const toggleEmulation = () => {
    const next = !emulationActive;
    setEmulationActive(next);
    if (next) {
      toast.success("Decoy Emulation ON");
    } else {
      toast.warning("Decoy Emulation OFF");
    }
  };

  return (
    <div className="space-y-6 font-mono max-w-4xl mx-auto">
      {/* Center: Toggle Decoy Emulation ON/OFF */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <span className="text-xs text-zinc-400 font-bold uppercase">
          Decoy Emulation Status:
        </span>
        <Button
          type="button"
          size="sm"
          onClick={toggleEmulation}
          className={cn(
            "font-mono text-xs font-bold h-8 px-4 border rounded",
            emulationActive
              ? "bg-emerald-950/60 hover:bg-emerald-900 border-emerald-800 text-emerald-300"
              : "bg-zinc-900 hover:bg-zinc-800 border-zinc-700 text-zinc-400"
          )}
        >
          {emulationActive ? "Decoy Emulation: ON" : "Decoy Emulation: OFF"}
        </Button>
      </div>

      {/* Clean 2-column split with NO fluff */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Real Identity -> Protected */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 space-y-2">
          <span className="text-xs uppercase text-zinc-400 font-bold block">
            Real Identity
          </span>
          <p className="text-lg font-black text-emerald-400">
            Protected
          </p>
          <p className="text-xs text-zinc-500">
            Hardware device ID, primary address book, and live GPS masked.
          </p>
        </div>

        {/* Right: Canary Sandbox -> Active Decoy Contacts (154) | Decoy Balance (₹140) */}
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 space-y-2">
          <span className="text-xs uppercase text-zinc-400 font-bold block">
            Canary Sandbox
          </span>
          <p className="text-sm font-bold text-zinc-100">
            Active Decoy Contacts (154) | Decoy Balance (₹140)
          </p>
          <p className="text-xs text-zinc-500">
            Honeypot synthetic persona fed to unauthorized scrapers.
          </p>
        </div>
      </div>
    </div>
  );
}
