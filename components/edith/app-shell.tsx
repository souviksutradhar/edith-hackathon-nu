"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { Loader2, Play, Radio, RotateCcw, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AboutView } from "@/components/edith/about-view"
import { AccessLog } from "@/components/edith/access-log"
import { AppsTable } from "@/components/edith/apps-table"
import { CallerRadar } from "@/components/edith/caller-radar"
import { ConsentReceiptLedger } from "@/components/edith/consent-receipt"
import { DossierModal } from "@/components/edith/dossier-modal"
import { Header } from "@/components/edith/header"
import { KpiCards } from "@/components/edith/kpi-cards"
import { LiveAttackDemo } from "@/components/edith/live-attack-demo"
import { MobileShield } from "@/components/edith/mobile-shield"
import { PermissionBlackBox } from "@/components/edith/permission-black-box"
import { PrivacyDoppelganger } from "@/components/edith/privacy-doppelganger"
import { RecommendationsView } from "@/components/edith/recommendations-view"
import { ScamRadar } from "@/components/edith/scam-radar"
import { ScamTriageView } from "@/components/edith/scam-triage-view"
import { SettingsView } from "@/components/edith/settings-view"
import { Sidebar, type ViewId } from "@/components/edith/sidebar"
import { ThreatAlert, type ThreatState } from "@/components/edith/threat-alert"
import { ThreatModal } from "@/components/edith/threat-modal"
import { SimulationProvider, useSimulation } from "@/lib/simulation-context"
import {
  formatTime,
  liveResources,
  recommendations,
  type AccessLogEntry,
  type ComplaintDossier,
  type ConnectedApp,
  type DeviceTelemetry,
  type LogResult,
  type ThreatAnalysis,
} from "@/lib/edith-data"
import { cn } from "@/lib/utils"

const viewTitles: Record<ViewId, string> = {
  "radar-triage": "Live Attack Demo",
  "black-box": "Incident Black Box",
  "consent-ledger": "Consent Ledger",
  "privacy-doppelganger": "Privacy Doppelganger",
  dashboard: "Live Attack Demo",
  radar: "Scam Kill-Chain Radar",
  "caller-radar": "Caller & SMS Threat Intelligence",
  "consent-receipts": "Consent Ledger",
  doppelganger: "Privacy Doppelganger",
  "mobile-shield": "Mobile Shield",
  apps: "Connected Applications",
  logs: "Activity Logs",
  recommendations: "Security Recommendations",
  settings: "Settings",
  about: "About E.D.I.T.H.",
}


export function AppShell() {
  return (
    <SimulationProvider>
      <AppShellInner />
    </SimulationProvider>
  )
}

function AppShellInner() {
  const [view, setView] = useState<ViewId>("radar-triage")
  const [query, setQuery] = useState("")
  const [menuOpen, setMenuOpen] = useState(false)
  const [apps, setApps] = useState<ConnectedApp[]>([])
  const [logs, setLogs] = useState<AccessLogEntry[]>([])
  const [telemetry, setTelemetry] = useState<DeviceTelemetry | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isTelemetryLoading, setIsTelemetryLoading] = useState<boolean>(false)
  const [activeThreat, setActiveThreat] = useState<ThreatAnalysis | null>(null)
  const [showThreatModal, setShowThreatModal] = useState<boolean>(false)
  const [isSimulating, setIsSimulating] = useState<boolean>(false)
  const [dismissed, setDismissed] = useState<string[]>([])

  // Shared simulation state from context
  const { runSimulation, resetSimulation, isRunning, events, hasRun } = useSimulation()

  const allActivityLogs: AccessLogEntry[] = useMemo(() => {
    if (!hasRun || events.length === 0) return []
    return events.map((e) => ({
      id: e.id,
      time: e.timestamp,
      app: e.app,
      resource: e.hook,
      result: (e.severity === "critical"
        ? "Blocked"
        : e.severity === "warning"
        ? "Flagged"
        : "Allowed") as LogResult,
      details: e.details,
    }))
  }, [events, hasRun])

  // Radar State
  const [radarStage, setRadarStage] = useState<number>(0)
  const [dossier, setDossier] = useState<ComplaintDossier | null>(null)
  const [hinglishWarning, setHinglishWarning] = useState<string>(
    "चेतावनी: 'RTO Challan QuickPay' ऐप आपके बैंक OTP और गोपनीय मैसेज पढ़ने की कोशिश कर रहा था। E.D.I.T.H. ने इस फ़ेक ऐप को तुरंत फ़्रीज़ (ब्लॉक) कर दिया है।"
  )
  const [showDossierModal, setShowDossierModal] = useState<boolean>(false)

  const activeDossier: ComplaintDossier = useMemo(() => {
    return (
      dossier || {
        dossierId: "EDITH-2026-IN-8941",
        generatedAt: "17:05:14 IST",
        reportingPortal: "National Cybercrime Reporting Portal (https://cybercrime.gov.in)",
        helpline: "1930 (Toll-Free 24x7 Citizen Cyber Defense)",
        targetApp: {
          name: "RTO Challan QuickPay / Telecom Disconnection Scheme",
          packageName: "com.rto.echallan.quickpay.apk",
          sha256: "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
          installSource: "WhatsApp / Direct APK Sideload",
          declaredPurpose: "Utility / Challan Payment Gateway",
          actualAbusePattern: "Impersonation of State Authority to coerce victim funds via fake urgency",
        },
        victimEndpoint: {
          device: "Android Zero-Trust Node (Host Shield)",
          osBuild: "Android 14 (Security Patch Level: 2026-11)",
          agentStatus: "CONTAINED & PROTECTED",
        },
        exfiltratedTargetData: [
          "Originating MSISDN: +91 98321 00000",
          "Statutory Violation: Unregistered 10-Digit MSISDN (TRAI TCCCPR non-compliant)",
          "Coercive Vector: Artificial 9:30 PM cutoff timeline",
        ],
        killSwitchMitigationsApplied: [
          "Isolated & blacklisted offending route",
          "Section 65B Electronic Record Forensic Certificate generated",
          "Incident mapped to BNS § 318(4) and IT Act § 66D",
        ],
        applicableLaws: [
          {
            section: "BNS § 318(4)",
            act: "Bharatiya Nyaya Sanhita 2023",
            offense: "Cheating by Personation",
            penalty: "Imprisonment up to 3-5 years and fine",
          },
          {
            section: "IT Act § 66D",
            act: "Information Technology Act 2000",
            offense: "Punishment for cheating by personation by using computer resource",
            penalty: "Imprisonment up to 3 years and fine up to ₹1,00,000",
          },
        ],
        victimGuidance:
          "DO NOT pay any money, call the unverified phone number, or install APKs. Official utilities only send SMS with registered 6-character TRAI headers (e.g. BZ-TSECLP). Forward this dossier to cybercrime.gov.in or call 1930.",
      }
    )
  }, [dossier])

  // Server-Sent Events (SSE) & External Webhook State
  const [isSseConnected, setIsSseConnected] = useState<boolean>(false)
  const [isWebhookSending, setIsWebhookSending] = useState<boolean>(false)
  const [lastWebhookEvent, setLastWebhookEvent] = useState<any | null>(null)

  // 1. Fetch initial state on component load from live Express backend
  useEffect(() => {
    let isMounted = true
    const fetchInitialData = async () => {
      setIsLoading(true)
      try {
        const [appsRes, logsRes, telemetryRes, radarRes] = await Promise.all([
          fetch("http://localhost:5000/api/apps"),
          fetch("http://localhost:5000/api/logs"),
          fetch("http://localhost:5000/api/device-telemetry"),
          fetch("http://localhost:5000/api/radar/state"),
        ])

        if (appsRes.ok) {
          const appsData = await appsRes.json()
          if (isMounted && Array.isArray(appsData)) {
            setApps(appsData)
          }
        }

        if (logsRes.ok) {
          const logsData = await logsRes.json()
          if (isMounted && Array.isArray(logsData)) {
            setLogs(logsData)
          }
        }

        if (telemetryRes.ok) {
          const telemData = await telemetryRes.json()
          if (isMounted && telemData.telemetry) {
            setTelemetry(telemData.telemetry)
          }
        }

        if (radarRes.ok) {
          const radarData = await radarRes.json()
          if (isMounted) {
            setRadarStage(radarData.currentStage || 0)
            if (radarData.dossier) setDossier(radarData.dossier)
            if (radarData.hinglishWarning) setHinglishWarning(radarData.hinglishWarning)
          }
        }
      } catch (err) {
        console.error("Failed to load initial data from E.D.I.T.H. backend:", err)
        toast.error("Could not connect to E.D.I.T.H. backend on http://localhost:5000")
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchInitialData()
    return () => {
      isMounted = false
    }
  }, [])

  // 1.5 Server-Sent Events (SSE) Stream Listener for Real-Time External Webhooks & Threat Telemetry
  useEffect(() => {
    let eventSource: EventSource | null = null
    let reconnectTimer: any = null

    const initSSE = () => {
      try {
        eventSource = new EventSource("http://localhost:5000/api/stream-threats")

        eventSource.onopen = () => {
          setIsSseConnected(true)
        }

        eventSource.addEventListener("connected", () => {
          setIsSseConnected(true)
        })

        eventSource.addEventListener("webhook_event", (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data)
            setLastWebhookEvent(data)
            toast.error(`External Webhook Ingested: ${data.eventType}`, {
              description: `Device: ${data.deviceId} &middot; ${data.details || data.appName}`,
              duration: 5000,
            })
            if (data.telemetry) setTelemetry(data.telemetry)
            if (data.log) setLogs((prev) => [data.log, ...prev])
          } catch (err) {
            console.error("Failed to parse webhook SSE event:", err)
          }
        })

        eventSource.addEventListener("radar_step", (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data)
            setRadarStage(data.currentStage)
            if (data.apps) setApps(data.apps)
            if (data.dossier) setDossier(data.dossier)
            if (data.hinglishWarning) setHinglishWarning(data.hinglishWarning)
            if (data.logs) setLogs(data.logs)
            if (data.telemetry) setTelemetry(data.telemetry)
          } catch (err) {
            console.error("Failed to parse radar_step SSE:", err)
          }
        })

        eventSource.addEventListener("radar_reset", (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data)
            setRadarStage(0)
            if (data.apps) setApps(data.apps)
            if (data.telemetry) setTelemetry(data.telemetry)
            if (data.logs) setLogs(data.logs)
            setDossier(null)
          } catch (err) {
            console.error("Failed to parse radar_reset SSE:", err)
          }
        })

        eventSource.addEventListener("rat_attack", (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data)
            if (data.telemetry) setTelemetry(data.telemetry)
            if (data.logs) setLogs(data.logs)
          } catch (err) {
            console.error("Failed to parse rat_attack SSE:", err)
          }
        })

        eventSource.addEventListener("device_reset", (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data)
            if (data.telemetry) setTelemetry(data.telemetry)
            if (data.logs) setLogs(data.logs)
          } catch (err) {
            console.error("Failed to parse device_reset SSE:", err)
          }
        })

        eventSource.addEventListener("telemetry_update", (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data)
            setTelemetry(data)
          } catch (err) {
            console.error("Failed to parse telemetry_update SSE:", err)
          }
        })

        eventSource.addEventListener("apps_update", (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data)
            if (data.updated_apps) setApps(data.updated_apps)
            if (data.logs) setLogs(data.logs)
          } catch (err) {
            console.error("Failed to parse apps_update SSE:", err)
          }
        })

        eventSource.addEventListener("log_entry", (e: MessageEvent) => {
          try {
            const log = JSON.parse(e.data)
            setLogs((prev) => [log, ...prev])
          } catch (err) {
            console.error("Failed to parse log_entry SSE:", err)
          }
        })

        eventSource.onerror = () => {
          setIsSseConnected(false)
          if (eventSource) {
            eventSource.close()
          }
          reconnectTimer = setTimeout(initSSE, 4000)
        }
      } catch (err) {
        setIsSseConnected(false)
      }
    }

    initSSE()

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer)
      if (eventSource) eventSource.close()
    }
  }, [])

  // Webhook Simulator Action
  const handleSimulateWebhook = async () => {
    try {
      setIsWebhookSending(true)
      const res = await fetch("http://localhost:5000/api/webhook/device-event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: "External-Android-Pixel7A",
          eventType: "REMOTE_ACCESS_TAKEOVER_ATTEMPT",
          appName: "Bijli_Bill_Update.apk",
          packageName: "com.bijli.bill.update",
          details: "Unauthorized Accessibility Hook: Attempting to scrape SBI OTP during incoming call from +91-98765-XXXXX",
          threatLevel: "CRITICAL",
          telephonyState: "CALL_ACTIVE (Incoming from +91-98765-XXXXX)",
          remoteAccessService: "AnyDesk Screen Mirror Session Active",
          accessibilityStatus: "ACCESSIBILITY_SCRAPING_EVENTS",
          foregroundApp: "com.phonepe.app",
        }),
      })

      if (res.ok) {
        toast.success("External Device Webhook Dispatched!", {
          description: "Payload delivered to backend & broadcasted across SSE to live UI.",
        })
      }
    } catch (err) {
      toast.error("Failed to dispatch webhook payload")
    } finally {
      setIsWebhookSending(false)
    }
  }

  // 2. Scam Kill-Chain Radar Step Simulator
  const handleRadarStep = async (stage?: number) => {
    try {
      const res = await fetch("http://localhost:5000/api/radar/simulate-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stage !== undefined ? { stage } : {}),
      })

      const data = await res.json()
      if (data.success) {
        setRadarStage(data.currentStage)
        if (data.apps) setApps(data.apps)
        if (data.logs) setLogs(data.logs)
        if (data.dossier) setDossier(data.dossier)
        if (data.hinglishWarning) setHinglishWarning(data.hinglishWarning)

        if (data.currentStage === 5) {
          toast.error("AUTO-FREEZE EXECUTED: RTO Challan QuickPay Neutralized!", {
            id: "radar-step",
            description: "Permissions revoked. 1930 Cyber Complaint Dossier generated.",
          })
          setShowDossierModal(true)
        } else if (data.currentStage >= 3) {
          toast.warning(`[Stage ${data.currentStage}] ${data.stageInfo?.label}`, {
            id: "radar-step",
            description: data.stageInfo?.description,
          })
        } else {
          toast(`[Stage ${data.currentStage}] ${data.stageInfo?.label}`, {
            id: "radar-step",
            description: data.stageInfo?.description,
          })
        }
      }
    } catch (err) {
      console.error("Radar step failed:", err)
      toast.error("Failed to advance radar kill-chain")
    }
  }

  // 3. Reset Radar Simulator
  const handleRadarReset = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/radar/reset", {
        method: "POST",
      })
      const data = await res.json()
      if (data.success) {
        setRadarStage(0)
        if (data.apps) setApps(data.apps)
        if (data.telemetry) setTelemetry(data.telemetry)
        if (data.logs) setLogs(data.logs)
        setDossier(null)
        toast.success("Radar Environment Reset to Stage 0 (Baseline Secure)")
      }
    } catch (err) {
      console.error("Radar reset error:", err)
      toast.error("Failed to reset radar environment")
    }
  }

  // 4. RAT & Screen Takeover Attack Simulation (calls POST /api/simulate-rat-takeover)
  const handleSimulateRATAttack = async () => {
    try {
      setIsTelemetryLoading(true)
      toast.loading("Correlating AnyDesk, Offhook Call & Accessibility Telemetry with Gemini...", {
        id: "rat-sim",
      })

      const res = await fetch("http://localhost:5000/api/simulate-rat-takeover", {
        method: "POST",
      })

      const data = await res.json()
      if (data.success) {
        if (data.telemetry) setTelemetry(data.telemetry)
        if (data.logs) setLogs(data.logs)

        toast.error("CRITICAL FRAUD VECTOR DETECTED: RAT Takeover Mitigated!", {
          id: "rat-sim",
          description: data.ai_response?.incident_summary || "Automated kill-switch terminated screen mirror.",
        })
      } else {
        toast.error("Failed to simulate RAT attack", { id: "rat-sim", description: data.error })
      }
    } catch (err) {
      console.error("RAT simulation error:", err)
      toast.error("Failed to simulate RAT attack on backend", { id: "rat-sim" })
    } finally {
      setIsTelemetryLoading(false)
    }
  }

  // 5. Reset Device Telemetry (calls POST /api/reset-device)
  const handleResetDevice = async () => {
    try {
      setIsTelemetryLoading(true)
      const res = await fetch("http://localhost:5000/api/reset-device", {
        method: "POST",
      })
      const data = await res.json()
      if (data.success) {
        if (data.telemetry) setTelemetry(data.telemetry)
        if (data.logs) setLogs(data.logs)
        toast.success("Zero-Trust Device Telemetry Reset", {
          description: "Endpoint health restored to SECURE baseline (95/100).",
        })
      }
    } catch (err) {
      console.error("Reset device error:", err)
      toast.error("Failed to reset device telemetry")
    } finally {
      setIsTelemetryLoading(false)
    }
  }

  // 6. Quarantine Action (calls POST /api/apps/:id/quarantine)
  const handleQuarantine = async (app: ConnectedApp) => {
    try {
      toast.loading(`Quarantining & Freezing ${app.name}...`, { id: "quarantine-op" })
      const res = await fetch(`http://localhost:5000/api/apps/${app.id}/quarantine`, {
        method: "POST",
      })
      const data = await res.json()
      if (data.success) {
        if (data.updated_apps) setApps(data.updated_apps)
        if (data.logs) setLogs(data.logs)
        toast.success(`${app.name} Frozen`, {
          id: "quarantine-op",
          description: "Permissions revoked and application isolated.",
        })
      } else {
        toast.error(`Quarantine failed: ${data.error}`, { id: "quarantine-op" })
      }
    } catch (err) {
      console.error("Quarantine error:", err)
      toast.error(`Failed to quarantine ${app.name}`, { id: "quarantine-op" })
    }
  }

  // 7. Restore Action (calls POST /api/apps/:id/restore)
  const handleRestore = async (app: ConnectedApp) => {
    try {
      toast.loading(`Restoring ${app.name}...`, { id: "restore-op" })
      const res = await fetch(`http://localhost:5000/api/apps/${app.id}/restore`, {
        method: "POST",
      })
      const data = await res.json()
      if (data.success) {
        if (data.updated_apps) setApps(data.updated_apps)
        if (data.logs) setLogs(data.logs)

        toast.success(`${app.name} Restored`, {
          id: "restore-op",
          description: "Status reset to Active with restored baseline trust score.",
        })
      } else {
        toast.error(`Restore failed: ${data.error}`, { id: "restore-op" })
      }
    } catch (err) {
      console.error("Restore error:", err)
      toast.error(`Failed to restore ${app.name}`, { id: "restore-op" })
    }
  }

  // Dynamic KPI metrics
  const criticalAlerts = useMemo(() => {
    const appAlerts = apps.filter((a) => a.status === "Frozen" || a.status === "Warning" || (a.trustScore && a.trustScore < 60)).length
    const ratAlert = telemetry && telemetry.trust_score < 50 ? 1 : 0
    return appAlerts + ratAlert
  }, [apps, telemetry])

  const trustScore = useMemo(() => {
    const rtoApp = apps.find((a) => a.name === "RTO Challan QuickPay")
    if (rtoApp) return rtoApp.trustScore
    if (apps.length === 0) return 96
    return Math.round(apps.reduce((acc, a) => acc + (a.trustScore ?? 0), 0) / apps.length)
  }, [apps])

  const openRecommendations = recommendations.filter((r) => !dismissed.includes(r.id)).length

  const handleManage = (app: ConnectedApp) => {
    toast(`Auditing ${app.name}`, {
      description: `Declared Purpose: ${app.declaredPurpose || "Utility"} &middot; Trust Score: ${app.trustScore}/100.`,
    })
  }

  const handleApplyRecommendation = (id: string, title: string) => {
    const target = apps.find((a) => a.name === "RTO Challan QuickPay") || apps[2]
    if (target) {
      handleQuarantine(target)
    }
    toast.success("Recommendation applied", { description: title })
    setDismissed((prev) => [...prev, id])
  }

  const handleNavigate = (next: ViewId) => {
    setView(next)
    setMenuOpen(false)
  }

  const handleNotifications = () => {
    setView("dashboard")
    if (criticalAlerts > 0) {
      if (radarStage >= 3) {
        setShowDossierModal(true)
      }
      toast.error(`${criticalAlerts} critical incident(s) detected`, {
        description: "Review compromised apps and Scam Radar dossier.",
      })
    } else {
      toast("No new notifications", { description: "All systems operating normally." })
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar Navigation */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-sidebar-border lg:block">
        <Sidebar active={view} onNavigate={handleNavigate} recommendationCount={openRecommendations} />
      </aside>

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          menuOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          tabIndex={menuOpen ? 0 : -1}
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
          className={cn(
            "absolute inset-0 bg-black/60 transition-opacity",
            menuOpen ? "opacity-100" : "opacity-0",
          )}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-64 border-r border-sidebar-border transition-transform",
            menuOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <Sidebar active={view} onNavigate={handleNavigate} recommendationCount={openRecommendations} />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="lg:pl-64">
        <Header
          isSseConnected={isSseConnected}
          onMenuClick={() => setMenuOpen(true)}
        />

        <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
          {/* Header Row for Secondary Views without custom PageHeader */}
          {view !== "radar-triage" &&
            view !== "dashboard" &&
            view !== "black-box" &&
            view !== "consent-ledger" &&
            view !== "consent-receipts" &&
            view !== "privacy-doppelganger" &&
            view !== "doppelganger" &&
            view !== "logs" && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-800/80 pb-3">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-zinc-100">{viewTitles[view]}</h1>
              </div>

              <div className="flex items-center gap-2.5">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={resetSimulation}
                  className="border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-xs h-8 px-3"
                >
                  <RotateCcw className="mr-1.5 size-3 text-zinc-400" />
                  Reset
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => runSimulation()}
                  disabled={isRunning}
                  className={cn(
                    "font-mono text-xs font-bold h-8 px-3.5 transition-all shadow-sm",
                    isRunning
                      ? "bg-zinc-800 text-zinc-400 border border-zinc-700 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-500 text-zinc-950 border border-emerald-500/80"
                  )}
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="mr-1.5 size-3 animate-spin text-emerald-400" />
                      Simulating...
                    </>
                  ) : (
                    <>
                      <Play className="mr-1.5 size-3 fill-current" />
                      Run Attack Simulation
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* VIEW 1: LIVE ATTACK DEMO (RADAR & TRIAGE) */}
          {(view === "radar-triage" || view === "dashboard") && (
            <div className="space-y-6">
              <LiveAttackDemo />
            </div>
          )}

          {/* VIEW 2: INCIDENT BLACK BOX */}
          {view === "black-box" && (
            <div className="space-y-6">
              <PermissionBlackBox />
            </div>
          )}

          {/* VIEW 3: CONSENT RECEIPT LEDGER */}
          {(view === "consent-ledger" || view === "consent-receipts") && (
            <div className="space-y-6">
              <ConsentReceiptLedger />
            </div>
          )}

          {/* VIEW 4: PRIVACY DOPPELGANGER */}
          {(view === "privacy-doppelganger" || view === "doppelganger") && (
            <div className="space-y-6">
              <PrivacyDoppelganger />
            </div>
          )}

          {/* DEDICATED MOBILE SHIELD VIEW */}
          {view === "mobile-shield" && (
            <div className="space-y-6">
              <MobileShield
                telemetry={telemetry}
                isLoading={isTelemetryLoading}
                onSimulateAttack={handleSimulateRATAttack}
                onResetDevice={handleResetDevice}
              />
            </div>
          )}

          {/* CONNECTED APPS VIEW */}
          {view === "apps" && (
            <AppsTable
              apps={apps}
              query={query}
              onManage={handleManage}
              onQuarantine={handleQuarantine}
              onRestore={handleRestore}
              onSimulateAttack={() => handleRadarStep()}
              isSimulating={false}
              title="Connected Applications &amp; Permissions Audit"
            />
          )}

          {/* ACTIVITY LOGS VIEW */}
          {view === "logs" && (
            <div className="space-y-6">
              <AccessLog />
            </div>
          )}

          {/* RECOMMENDATIONS VIEW */}
          {view === "recommendations" && (
            <RecommendationsView dismissed={dismissed} onApply={handleApplyRecommendation} />
          )}

          {/* ABOUT E.D.I.T.H. VIEW */}
          {view === "about" && (
            <div className="space-y-6">
              <AboutView />
            </div>
          )}

          {/* SETTINGS VIEW */}
          {view === "settings" && <SettingsView />}
        </main>
      </div>

      {/* National Cyber Crime Reporting Portal (1930) Complaint Dossier Modal */}
      <DossierModal
        dossier={activeDossier}
        isOpen={showDossierModal}
        onClose={() => setShowDossierModal(false)}
      />

      {/* Threat Detection Modal */}
      <ThreatModal
        threat={activeThreat}
        isOpen={showThreatModal}
        onClose={() => setShowThreatModal(false)}
        onQuarantine={() => {
          const target = apps.find((a) => a.name === "RTO Challan QuickPay") || apps[0]
          if (target) handleQuarantine(target)
        }}
        onRestore={() => {
          const target = apps.find((a) => a.name === "RTO Challan QuickPay") || apps[0]
          if (target) handleRestore(target)
        }}
      />
    </div>
  )
}
