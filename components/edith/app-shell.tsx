"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { AccessLog } from "@/components/edith/access-log"
import { AppInvestigation } from "@/components/edith/app-investigation"
import { AppsTable } from "@/components/edith/apps-table"
import { GlobalKillSwitch } from "@/components/edith/global-kill-switch"
import { Header } from "@/components/edith/header"
import { KpiCards } from "@/components/edith/kpi-cards"
import { PermissionModal, type PermissionConfig } from "@/components/edith/permission-modal"
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
  const [modifyingApp, setModifyingApp] = useState<ConnectedApp | null>(null)
  const [lockdown, setLockdown] = useState(false)
  const preLockdownApps = useRef<ConnectedApp[]>([])
  const logCounter = useRef(0)

  const appendLog = useCallback(
    (resource: string, result: AccessLogEntry["result"], app = "Resume Builder") => {
    logCounter.current += 1
    const entry: AccessLogEntry = {
      id: `live-${logCounter.current}`,
      time: formatTime(new Date()),
      app,
      resource,
      result,
    }
    setLogs((prev) => [...prev, entry].slice(-60))
    },
    [],
  )

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

  const handleActivateLockdown = () => {
    preLockdownApps.current = apps
    setLockdown(true)
    setThreat("revoked")
    setApps((prev) =>
      prev.map((a) =>
        a.id === "resume-builder"
          ? { ...a, permissions: [], requestsPerHour: 0, spike: false, status: "revoked" }
          : { ...a, requestsPerHour: 0, spike: false, status: "suspended" },
      ),
    )
    appendLog("All third-party access", "Blocked", "All Apps")
    toast.error("Global lockdown activated", {
      description: "Every connected app has been suspended. Resume Builder access was revoked.",
    })
  }

  const handleLiftLockdown = () => {
    setLockdown(false)
    setApps((prev) =>
      prev.map((a) => (a.id === "resume-builder" ? a : (preLockdownApps.current.find((p) => p.id === a.id) ?? a))),
    )
    appendLog("Lockdown lifted", "Allowed", "All Apps")
    toast.success("Lockdown lifted", {
      description: "Trusted apps can connect again. Resume Builder remains revoked.",
    })
  }

  const handleSavePermissions = (app: ConnectedApp, config: PermissionConfig) => {
    const label = { always: "Always allowed", hour: "Allowed for 1 hour", deny: "Denied" } as const
    setModifyingApp(null)
    toast.success(`Permissions updated for ${app.name}`, {
      description: (Object.keys(config) as (keyof PermissionConfig)[])
        .map((key) => `${key}: ${label[config[key]]}`)
        .join(" · "),
    })
  }

  const handleApplyRecommendation = (id: string) => {
    const rec = recommendations.find((r) => r.id === id)
    if (!rec) return
    toast.success(rec.successTitle, { description: rec.successDetail })
    setDismissed((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }

  const handleApplyAllRecommendations = () => {
    const fixes = recommendations.filter((r) => r.fixable && !dismissed.includes(r.id))
    if (fixes.length === 0) return
    setDismissed((prev) => [...prev, ...fixes.map((r) => r.id)])
    toast.success("All recommended fixes applied", {
      description: `${fixes.length} permission change${fixes.length === 1 ? "" : "s"} applied across your apps.`,
    })
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
          {view !== "recommendations" && (
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{viewTitles[view]}</h1>
              <p className="text-sm text-muted-foreground">
                Enhanced Digital Identity, Trust &amp; Heuristics
              </p>
            </div>
          )}

          {view === "dashboard" && (
            <>
              <GlobalKillSwitch
                locked={lockdown}
                onActivate={handleActivateLockdown}
                onLift={handleLiftLockdown}
              />
              <KpiCards criticalAlerts={criticalAlerts} trustScore={trustScore} />
              <ThreatAlert state={threat} onRevoke={handleRevoke} onSuspend={handleSuspend} />
              <AppsTable
                apps={apps}
                query={query}
                onManage={handleManage}
                onModify={setModifyingApp}
              />
              <AccessLog logs={logs} query={query} />
            </>
          )}

          {view === "apps" && (
            <AppsTable
              apps={apps}
              query={query}
              onManage={handleManage}
              onModify={setModifyingApp}
              title="Connected Applications"
            />
          )}

          {view === "logs" && (
            <AccessLog logs={logs} query={query} heightClass="h-[32rem]" title="Activity Logs" />
          )}

          {view === "recommendations" && (
            <RecommendationsView
              dismissed={dismissed}
              onApply={handleApplyRecommendation}
              onApplyAll={handleApplyAllRecommendations}
            />
          )}

          {view === "settings" && <SettingsView />}
            </>
          )}
        </main>
      </div>

      <PermissionModal
        app={modifyingApp}
        onClose={() => setModifyingApp(null)}
        onSave={handleSavePermissions}
      />
    </div>
  )
}
