"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ConsentItem {
  id: string;
  appName: string;
  dataAccessed: string;
  status: "Active" | "Revoked";
}

const DEFAULT_ITEMS: ConsentItem[] = [
  {
    id: "c-1",
    appName: "BHIM UPI",
    dataAccessed: "SMS Token",
    status: "Active",
  },
  {
    id: "c-2",
    appName: "Mausam Weather",
    dataAccessed: "Coarse Location",
    status: "Active",
  },
  {
    id: "c-3",
    appName: "DigiLocker Verification",
    dataAccessed: "Aadhaar e-KYC Payload",
    status: "Active",
  },
  {
    id: "c-4",
    appName: "RTO Challan QuickPay",
    dataAccessed: "SMS & Accessibility Hook",
    status: "Revoked",
  },
];

export function ConsentReceiptLedger() {
  const [items, setItems] = useState<ConsentItem[]>(DEFAULT_ITEMS);

  const handleRevoke = (id: string, appName: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: "Revoked" } : item
      )
    );
    toast.error(`Consent Revoked: ${appName}`);
  };

  return (
    <div className="space-y-3 font-mono max-w-4xl mx-auto">
      {items.map((item) => {
        const isActive = item.status === "Active";
        return (
          <div
            key={item.id}
            className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-zinc-100">{item.appName}</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-1.5 py-0 font-bold",
                    isActive
                      ? "border-emerald-800 bg-emerald-950/40 text-emerald-400"
                      : "border-zinc-800 bg-zinc-900 text-zinc-500"
                  )}
                >
                  {item.status}
                </Badge>
              </div>
              <p className="text-zinc-400 text-xs">
                Data Accessed: <span className="text-zinc-200 font-semibold">{item.dataAccessed}</span>
              </p>
            </div>

            <div>
              {isActive ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => handleRevoke(item.id, item.appName)}
                  className="bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-300 font-mono text-xs h-8 px-3"
                >
                  Revoke Consent
                </Button>
              ) : (
                <span className="text-zinc-500 font-mono text-xs">Consent Revoked</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
