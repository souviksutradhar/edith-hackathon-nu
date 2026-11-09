"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { AccessLog } from "@/components/edith/access-log"
import { AppInvestigation } from "@/components/edith/app-investigation"
import { AppsTable } from "@/components/edith/apps-table"
import { Header } from "@/components/edith/header"
import { KpiCards } from "@/components/edith/kpi-cards"
import { RecommendationsView } from "@/components/edith/recommendations-view"
import { SettingsView } from "@/components/edith/settings-view"
import { Sidebar, type ViewId } from "@/components/edith/sidebar"
import { ThreatAlert, type ThreatState } from "@/components/edith/threat-alert"
import {
  formatTime,
  initialApps,
  initialLogs,
  liveResources,
  recommendations,
  type AccessLogEntry,
  type ConnectedApp,
} from "@/lib/edith-data"
import { cn } from "@/lib/utils"

const viewTitles: Record<ViewId, string> = {
  dashboard: "Dashboard",
  apps: "Connected Apps",
  logs: "Activity Logs",
  recommendations: "Security Recommendations",
  settings: "Settings",
}

export function AppShell() {
  const [view, setView] = useState<ViewId>("dashboard")
  const [query, setQuery] = useState("")
  const [menuOpen, setMenuOpen] = useState(false)
  const [threat, setThreat] = useState<ThreatState>("active")
  const [apps, setApps] = useState<ConnectedApp[]>(initialApps)
  const [logs, setLogs] = useState<AccessLogEntry[]>(initialLogs)
  const [dismissed, setDismissed] = useState<string[]>([])
  const [investigatingId, setInvestigatingId] = useState<string | null>(null)
  const logCounter = useRef(0)

  const appendLog = useCallback((resource: string, result: AccessLogEntry["result"]) => {
    logCounter.current += 1
    const entry: AccessLogEntry = {
      id: `live-${logCounter.current}`,
      time: formatTime(new Date()),
      app: "Resume Builder",
      resource,
      result,
    }
    setLogs((prev) => [...prev, entry].slice(-60))
  }, [])

  useEffect(() => {
    if (threat !== "active") return
    let i = 0
    const timer = setInterval(() => {
      appendLog(liveResources[i % liveResources.length], "Flagged")
      i += 1
    }, 4000)
    return () => clearInterval(timer)
  }, [threat, appendLog])

  const updateResumeBuilder = (patch: Partial<ConnectedApp>) =>
    setApps((prev) => prev.map((a) => (a.id === "resume-builder" ? { ...a, ...patch } : a)))

  const handleRevoke = () => {
    setThreat("revoked")
    updateResumeBuilder({
      permissions: [],
      requestsPerHour: 0,
      spike: false,
      status: "revoked",
    })
    appendLog("Contacts, Drive Files", "Blocked")
    toast.success("Access Revoked & Backend Notified", {
      description: "Resume Builder can no longer reach your data.",
    })
  }

  const handleSuspend = () => {
    setThreat("suspended")
    updateResumeBuilder({ status: "suspended", requestsPerHour: 0, spike: false })
    appendLog("Contacts, Drive Files", "Blocked")
    toast.warning("Resume Builder suspended temporarily", {
      description: "Requests are paused until you review the activity.",
    })
  }

  const handleManage = (app: ConnectedApp) => {
    if (app.id === "resume-builder") {
      setInvestigatingId(app.id)
      return
    }
    toast(`Managing ${app.name}`, {
      description: `${app.permissions.length} permission${app.permissions.length === 1 ? "" : "s"} granted · trust score ${app.trustScore}.`,
    })
  }

  const handleApplyRecommendation = (id: string, title: string) => {
    if (id === "r1" && threat !== "revoked") {
      handleRevoke()
    } else {
      toast.success("Recommendation applied", { description: title })
    }
    setDismissed((prev) => [...prev, id])
  }

  const handleNavigate = (next: ViewId) => {
    setView(next)
    setInvestigatingId(null)
    setMenuOpen(false)
  }

  const handleNotifications = () => {
    setView("dashboard")
    setInvestigatingId(null)
    if (threat === "active") {
      toast.error("1 critical alert", { description: "Resume Builder is behaving suspiciously." })
    } else {
      toast("No new notifications")
    }
  }

  const criticalAlerts = threat === "active" ? 1 : 0
  const trustScore = threat === "active" ? 85 : 91
  const openRecommendations = recommendations.filter((r) => !dismissed.includes(r.id)).length
  const investigatedApp = apps.find((a) => a.id === investigatingId)
  const activeNav: ViewId = investigatedApp ? "apps" : view

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-sidebar-border lg:block">
        <Sidebar active={activeNav} onNavigate={handleNavigate} recommendationCount={openRecommendations} />
      </aside>

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
          <Sidebar active={activeNav} onNavigate={handleNavigate} recommendationCount={openRecommendations} />
        </div>
      </div>

      <div className="lg:pl-64">
        <Header
          query={query}
          onQueryChange={setQuery}
          notificationCount={criticalAlerts}
          onNotificationsClick={handleNotifications}
          onMenuClick={() => setMenuOpen(true)}
        />

        <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
          {investigatedApp ? (
            <AppInvestigation app={investigatedApp} onBack={() => setInvestigatingId(null)} />
          ) : (
            <>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{viewTitles[view]}</h1>
            <p className="text-sm text-muted-foreground">
              Enhanced Digital Identity, Trust &amp; Heuristics
            </p>
          </div>

          {view === "dashboard" && (
            <>
              <KpiCards criticalAlerts={criticalAlerts} trustScore={trustScore} />
              <ThreatAlert state={threat} onRevoke={handleRevoke} onSuspend={handleSuspend} />
              <AppsTable apps={apps} query={query} onManage={handleManage} />
              <AccessLog logs={logs} query={query} />
            </>
          )}

          {view === "apps" && <AppsTable apps={apps} query={query} onManage={handleManage} title="Connected Applications" />}

          {view === "logs" && (
            <AccessLog logs={logs} query={query} heightClass="h-[32rem]" title="Activity Logs" />
          )}

          {view === "recommendations" && (
            <RecommendationsView dismissed={dismissed} onApply={handleApplyRecommendation} />
          )}

          {view === "settings" && <SettingsView />}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
