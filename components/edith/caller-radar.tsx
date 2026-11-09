"use client";

import { useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Flame,
  Info,
  Loader2,
  MessageSquare,
  PhoneCall,
  PhoneForwarded,
  Radio,
  RotateCcw,
  Scale,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserX,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  CALLER_PRESETS,
  type CallerPreset,
  type CallerThreatResult,
} from "@/lib/edith-data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CallerRadarProps {
  onScanComplete?: (result: CallerThreatResult) => void;
}

export function CallerRadar({ onScanComplete }: CallerRadarProps) {
  const [phoneNumber, setPhoneNumber] = useState("+91 98321 00000");
  const [contextType, setContextType] = useState<"CALL" | "SMS">("SMS");
  const [messageText, setMessageText] = useState(
    "Dear consumer your electricity power will be disconnected tonight at 9:30 PM from electricity office because your previous month bill was not updated. Please immediately contact our power officer 9832100000 or pay via apk."
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [result, setResult] = useState<CallerThreatResult | null>(null);
  const [reportReference, setReportReference] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<string>("preset-1");

  const handleSelectPreset = (preset: CallerPreset) => {
    setActivePreset(preset.id);
    setPhoneNumber(preset.phoneNumber);
    setContextType(preset.contextType);
    setMessageText(preset.messageText);
    setReportReference(null);
  };

  const handleScan = async () => {
    if (!phoneNumber.trim()) {
      toast.error("Please enter a phone number to scan");
      return;
    }

    setIsLoading(true);
    setReportReference(null);
    try {
      const res = await fetch("http://localhost:5000/api/lookup-threat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber,
          messageText,
          contextType,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data = await res.json();
      if (data.result) {
        setResult(data.result);
        if (onScanComplete) {
          onScanComplete(data.result);
        }
        if (data.result.threatLevel === "CRITICAL" || data.result.threatLevel === "HIGH") {
          toast.error(`High Threat Detected: ${data.result.identifiedEntity}`);
        } else {
          toast.success("Threat Scan Complete: Clean Communication");
        }
      }
    } catch (err: any) {
      console.error("Caller threat lookup failed:", err);
      toast.error("Failed to connect to E.D.I.T.H. Threat Intelligence API");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReportChakshu = async () => {
    if (!result) return;
    setIsReporting(true);
    try {
      const res = await fetch("http://localhost:5000/api/report-chakshu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: result.phoneNumber,
          reason: `${result.spamCategory} - ${result.identifiedEntity}`,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setReportReference(data.referenceId);
        setResult((prev) =>
          prev
            ? {
                ...prev,
                chakshuReportsCount: data.newReportCount || prev.chakshuReportsCount + 1,
                reportedToChakshu: true,
                reportReferenceId: data.referenceId,
              }
            : null
        );
        toast.success(`Reported to Chakshu Portal & 1930! Ref: ${data.referenceId}`);
      }
    } catch (err) {
      toast.error("Failed to submit report to Chakshu");
    } finally {
      setIsReporting(false);
    }
  };

  const handleCopyReport = () => {
    if (!result) return;
    const text = `[E.D.I.T.H. THREAT INTELLIGENCE DOSSIER]
Phone Number: ${result.phoneNumber}
Identified Entity: ${result.identifiedEntity}
Threat Level: ${result.threatLevel} (Risk Score: ${result.riskScore}/100)
Category: ${result.spamCategory}
Telecom Circle: ${result.telecomCircle}
Chakshu Reports: ${result.chakshuReportsCount}
Recommended Action: ${result.recommendedAction}
AI Assessment: ${result.geminiAnalysis}
${reportReference ? `DoT Reference ID: ${reportReference}` : ""}`;

    navigator.clipboard.writeText(text);
    toast.success("Threat intelligence report copied to clipboard!");
  };

  const isCritical = result?.threatLevel === "CRITICAL" || result?.threatLevel === "HIGH";
  const isClean = result?.threatLevel === "LOW";

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-red-500/10 text-red-400 ring-1 ring-red-500/20">
                  <Radio className="size-4 animate-pulse text-red-400" />
                </div>
                <CardTitle className="text-xl font-bold tracking-tight">
                  Live Caller &amp; SMS Threat Intelligence
                </CardTitle>
              </div>
              <CardDescription className="mt-1 text-sm text-muted-foreground">
                AI-Powered Caller ID integrated with DoT Sanchar Saathi (Chakshu Portal) &amp; NCRP 1930 Cyber Helpline
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-cyan-500/30 bg-cyan-500/10 text-cyan-300 font-mono text-xs">
                <Sparkles className="mr-1 size-3 text-cyan-400" />
                Gemini 1.5 Threat Engine
              </Badge>
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 font-mono text-xs">
                Chakshu Live Hook
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Preset Buttons */}
          <div>
            <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Quick Test Presets (Indian Telecom Attack Vectors)
            </label>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {CALLER_PRESETS.map((preset) => {
                const isSelected = activePreset === preset.id;
                const isScam = preset.expectedType === "scam";
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={cn(
                      "flex flex-col items-start justify-between rounded-lg border p-3 text-left transition-all",
                      isSelected
                        ? isScam
                          ? "border-red-500/50 bg-red-950/30 ring-1 ring-red-500/40"
                          : "border-emerald-500/50 bg-emerald-950/30 ring-1 ring-emerald-500/40"
                        : "border-border/60 bg-muted/20 hover:border-border hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-semibold text-foreground">
                        {preset.title.split(":")[0]}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] px-1.5 py-0 h-4 font-mono",
                          isScam
                            ? "border-red-500/40 bg-red-500/10 text-red-400"
                            : "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                        )}
                      >
                        {preset.contextType}
                      </Badge>
                    </div>
                    <span className="mt-1 text-xs text-muted-foreground line-clamp-1">
                      {preset.title.split(":")[1]?.trim() || preset.phoneNumber}
                    </span>
                    <span className="mt-1.5 text-[11px] font-mono text-cyan-400">
                      {preset.phoneNumber}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4 space-y-3">
              <div>
                <label htmlFor="phone-input" className="text-xs font-medium">
                  Phone Number / Originator
                </label>
                <div className="relative mt-1">
                  <Input
                    id="phone-input"
                    value={phoneNumber}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setPhoneNumber(e.target.value);
                      setActivePreset("");
                    }}
                    placeholder="+91 98765 43210"
                    className="font-mono text-sm bg-background/50 border-border/80 pl-9"
                  />
                  <PhoneCall className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium">Context Vector</label>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={contextType === "SMS" ? "default" : "outline"}
                    onClick={() => setContextType("SMS")}
                    className={cn(
                      "text-xs font-medium",
                      contextType === "SMS" && "bg-cyan-600 hover:bg-cyan-700 text-white"
                    )}
                  >
                    <MessageSquare className="mr-1.5 size-3.5" />
                    SMS / Smishing
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={contextType === "CALL" ? "default" : "outline"}
                    onClick={() => setContextType("CALL")}
                    className={cn(
                      "text-xs font-medium",
                      contextType === "CALL" && "bg-cyan-600 hover:bg-cyan-700 text-white"
                    )}
                  >
                    <PhoneForwarded className="mr-1.5 size-3.5" />
                    Voice Call Pitch
                  </Button>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleScan}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-medium shadow-md shadow-red-950/40"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Scanning Threat Repositories...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 size-4" />
                    Scan with E.D.I.T.H. AI
                  </>
                )}
              </Button>
            </div>

            <div className="lg:col-span-8 space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="message-text" className="text-xs font-medium">
                  {contextType === "SMS" ? "Incoming SMS Body" : "Voice Call Audio Transcript"}
                </label>
                <span className="text-[11px] text-muted-foreground">
                  Analyzed for social engineering cues
                </span>
              </div>
              <Textarea
                id="message-text"
                rows={5}
                value={messageText}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                  setMessageText(e.target.value);
                  setActivePreset("");
                }}
                placeholder="Paste the SMS text or call transcript here..."
                className="font-mono text-xs bg-background/50 border-border/80 resize-none leading-relaxed"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Threat Results Card */}
      {result && (
        <Card
          className={cn(
            "border transition-all duration-300",
            isCritical
              ? "border-red-500/50 bg-gradient-to-b from-red-950/20 via-card to-card ring-1 ring-red-500/30"
              : "border-emerald-500/50 bg-gradient-to-b from-emerald-950/20 via-card to-card ring-1 ring-emerald-500/30"
          )}
        >
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-11 items-center justify-center rounded-xl",
                    isCritical
                      ? "bg-red-500/20 text-red-400 ring-1 ring-red-500/40"
                      : "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40"
                  )}
                >
                  {isCritical ? (
                    <ShieldAlert className="size-6 text-red-400 animate-pulse" />
                  ) : (
                    <ShieldCheck className="size-6 text-emerald-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-lg font-bold">
                      {result.identifiedEntity}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs font-semibold px-2 py-0.5",
                        isCritical
                          ? "border-red-500 bg-red-500/20 text-red-300"
                          : "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                      )}
                    >
                      {isCritical ? "FLAGGED FRAUDULENT" : "VERIFIED SAFE"}
                    </Badge>
                    {result.isKnownScamNetwork && (
                      <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-300 text-xs">
                        Syndicated Scam Network
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs font-mono text-muted-foreground mt-0.5">
                    Target: {result.phoneNumber} &middot; Circle: {result.telecomCircle}
                  </CardDescription>
                </div>
              </div>

              {/* Risk Gauge */}
              <div className="flex items-center gap-4 bg-muted/30 border border-border/40 rounded-xl px-4 py-2">
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Threat Level
                  </p>
                  <p
                    className={cn(
                      "text-base font-bold font-mono",
                      isCritical ? "text-red-400" : "text-emerald-400"
                    )}
                  >
                    {result.threatLevel}
                  </p>
                </div>
                <div className="h-8 w-px bg-border/60" />
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Risk Score
                  </p>
                  <p
                    className={cn(
                      "text-xl font-extrabold font-mono",
                      result.riskScore > 70
                        ? "text-red-400"
                        : result.riskScore > 30
                        ? "text-amber-400"
                        : "text-emerald-400"
                    )}
                  >
                    {result.riskScore}
                    <span className="text-xs text-muted-foreground font-normal">/100</span>
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            {/* Telecom & Sanchar Saathi Badges Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg border border-border/40 bg-background/40 p-2.5">
                <p className="text-[10px] uppercase text-muted-foreground font-semibold">
                  Chakshu Portal Reports
                </p>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span
                    className={cn(
                      "text-lg font-bold font-mono",
                      result.chakshuReportsCount > 10 ? "text-red-400" : "text-foreground"
                    )}
                  >
                    {result.chakshuReportsCount}
                  </span>
                  <span className="text-[10px] text-muted-foreground">complaints</span>
                </div>
              </div>

              <div className="rounded-lg border border-border/40 bg-background/40 p-2.5">
                <p className="text-[10px] uppercase text-muted-foreground font-semibold">
                  Spam Classification
                </p>
                <p className="mt-1 text-xs font-semibold text-foreground line-clamp-1">
                  {result.spamCategory}
                </p>
              </div>

              <div className="rounded-lg border border-border/40 bg-background/40 p-2.5">
                <p className="text-[10px] uppercase text-muted-foreground font-semibold">
                  Origin Telecom Circle
                </p>
                <p className="mt-1 text-xs font-mono text-cyan-300 line-clamp-1">
                  {result.telecomCircle}
                </p>
              </div>

              <div className="rounded-lg border border-border/40 bg-background/40 p-2.5">
                <p className="text-[10px] uppercase text-muted-foreground font-semibold">
                  Recommended Action
                </p>
                <p
                  className={cn(
                    "mt-1 text-xs font-mono font-bold",
                    result.recommendedAction === "BLOCK_AND_REPORT_1930"
                      ? "text-red-400"
                      : "text-emerald-400"
                  )}
                >
                  {result.recommendedAction}
                </p>
              </div>
            </div>

            {/* AI Behavioral Breakdown */}
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/10 p-3.5 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-cyan-400" />
                <h4 className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
                  Gemini 1.5 Threat &amp; Social Engineering Analysis
                </h4>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {result.geminiAnalysis}
              </p>
            </div>

            {/* Reporting Reference Notification */}
            {reportReference && (
              <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/20 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                  <div className="text-xs">
                    <span className="font-semibold text-emerald-300">
                      Complaint packet prepared (user files it):
                    </span>{" "}
                    <span className="font-mono text-foreground font-bold">
                      Ref #{reportReference}
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-300 text-[10px]">
                  Evidence Hash Sealed
                </Badge>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-border/40">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {isCritical && (
                  <Button
                    type="button"
                    onClick={handleReportChakshu}
                    disabled={isReporting || Boolean(reportReference)}
                    className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold w-full sm:w-auto"
                  >
                    {isReporting ? (
                      <>
                        <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                        Transmitting to Chakshu...
                      </>
                    ) : reportReference ? (
                      <>
                        <CheckCircle2 className="mr-1.5 size-3.5" />
                        Reported (Ref #{reportReference})
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="mr-1.5 size-3.5" />
                        Report to Chakshu &amp; 1930
                      </>
                    )}
                  </Button>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopyReport}
                  className="border-border text-xs w-full sm:w-auto"
                >
                  <Copy className="mr-1.5 size-3.5" />
                  Copy Dossier
                </Button>
              </div>

              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <Scale className="size-3.5 text-muted-foreground" />
                <span>Enforced under Telecom Regulatory Authority of India (TRAI) &amp; IT Act 66D</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sanchar Saathi Statutory Disclaimer Footnote */}
      <div className="flex items-start gap-2.5 rounded-lg border border-border/40 bg-muted/10 p-3 text-xs text-muted-foreground">
        <Info className="size-4 shrink-0 text-cyan-400 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-foreground">Sanchar Saathi &amp; Chakshu Protocol:</strong>{" "}
          Citizen reports submitted through E.D.I.T.H. interface directly into the Department of Telecommunications (DoT)
          fraud intelligence repository to revoke spoofed SIP trunks, IMEI blacklist compromised handsets, and alert telecom service providers (TSPs).
        </p>
      </div>
    </div>
  );
}
