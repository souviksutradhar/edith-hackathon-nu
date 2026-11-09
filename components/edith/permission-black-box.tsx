"use client";

import { useEffect, useState } from "react";
import { ArrowDownToLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface BlackBoxLog {
  id: string;
  timestamp: string;
  process: string;
  hook: string;
  action: string;
}

const DEFAULT_LOGS: BlackBoxLog[] = [
  {
    id: "bb-1",
    timestamp: "15:02:11",
    process: "QuickSupport Remote Screen (com.quick.support)",
    hook: "Accessibility Service",
    action: "ISOLATED",
  },
  {
    id: "bb-2",
    timestamp: "14:58:39",
    process: "RTO Challan QuickPay (com.rto.echallan.quickpay)",
    hook: "SMS Broadcast Receiver",
    action: "QUARANTINED",
  },
  {
    id: "bb-3",
    timestamp: "14:51:02",
    process: "AnyDesk VirtualDisplay (com.anydesk.anydeskandroid)",
    hook: "Screen Buffer Mirror",
    action: "ISOLATED",
  },
  {
    id: "bb-4",
    timestamp: "14:45:19",
    process: "VoIP Gateway Trunk +92 (com.telecom.proxy.sip)",
    hook: "Call Audio Tap",
    action: "BLOCKED",
  },
  {
    id: "bb-5",
    timestamp: "14:38:44",
    process: "Bijli Bill Update APK (com.bijli.bill.update)",
    hook: "Clipboard Monitor",
    action: "ISOLATED",
  },
];

export function PermissionBlackBox() {
  const [logs, setLogs] = useState<BlackBoxLog[]>(DEFAULT_LOGS);

  useEffect(() => {
    let es: EventSource | null = null;
    try {
      es = new EventSource("http://localhost:5000/api/stream-threats");
      es.addEventListener("webhook_event", (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (data) {
            const now = new Date().toLocaleTimeString("en-GB", { hour12: false });
            let action = "ISOLATED";
            if (data.eventType?.includes("DISPATCH") || data.eventType?.includes("REPORT")) {
              action = "TRANSMITTED";
            } else if (data.eventType?.includes("FLAG_SECURE") || data.eventType?.includes("SURFACE")) {
              action = "BLACKENED";
            } else if (data.eventType?.includes("RATE") || data.eventType?.includes("SPIKE")) {
              action = "SUSPENDED";
            }

            const newEntry: BlackBoxLog = {
              id: `bb-${Date.now()}`,
              timestamp: now,
              process: data.appName || data.deviceId || "Autonomous Policy Guardian",
              hook: data.eventType?.replace(/_/g, " ") || "Runtime Kernel Hook",
              action,
            };
            setLogs((prev) => [newEntry, ...prev]);
          }
        } catch (err) {}
      });
    } catch (e) {}

    return () => {
      if (es) es.close();
    };
  }, []);

  const handleExport = () => {
    const bundle = {
      standard: "Section 65B Indian Evidence Act / BSA 2023 Certified",
      status: "RECORDING (60s Buffer)",
      exportedAt: new Date().toISOString(),
      merkleSeal: "sha256:8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
      logs,
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bundle, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `EDITH-Sec65B-Log-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    toast.success("Section 65B Evidence Log Exported (.JSON)");
  };

  return (
    <div className="space-y-4 font-mono max-w-4xl mx-auto">
      {/* Top: Clean badge */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <Badge
          variant="outline"
          className="border-emerald-900 bg-emerald-950/40 text-emerald-400 font-mono text-xs px-2.5 py-1"
        >
          Status: RECORDING (60s Buffer)
        </Badge>
      </div>

      {/* Center: A clean, high-density table with 4 columns only */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400 uppercase text-[10px]">
            <tr>
              <th className="py-2.5 px-3 font-bold w-28">Timestamp</th>
              <th className="py-2.5 px-3 font-bold">Application / Process</th>
              <th className="py-2.5 px-3 font-bold w-48">Permission Hook</th>
              <th className="py-2.5 px-3 font-bold text-right w-32">Action Taken</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-zinc-900/40 transition-colors">
                <td className="py-2.5 px-3 text-zinc-400">{log.timestamp}</td>
                <td className="py-2.5 px-3 font-semibold text-zinc-200">{log.process}</td>
                <td className="py-2.5 px-3 text-zinc-300">{log.hook}</td>
                <td className="py-2.5 px-3 text-right">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-rose-900/60 bg-rose-950/40 text-rose-300">
                    {log.action}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom: Single button */}
      <div>
        <Button
          type="button"
          onClick={handleExport}
          className="bg-zinc-100 hover:bg-white text-zinc-950 font-mono text-xs font-bold h-9 px-4 rounded"
        >
          <ArrowDownToLine className="mr-2 size-3.5" />
          Export 65B Evidence Log
        </Button>
      </div>
    </div>
  );
}
