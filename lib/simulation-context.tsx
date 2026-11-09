"use client"

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react"
import {
  AppProfile,
  BASELINE_APPS,
  evaluateAppRisk,
  RiskEvaluation,
  RISK_RULES,
} from "@/lib/riskEngine"
import { toast } from "sonner"

export interface SimulationEvent {
  id: string
  timestamp: string // "HH:MM:SS" (24h IST)
  app: string
  process: string
  hook: string
  action: string
  details: string
  severity: "info" | "warning" | "critical" | "success"
  ruleTriggered?: string
  explanation?: string
}

export interface ConsentHistoryRecord {
  id: string
  timestamp: string
  appId: string
  appName: string
  permission: string
  action: "GRANTED" | "REVOKED" | "FROZEN_BY_EDITH" | "RESTORED"
  previousScore: number
  newScore: number
}

export interface CustomLurePayload {
  sender: string
  message: string
  apkUrl?: string
}

export interface BlackBoxChainEvent {
  id: string
  index: number
  timestamp: string
  app: string
  process: string
  hook: string
  action: string
  details: string
  severity: "info" | "warning" | "critical" | "success"
  prevHash: string
  hash: string
}

export interface PermissionCreepAlert {
  appId: string
  appName: string
  requestedPermission: string
  reason: string
}

export interface SimulationContextType {
  // Global simulation state
  isRunning: boolean
  isCompleted: boolean
  currentStep: number // 0 to 5
  baseTime: string
  apps: AppProfile[]
  evaluations: Record<string, RiskEvaluation>
  events: SimulationEvent[]
  hasRun: boolean
  evidenceHash: string
  consentHistory: ConsentHistoryRecord[]
  activeLure: CustomLurePayload | null

  // Simulation controls
  runSimulation: (customLure?: CustomLurePayload) => void
  resetSimulation: () => void
  setStepManually: (step: number) => void
  addEvent: (event: SimulationEvent) => void
  resetAllDemoData: () => void
  triggerManualEvent: (
    appId: string,
    eventType:
      | "INSTALL_WHATSAPP"
      | "GRANT_SMS"
      | "GRANT_ACCESSIBILITY"
      | "GRANT_INSTALL_PACKAGES"
      | "GRANT_NOTIFICATION"
      | "BULK_SMS_READ"
      | "HIDE_ICON"
      | "CONTACT_NEW_DOMAIN"
      | "REVOKE_SMS"
      | "REVOKE_ACCESSIBILITY"
      | "RESTORE_APP"
  ) => void

  // Privacy Doppelganger state & controls
  decoyEnabled: boolean
  setDecoyEnabled: (val: boolean) => void
  serveDecoyData: boolean
  setServeDecoyData: (val: boolean) => void
  decoyReadsCount: number
  lastDecoyRead: {
    app: string
    dataType: string
    value: string
    timestamp: string
    isDecoy: boolean
  } | null
  simulateAppReadsData: (
    appId: string,
    dataType: "Contacts" | "Location" | "Bank balance"
  ) => void
  simulateDecoyTripwire: (appId: string) => void
  decoyTripwireAlert: {
    appId: string
    appName: string
    decoyName: string
    decoyPhone: string
    scammerOrigin: string
    timestamp: string
  } | null
  dismissTripwireAlert: () => void

  // Incident Black Box state & controls
  blackBoxEvents: BlackBoxChainEvent[]
  isRecordingBlackBox: boolean
  blackBoxScenario: "challan" | "remote_screen" | "loan_app"
  setBlackBoxScenario: (s: "challan" | "remote_screen" | "loan_app") => void
  recordBlackBoxScenario: (scenario?: "challan" | "remote_screen" | "loan_app") => void
  replayStep: number | null
  setReplayStep: (step: number | null) => void
  tamperedIndex: number | null
  tamperBlackBoxEvent: () => void
  verificationResult: {
    checked: boolean
    isValid: boolean
    failedIndex: number | null
  } | null
  verifyBlackBoxEvidence: () => Promise<void>
  exportBlackBoxJson: () => void

  // Consent Ledger controls
  toggleAppPermission: (appId: string, permission: string, grant: boolean) => void
  applyAllRecommendations: () => void
  activeCreepAlert: PermissionCreepAlert | null
  triggerPermissionCreep: (appId?: string) => void
  respondToPermissionCreep: (allow: boolean) => void

  // Activity Logs
  addSampleDayOfActivity: () => void
}

export function format24hTime(date: Date, offsetSeconds = 0): string {
  const d = new Date(date.getTime() + offsetSeconds * 1000)
  const h = String(d.getHours()).padStart(2, "0")
  const m = String(d.getMinutes()).padStart(2, "0")
  const s = String(d.getSeconds()).padStart(2, "0")
  return `${h}:${m}:${s}`
}

export async function sha256Hex(text: string): Promise<string> {
  try {
    if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder()
      const data = encoder.encode(text)
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
    }
  } catch (e) {
    // fallback
  }
  // Deterministic fast fallback for older engines
  let h1 = 0xdeadbeef
  let h2 = 0x41c64e6d
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  const hex = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16)
  return hex.padStart(64, "a")
}

const SimulationContext = createContext<SimulationContextType | null>(null)

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  // Global simulation
  const [isRunning, setIsRunning] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [hasRun, setHasRun] = useState(false)
  const [baseTime, setBaseTime] = useState<string>("17:05:00")
  const [evidenceHash, setEvidenceHash] = useState<string>(
    "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4"
  )
  const [activeLure, setActiveLure] = useState<CustomLurePayload | null>(null)
  const activeLureRef = useRef<CustomLurePayload | null>(null)
  const startDateRef = useRef<Date>(new Date())

  // Apps state
  const [apps, setApps] = useState<AppProfile[]>(BASELINE_APPS)
  const [events, setEvents] = useState<SimulationEvent[]>([])
  const [consentHistory, setConsentHistory] = useState<ConsentHistoryRecord[]>([])
  const timerRef = useRef<NodeJS.Timeout[]>([])

  // Privacy Doppelganger
  const [decoyEnabled, setDecoyEnabled] = useState(true)
  const [decoyReadsCount, setDecoyReadsCount] = useState(0)
  const [lastDecoyRead, setLastDecoyRead] = useState<{
    app: string
    dataType: string
    value: string
    timestamp: string
    isDecoy: boolean
  } | null>(null)
  const [decoyTripwireAlert, setDecoyTripwireAlert] = useState<{
    appId: string
    appName: string
    decoyName: string
    decoyPhone: string
    scammerOrigin: string
    timestamp: string
  } | null>(null)

  // Incident Black Box
  const [blackBoxScenario, setBlackBoxScenario] = useState<
    "challan" | "remote_screen" | "loan_app"
  >("challan")
  const [blackBoxEvents, setBlackBoxEvents] = useState<BlackBoxChainEvent[]>([])
  const [isRecordingBlackBox, setIsRecordingBlackBox] = useState(false)
  const [replayStep, setReplayStep] = useState<number | null>(null)
  const [tamperedIndex, setTamperedIndex] = useState<number | null>(null)
  const [verificationResult, setVerificationResult] = useState<{
    checked: boolean
    isValid: boolean
    failedIndex: number | null
  } | null>(null)

  // Consent Ledger Permission Creep
  const [activeCreepAlert, setActiveCreepAlert] = useState<PermissionCreepAlert | null>(null)

  const clearAllTimers = () => {
    timerRef.current.forEach((t) => clearTimeout(t))
    timerRef.current = []
  }

  // Derive dynamic risk evaluations for every app directly using the pure engine
  const evaluations: Record<string, RiskEvaluation> = useMemo(() => {
    const evals: Record<string, RiskEvaluation> = {}
    apps.forEach((app) => {
      evals[app.id] = evaluateAppRisk(app)
    })
    return evals
  }, [apps])

  // Helper to append a single deduplicated event
  const appendEvent = useCallback((event: SimulationEvent) => {
    setEvents((prev) => (prev.some((e) => e.id === event.id) ? prev : [event, ...prev]))
  }, [])

  // Apply scripted step states for the Main Live Attack Demo
  const applyStepState = useCallback(
    (step: number, startDate: Date) => {
      setCurrentStep(step)

      if (step === 0) {
        setApps(BASELINE_APPS)
        return
      }

      if (step === 1) {
        const currentLure = activeLureRef.current
        const lureDetails = currentLure
          ? `Lure received via SMS from ${currentLure.sender}: "${currentLure.message}". User opened link and sideloaded APK.`
          : "Installed from WhatsApp file, not Google Play Store. Initial inspection started."

        setApps((prev) =>
          prev.map((a) =>
            a.id === "app-rto"
              ? {
                  ...a,
                  installSource: currentLure ? "SMS Link" : "WhatsApp file",
                  impersonatesBrand: true,
                  grantedPermissions: ["Network"],
                  activeBehaviors: { contactsNewDomain: false },
                }
              : a
          )
        )

        appendEvent({
          id: `evt-step-1-${Date.now()}`,
          timestamp: format24hTime(startDate, 2),
          app: "RTO Challan QuickPay",
          process: "com.rto.echallan.quickpay",
          hook: "App Installation Monitor",
          action: "LURE RECEIVED",
          details: lureDetails,
          severity: "warning",
          ruleTriggered: "UNTRUSTED_INSTALL_SOURCE (+25 pts) & IMPERSONATES_BRAND (+10 pts)",
          explanation:
            "The app was not installed from Google Play Store and claims to represent a state RTO without official verification.",
        })
      } else if (step === 2) {
        setApps((prev) =>
          prev.map((a) =>
            a.id === "app-rto"
              ? {
                  ...a,
                  grantedPermissions: [
                    "Network",
                    "Read SMS",
                    "Accessibility Service",
                    "Install Packages",
                  ],
                  activeBehaviors: {},
                }
              : a
          )
        )

        appendEvent({
          id: `evt-step-2-${Date.now()}`,
          timestamp: format24hTime(startDate, 6),
          app: "RTO Challan QuickPay",
          process: "com.rto.echallan.quickpay",
          hook: "Permission Request Monitor",
          action: "MISMATCH",
          details:
            "Scope mismatch: Expected for a traffic challan app: Internet only. Requested: Read SMS (+30), Accessibility (+30), Install Packages (+20).",
          severity: "warning",
          ruleTriggered: "UNEXPECTED_SMS & UNEXPECTED_ACCESSIBILITY (+60 pts)",
          explanation:
            "A challan payment viewer only needs network connectivity. Requesting SMS and Accessibility allows the app to read bank messages and capture screen input.",
        })

        setConsentHistory((prev) => [
          {
            id: `ch-${Date.now()}-1`,
            timestamp: format24hTime(startDate, 6),
            appId: "app-rto",
            appName: "RTO Challan QuickPay",
            permission: "Read SMS, Accessibility Service, Install Packages",
            action: "GRANTED",
            previousScore: 65,
            newScore: 15,
          },
          ...prev,
        ])
      } else if (step === 3) {
        setApps((prev) =>
          prev.map((a) =>
            a.id === "app-rto"
              ? {
                  ...a,
                  grantedPermissions: [
                    "Network",
                    "Read SMS (212 read in 4s)",
                    "Accessibility Service",
                    "Install Packages",
                  ],
                  activeBehaviors: { bulkSmsRead: true },
                }
              : a
          )
        )

        appendEvent({
          id: `evt-step-3-${Date.now()}`,
          timestamp: format24hTime(startDate, 11),
          app: "RTO Challan QuickPay",
          process: "com.rto.echallan.quickpay",
          hook: "SMS Access Monitor",
          action: "HARVEST DETECTED",
          details:
            "Rapid data harvest: Read 212 SMS messages in 4 seconds (normal usage: 0). Flagged as an attempt to steal banking OTPs.",
          severity: "critical",
          ruleTriggered: "BULK_SMS_READ_SPIKE (+25 pts)",
          explanation:
            "Reading your entire SMS inbox in a few seconds is a hallmark of banking Trojan malware looking for past OTPs and account balances.",
        })
      } else if (step === 4) {
        setApps((prev) =>
          prev.map((a) =>
            a.id === "app-rto"
              ? {
                  ...a,
                  grantedPermissions: [
                    "Network (Isolated)",
                    "Revoked: Read SMS",
                    "Revoked: Accessibility Service",
                    "Revoked: Install Packages",
                  ],
                  activeBehaviors: { bulkSmsRead: true },
                }
              : a
          )
        )

        appendEvent({
          id: `evt-step-4-${Date.now()}`,
          timestamp: format24hTime(startDate, 16),
          app: "E.D.I.T.H. Defense Engine",
          process: "system_shield / auto_containment",
          hook: "Auto-Containment Protection Hook",
          action: "ISOLATED & FROZEN",
          details:
            "Auto-freeze triggered: High-risk permissions revoked, app process isolated before OTP could be stolen. Notification sent.",
          severity: "critical",
          ruleTriggered: "AUTOMATIC_CONTAINMENT_POLICY (Risk >= 70)",
          explanation:
            "Because the risk score crossed 70 points, E.D.I.T.H. immediately cut off access to SMS and screen-reading services to protect your accounts.",
        })

        setConsentHistory((prev) => [
          {
            id: `ch-${Date.now()}-2`,
            timestamp: format24hTime(startDate, 16),
            appId: "app-rto",
            appName: "RTO Challan QuickPay",
            permission: "All High-Risk Scopes",
            action: "FROZEN_BY_EDITH",
            previousScore: 15,
            newScore: 0,
          },
          ...prev,
        ])
      } else if (step === 5) {
        setIsCompleted(true)
        setIsRunning(false)

        const dossierContent = `EDITH-INC-2026-8941|com.rto.echallan.quickpay|${format24hTime(
          startDate,
          21
        )}|SMS_HARVEST_INTERCEPTED`
        sha256Hex(dossierContent).then((h) => setEvidenceHash(h))

        appendEvent({
          id: `evt-step-5-${Date.now()}`,
          timestamp: format24hTime(startDate, 21),
          app: "Complaint Evidence Engine",
          process: "EDITH Incident Dossier Compiler",
          hook: "Incident Report Generator",
          action: "PACKET READY",
          details:
            "Complaint kit prepared. Incident #EDITH-INC-2026-8941 sealed with SHA-256 hash. Ready to copy or print for 1930 / cybercrime.gov.in.",
          severity: "success",
          ruleTriggered: "INCIDENT_SEALED",
          explanation:
            "All captured event timestamps, package identifiers, and permission abuse logs are bundled into a tamper-evident evidence format.",
        })
      }
    },
    [appendEvent]
  )

  // Scripted Attack Simulation
  const runSimulation = useCallback(
    (customLure?: CustomLurePayload) => {
      clearAllTimers()
      const now = new Date()
      startDateRef.current = now
      activeLureRef.current = customLure || null
      setActiveLure(customLure || null)
      setBaseTime(format24hTime(now))
      setHasRun(true)
      setIsRunning(true)
      setIsCompleted(false)
      setEvents([])

      // Baseline routine accesses
      const baseEvt1: SimulationEvent = {
        id: "evt-base-1",
        timestamp: format24hTime(now, -40),
        app: "BHIM UPI",
        process: "in.org.npci.upiapp",
        hook: "Bank Network Connection",
        action: "ALLOWED",
        details: "Routine NPCI UPI payment settlement check",
        severity: "info",
        ruleTriggered: "DECLARED_PURPOSE_MATCH",
        explanation: "BHIM is an authorized payment application operating within expected bank transaction parameters.",
      }
      const baseEvt2: SimulationEvent = {
        id: "evt-base-2",
        timestamp: format24hTime(now, -18),
        app: "Mausam Weather",
        process: "gov.imd.mausam",
        hook: "Location Sensor",
        action: "ALLOWED",
        details: "Coarse location lookup for precipitation forecast",
        severity: "info",
        ruleTriggered: "DECLARED_PURPOSE_MATCH",
        explanation: "Weather app queried approximate city-level coordinates to fetch current rain alerts.",
      }
      setEvents([baseEvt2, baseEvt1])

      const t1 = setTimeout(() => {
        applyStepState(1, now)
        toast.info("Step 1: Lure Received", {
          description: customLure
            ? `Lure from ${customLure.sender} initiated sideload.`
            : "RTO Challan QuickPay installed from WhatsApp file.",
        })
      }, 1500)
      timerRef.current.push(t1)

      const t2 = setTimeout(() => {
        applyStepState(2, now)
        toast.warning("Step 2: Intent Mismatch", {
          description: "RTO app requests SMS, Accessibility, and Install Packages.",
        })
      }, 5500)
      timerRef.current.push(t2)

      const t3 = setTimeout(() => {
        applyStepState(3, now)
        toast.error("Step 3: Hidden Behaviour Detected", {
          description: "RTO app reads 212 SMS in 4 seconds (baseline: 0).",
        })
      }, 10500)
      timerRef.current.push(t3)

      const t4 = setTimeout(() => {
        applyStepState(4, now)
        toast.error("Step 4: AUTO-FREEZE TRIGGERED", {
          description: "Permissions revoked before OTP theft. Rogue app isolated.",
          duration: 5000,
        })
      }, 15500)
      timerRef.current.push(t4)

      const t5 = setTimeout(() => {
        applyStepState(5, now)
        toast.success("Step 5: Complaint Packet Prepared", {
          description: "Evidence packet sealed with browser-computed SHA-256 hash.",
          duration: 5000,
        })
      }, 20500)
      timerRef.current.push(t5)
    },
    [applyStepState]
  )

  const resetSimulation = useCallback(() => {
    clearAllTimers()
    activeLureRef.current = null
    setActiveLure(null)
    setIsRunning(false)
    setIsCompleted(false)
    setCurrentStep(0)
    setHasRun(false)
    setEvents([])
    setConsentHistory([])
    setApps(BASELINE_APPS)
    toast.info("Simulation reset to clean baseline.")
  }, [])

  const setStepManually = useCallback(
    (step: number) => {
      clearAllTimers()
      setIsRunning(false)
      setHasRun(true)
      applyStepState(step, startDateRef.current)
    },
    [applyStepState]
  )

  // Reset ALL demo data across all pages
  const resetAllDemoData = useCallback(() => {
    clearAllTimers()
    activeLureRef.current = null
    setActiveLure(null)
    setIsRunning(false)
    setIsCompleted(false)
    setCurrentStep(0)
    setHasRun(false)
    setApps(BASELINE_APPS)
    setEvents([])
    setConsentHistory([])
    setDecoyReadsCount(0)
    setLastDecoyRead(null)
    setDecoyTripwireAlert(null)
    setBlackBoxEvents([])
    setIsRecordingBlackBox(false)
    setReplayStep(null)
    setTamperedIndex(null)
    setVerificationResult(null)
    setActiveCreepAlert(null)
    toast.success("All demo data reset to clean baseline across all pages.")
  }, [])

  // Consent Ledger: Toggle individual permission
  const toggleAppPermission = useCallback(
    (appId: string, permissionName: string, grant: boolean) => {
      setHasRun(true)
      const now = new Date()
      const timeStr = format24hTime(now)

      setApps((prev) =>
        prev.map((app) => {
          if (app.id !== appId) return app

          const currentEval = evaluateAppRisk(app)
          const prevScore = currentEval.trustScore

          let newPerms = [...app.grantedPermissions]
          if (grant) {
            if (!newPerms.includes(permissionName)) {
              newPerms.push(permissionName)
            }
          } else {
            newPerms = newPerms.filter((p) => p !== permissionName && !p.startsWith(permissionName))
          }

          const updatedApp: AppProfile = {
            ...app,
            grantedPermissions: newPerms,
          }

          const newEval = evaluateAppRisk(updatedApp)

          // Add to consent history
          setConsentHistory((h) => [
            {
              id: `ch-toggle-${Date.now()}`,
              timestamp: timeStr,
              appId: app.id,
              appName: app.name,
              permission: permissionName,
              action: grant ? "GRANTED" : "REVOKED",
              previousScore: prevScore,
              newScore: newEval.trustScore,
            },
            ...h,
          ])

          // Add event to shared timeline
          appendEvent({
            id: `evt-perm-${Date.now()}`,
            timestamp: timeStr,
            app: app.name,
            process: app.packageName,
            hook: "Consent Ledger Toggle",
            action: grant ? "SCOPE GRANTED" : "SCOPE REVOKED",
            details: grant
              ? `User manually enabled "${permissionName}" permission.`
              : `User manually revoked "${permissionName}" permission to minimize risk.`,
            severity: grant ? "warning" : "info",
            ruleTriggered: grant ? "MANUAL_PERMISSION_EXPANSION" : "ATTACK_SURFACE_REDUCTION",
            explanation: grant
              ? `Granting permissions increases the app's potential access vectors.`
              : `Revoking unnecessary permissions prevents unwanted data harvesting and boosts trust score.`,
          })

          return updatedApp
        })
      )

      toast(grant ? `Permission "${permissionName}" granted` : `Permission "${permissionName}" revoked`)
    },
    [appendEvent]
  )

  // Consent Ledger: Apply all recommendations in one click
  const applyAllRecommendations = useCallback(() => {
    setHasRun(true)
    const now = new Date()
    const timeStr = format24hTime(now)

    setApps((prev) =>
      prev.map((app) => {
        // Strip any granted permission that is not in expectedPermissions
        const normalizedExpected = app.expectedPermissions.map((e) => e.toLowerCase())
        const pruned = app.grantedPermissions.filter((p) => {
          const pLow = p.toLowerCase()
          return normalizedExpected.some((e) => pLow.includes(e) || e.includes(pLow))
        })

        const updated: AppProfile = {
          ...app,
          grantedPermissions: pruned,
          activeBehaviors: {},
        }

        const newEval = evaluateAppRisk(updated)

        setConsentHistory((h) => [
          {
            id: `ch-rec-${Date.now()}-${app.id}`,
            timestamp: timeStr,
            appId: app.id,
            appName: app.name,
            permission: "All Non-Essential Scopes Removed",
            action: "REVOKED",
            previousScore: evaluateAppRisk(app).trustScore,
            newScore: newEval.trustScore,
          },
          ...h,
        ])

        return updated
      })
    )

    appendEvent({
      id: `evt-apply-recs-${Date.now()}`,
      timestamp: timeStr,
      app: "E.D.I.T.H. Defense Engine",
      process: "system_shield / consent_hardening",
      hook: "Bulk Permission Hardening",
      action: "RECOMMENDATIONS APPLIED",
      details: "Removed all unnecessary permissions across all apps in one click.",
      severity: "success",
      ruleTriggered: "ZERO_TRUST_HARDENING",
      explanation:
        "Every app was stripped of scopes outside its declared operational purpose, returning device posture to maximum trust.",
    })

    toast.success("All security recommendations applied! Unnecessary permissions stripped.")
  }, [appendEvent])

  // Consent Ledger: Simulate Permission Creep
  const triggerPermissionCreep = useCallback((appId = "app-weather") => {
    const target = BASELINE_APPS.find((a) => a.id === appId) || BASELINE_APPS[1]
    setActiveCreepAlert({
      appId: target.id,
      appName: target.name,
      requestedPermission: "Accessibility Service & Contacts Access",
      reason:
        "App requested high-risk permissions 3 days after installation. Weather apps do not need screen-reading or contacts to show rain forecasts.",
    })
    toast.warning("Simulated Permission Creep Triggered", {
      description: `${target.name} is attempting to request high-risk permissions.`,
    })
  }, [])

  const respondToPermissionCreep = useCallback(
    (allow: boolean) => {
      if (!activeCreepAlert) return
      const now = new Date()
      const timeStr = format24hTime(now)
      const alert = activeCreepAlert
      setActiveCreepAlert(null)

      if (allow) {
        toggleAppPermission(alert.appId, "Accessibility Service", true)
        toast.warning(`Allowed permission creep for ${alert.appName}. Trust score decreased.`)
      } else {
        appendEvent({
          id: `evt-creep-block-${Date.now()}`,
          timestamp: timeStr,
          app: alert.appName,
          process: alert.appId,
          hook: "Runtime Permission Gatekeeper",
          action: "CREEP BLOCKED",
          details: `Blocked deferred permission request: "${alert.requestedPermission}".`,
          severity: "success",
          ruleTriggered: "PERMISSION_CREEP_PREVENTION",
          explanation:
            "Deferred permission requests occurring long after app installation frequently indicate post-install malware activation.",
        })
        toast.success(`Blocked permission creep for ${alert.appName}! Safe posture maintained.`)
      }
    },
    [activeCreepAlert, appendEvent, toggleAppPermission]
  )

  // Privacy Doppelganger: Simulate app reads data
  const simulateAppReadsData = useCallback(
    (appId: string, dataType: "Contacts" | "Location" | "Bank balance") => {
      setHasRun(true)
      const now = new Date()
      const timeStr = format24hTime(now)
      const app = apps.find((a) => a.id === appId) || apps[3]

      let returnedVal = ""
      if (dataType === "Contacts") {
        returnedVal = decoyEnabled
          ? "154 Decoy Contacts (Aarav Sharma +91 99990 12841, Pooja Verma +91 99990 77192)"
          : "382 Real Contacts (Priya S., Vikram M., Rajesh K., ...)"
      } else if (dataType === "Location") {
        returnedVal = decoyEnabled
          ? "28.6129° N, 77.2295° E (Public monument synthetic coordinate)"
          : "28.6139° N, 77.2090° E (Exact home address)"
      } else {
        returnedVal = decoyEnabled
          ? "₹140.00 (Synthetic dummy wallet balance)"
          : "₹48,250.00 (Active savings bank balance)"
      }

      setDecoyReadsCount((c) => (decoyEnabled ? c + 1 : c))
      setLastDecoyRead({
        app: app.name,
        dataType,
        value: returnedVal,
        timestamp: timeStr,
        isDecoy: decoyEnabled,
      })

      appendEvent({
        id: `evt-decoy-read-${Date.now()}`,
        timestamp: timeStr,
        app: app.name,
        process: app.packageName,
        hook: `Privacy Doppelganger / ${dataType} Provider`,
        action: decoyEnabled ? "DECOY DATA SERVED" : "REAL DATA LEAKED",
        details: decoyEnabled
          ? `Supplied synthetic ${dataType.toLowerCase()} decoy: "${returnedVal}". Real data remained safe.`
          : `Decoy protection was OFF. Real ${dataType.toLowerCase()} exposed: "${returnedVal}".`,
        severity: decoyEnabled ? "success" : "critical",
        ruleTriggered: decoyEnabled ? "DECOY_PROTECTION_ENGAGED" : "DATA_EXPOSURE_RISK",
        explanation: decoyEnabled
          ? "The untrusted app received realistic synthetic data, masking your actual personal identity while satisfying its read queries."
          : "Because decoy protection was disabled, the app received your real private device information.",
      })

      if (decoyEnabled) {
        toast.success(`Decoy ${dataType} served to ${app.name}`, {
          description: `Synthetic data sent. Real personal data kept hidden.`,
        })
      } else {
        toast.error(`Real ${dataType} exposed to ${app.name}!`, {
          description: `Decoy protection was off. Real data was transmitted.`,
        })
      }
    },
    [apps, decoyEnabled, appendEvent]
  )

  // Privacy Doppelganger: Simulate scammer uses a decoy contact
  const simulateDecoyTripwire = useCallback(
    (appId: string) => {
      setHasRun(true)
      const now = new Date()
      const timeStr = format24hTime(now)
      const app = apps.find((a) => a.id === appId) || apps[3]

      const alert = {
        appId: app.id,
        appName: app.name,
        decoyName: "Aarav Sharma",
        decoyPhone: "+91 99990 12841",
        scammerOrigin: "+91 91234 56789 (Extortion & Loan Harassment Call)",
        timestamp: timeStr,
      }
      setDecoyTripwireAlert(alert)

      // Drop that app's trust score automatically
      setApps((prev) =>
        prev.map((a) =>
          a.id === app.id
            ? {
                ...a,
                activeBehaviors: { ...a.activeBehaviors, contactsNewDomain: true },
              }
            : a
        )
      )

      appendEvent({
        id: `evt-tripwire-${Date.now()}`,
        timestamp: timeStr,
        app: app.name,
        process: app.packageName,
        hook: "Tripwire Signal Interceptor",
        action: "TRIPWIRE TRIGGERED",
        details: `Decoy number "+91 99990 12841" received a fraud call from +91 91234 56789. Conclusively proves ${app.name} leaked harvested contacts to a scam network.`,
        severity: "critical",
        ruleTriggered: "CANARY_TRIPWIRE_EXFILTRATION_PROOF",
        explanation:
          "Tripwire explained: We plant unique decoy numbers in your phone that only this app received; when scammers call that number, we have indisputable proof of who leaked it.",
      })

      toast.error(`TRIPWIRE ALARM: ${app.name} leaked your data!`, {
        description: `Decoy contact received a scam call. Trust score dropped.`,
        duration: 6000,
      })
    },
    [apps, appendEvent]
  )

  const dismissTripwireAlert = useCallback(() => {
    setDecoyTripwireAlert(null)
  }, [])

  // Incident Black Box: Record Scenario
  const recordBlackBoxScenario = useCallback(
    async (scenario = blackBoxScenario) => {
      setHasRun(true)
      setIsRecordingBlackBox(true)
      setTamperedIndex(null)
      setVerificationResult(null)
      setReplayStep(null)
      setBlackBoxEvents([])

      const now = new Date()

      type RawEvent = {
        app: string
        process: string
        hook: string
        action: string
        details: string
        severity: "info" | "warning" | "critical" | "success"
      }

      let rawList: RawEvent[] = []

      if (scenario === "challan") {
        rawList = [
          {
            app: "RTO Challan QuickPay",
            process: "com.rto.echallan.quickpay",
            hook: "App Sideload Ingress",
            action: "LURE RECEIVED",
            details: "Installed from WhatsApp file link, claiming to view traffic fines.",
            severity: "warning",
          },
          {
            app: "RTO Challan QuickPay",
            process: "com.rto.echallan.quickpay",
            hook: "Permission Request Gate",
            action: "MISMATCH REQUEST",
            details: "Requested READ_SMS and BIND_ACCESSIBILITY_SERVICE outside utility scope.",
            severity: "warning",
          },
          {
            app: "RTO Challan QuickPay",
            process: "com.rto.echallan.quickpay",
            hook: "SMS Content Provider",
            action: "BULK HARVEST",
            details: "Read 212 SMS messages in 4 seconds to extract banking 2FA codes.",
            severity: "critical",
          },
          {
            app: "RTO Challan QuickPay",
            process: "com.rto.echallan.quickpay",
            hook: "Network Socket Connect",
            action: "C2 SOCKET",
            details: "Outbound socket beacon to unindexed domain 'api.challan-update.su'.",
            severity: "critical",
          },
          {
            app: "E.D.I.T.H. Defense Engine",
            process: "system_shield",
            hook: "Auto-Containment Policy",
            action: "PROCESS ISOLATED",
            details: "Auto-freeze triggered: High-risk permissions revoked and process isolated.",
            severity: "critical",
          },
          {
            app: "Incident Evidence Engine",
            process: "evidence_dossier",
            hook: "Forensic Hash Chain",
            action: "EVIDENCE SEALED",
            details: "Incident #EDITH-INC-2026-8941 sealed into cryptographic hash chain.",
            severity: "success",
          },
        ]
      } else if (scenario === "remote_screen") {
        rawList = [
          {
            app: "DeskViewer QuickSupport",
            process: "com.support.deskviewer",
            hook: "Package Installer",
            action: "SIDELOAD DETECTED",
            details: "Direct APK installation initiated during incoming call from unknown caller.",
            severity: "warning",
          },
          {
            app: "DeskViewer QuickSupport",
            process: "com.support.deskviewer",
            hook: "MediaProjection Service",
            action: "SCREEN MIRROR ATTEMPT",
            details: "Attempted background screen recording without explicit user confirmation.",
            severity: "warning",
          },
          {
            app: "DeskViewer QuickSupport",
            process: "com.support.deskviewer",
            hook: "Accessibility Hook",
            action: "KEYLOGGER PROBE",
            details: "Scraped screen text coordinates while user opened SBI banking application.",
            severity: "critical",
          },
          {
            app: "DeskViewer QuickSupport",
            process: "com.support.deskviewer",
            hook: "Outbound TCP Stream",
            action: "REMOTE EXFILTRATION",
            details: "Video stream connection opened to foreign IP 185.220.101.5.",
            severity: "critical",
          },
          {
            app: "E.D.I.T.H. Defense Engine",
            process: "system_shield",
            hook: "Screen Takeover Killer",
            action: "SESSION TERMINATED",
            details: "Killed MediaProjection token, blocked outbound socket, quarantined package.",
            severity: "critical",
          },
          {
            app: "Incident Evidence Engine",
            process: "evidence_dossier",
            hook: "Forensic Hash Chain",
            action: "EVIDENCE SEALED",
            details: "Screen takeover attempt recorded and sealed into tamper-proof chain.",
            severity: "success",
          },
        ]
      } else {
        // loan_app
        rawList = [
          {
            app: "Instant Rupee Cash",
            process: "com.rupee.cashloan.instant",
            hook: "Web Link Download",
            action: "UNKNOWN SOURCE",
            details: "Unregistered micro-loan APK downloaded from social media advertisement.",
            severity: "warning",
          },
          {
            app: "Instant Rupee Cash",
            process: "com.rupee.cashloan.instant",
            hook: "Permission Request",
            action: "CONTACTS & CAMERA",
            details: "Demanded full address book and camera access prior to showing terms.",
            severity: "warning",
          },
          {
            app: "Instant Rupee Cash",
            process: "com.rupee.cashloan.instant",
            hook: "Address Book Provider",
            action: "CONTACTS SCRAPE",
            details: "Scraped 482 contact entries in background for extortion list.",
            severity: "critical",
          },
          {
            app: "Privacy Doppelganger",
            process: "doppelganger_engine",
            hook: "Decoy Data Substitution",
            action: "SYNTHETIC INJECTION",
            details: "Supplied 154 synthetic decoy contacts with active carrier tripwires.",
            severity: "success",
          },
          {
            app: "Instant Rupee Cash",
            process: "com.rupee.cashloan.instant",
            hook: "Outbound HTTP Post",
            action: "EXFILTRATION ATTEMPT",
            details: "Sent payload to 'upload.rupeecash.live'. Real contacts remained hidden.",
            severity: "critical",
          },
          {
            app: "E.D.I.T.H. Defense Engine",
            process: "system_shield",
            hook: "Fraud Isolation",
            action: "APP QUARANTINED",
            details: "App locked and complaint report filed under BNS Sec. 318(4).",
            severity: "success",
          },
        ]
      }

      // Stream events one by one (~800ms each)
      let prevHash = "0000000000000000000000000000000000000000000000000000000000000000"
      const builtList: BlackBoxChainEvent[] = []

      for (let i = 0; i < rawList.length; i++) {
        const item = rawList[i]
        const time = format24hTime(now, i * 4)
        const hashInput = `${prevHash}|${time}|${item.app}|${item.details}|${item.action}`
        const hash = await sha256Hex(hashInput)

        const chainedEvt: BlackBoxChainEvent = {
          id: `bb-evt-${i + 1}-${Date.now()}`,
          index: i + 1,
          timestamp: time,
          app: item.app,
          process: item.process,
          hook: item.hook,
          action: item.action,
          details: item.details,
          severity: item.severity,
          prevHash,
          hash,
        }
        builtList.push(chainedEvt)
        prevHash = hash

        // Stream into state with delay
        await new Promise((res) => setTimeout(res, 600))
        setBlackBoxEvents([...builtList])

        // Also add to global activity logs
        appendEvent({
          id: chainedEvt.id,
          timestamp: chainedEvt.timestamp,
          app: chainedEvt.app,
          process: chainedEvt.process,
          hook: chainedEvt.hook,
          action: chainedEvt.action,
          details: chainedEvt.details,
          severity: chainedEvt.severity,
          ruleTriggered: `BLACK_BOX_EVENT_${i + 1}`,
          explanation: chainedEvt.details,
        })
      }

      setIsRecordingBlackBox(false)
      toast.success("Incident recorded in Black Box with SHA-256 hash chain!")
    },
    [blackBoxScenario, appendEvent]
  )

  // Incident Black Box: Tamper with event #3
  const tamperBlackBoxEvent = useCallback(() => {
    if (blackBoxEvents.length < 3) {
      toast.error("Please record a scenario first before tampering.")
      return
    }

    setBlackBoxEvents((prev) =>
      prev.map((e, idx) => {
        if (idx === 2) {
          // Event #3
          return {
            ...e,
            details: "[TAMPERED FOR DEMO] User explicitly approved bulk SMS transfer without warning.",
          }
        }
        return e
      })
    )
    setTamperedIndex(3)
    setVerificationResult(null)
    toast.error("Event #3 text tampered in memory!", {
      description: "Click 'Verify evidence' now to see cryptographic verification catch the alteration.",
    })
  }, [blackBoxEvents])

  // Incident Black Box: Verify Evidence Chain
  const verifyBlackBoxEvidence = useCallback(async () => {
    if (blackBoxEvents.length === 0) {
      toast.error("No events to verify. Record an incident first.")
      return
    }

    let runningHash = "0000000000000000000000000000000000000000000000000000000000000000"
    let failedIndex: number | null = null

    for (let i = 0; i < blackBoxEvents.length; i++) {
      const e = blackBoxEvents[i]
      const expected = await sha256Hex(`${runningHash}|${e.timestamp}|${e.app}|${e.details}|${e.action}`)
      if (expected !== e.hash) {
        failedIndex = i + 1
        break
      }
      runningHash = expected
    }

    if (failedIndex !== null) {
      setVerificationResult({
        checked: true,
        isValid: false,
        failedIndex,
      })
      toast.error(`Verification FAILED at event #${failedIndex}!`, {
        description: `Cryptographic SHA-256 mismatch detected. Evidence record was modified.`,
      })
    } else {
      setVerificationResult({
        checked: true,
        isValid: true,
        failedIndex: null,
      })
      toast.success("Evidence intact - no tampering detected!", {
        description: "All SHA-256 hashes successfully recomputed from event 1 to the end.",
      })
    }
  }, [blackBoxEvents])

  // Incident Black Box: Export JSON
  const exportBlackBoxJson = useCallback(() => {
    if (blackBoxEvents.length === 0) {
      toast.error("No evidence to export. Record an incident first.")
      return
    }

    const payload = {
      standard: "Bharatiya Sakshya Adhiniyam 2023 (BSA Sec. 63 Electronic Record Certificate)",
      title: "E.D.I.T.H. Tamper-Proof Security Incident Black Box Record",
      exportedAt: new Date().toISOString(),
      scenario: blackBoxScenario,
      verificationStatus: verificationResult
        ? verificationResult.isValid
          ? "VERIFIED_INTACT"
          : `TAMPERED_AT_EVENT_${verificationResult.failedIndex}`
        : "NOT_YET_VERIFIED",
      eventCount: blackBoxEvents.length,
      events: blackBoxEvents.map((e) => ({
        eventNumber: e.index,
        timestampIST: e.timestamp,
        application: e.app,
        processIdentifier: e.process,
        sensorHook: e.hook,
        actionTaken: e.action,
        details: e.details,
        severity: e.severity,
        previousSha256: e.prevHash,
        currentSha256: e.hash,
      })),
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `EDITH-Incident-BlackBox-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)

    toast.success("Exported incident evidence JSON file.")
  }, [blackBoxEvents, blackBoxScenario, verificationResult])

  // Activity Logs: Add a sample day of activity (15-20 realistic events)
  const addSampleDayOfActivity = useCallback(() => {
    setHasRun(true)
    const now = new Date()

    const daySamples: SimulationEvent[] = [
      {
        id: `sample-day-1-${Date.now()}`,
        timestamp: "08:15:22",
        app: "BHIM UPI",
        process: "in.org.npci.upiapp",
        hook: "Network Connection",
        action: "ALLOWED",
        details: "Bank server handshake for morning balance synchronization.",
        severity: "info",
        ruleTriggered: "DECLARED_PURPOSE_MATCH",
        explanation: "UPI app querying NPCI settlement servers within normal operational parameters.",
      },
      {
        id: `sample-day-2-${Date.now()}`,
        timestamp: "09:02:14",
        app: "Mausam Weather",
        process: "gov.imd.mausam",
        hook: "Location Sensor",
        action: "ALLOWED",
        details: "Coarse city-level location check for daily temperature bulletin.",
        severity: "info",
        ruleTriggered: "DECLARED_PURPOSE_MATCH",
        explanation: "Weather forecast retrieved using coarse (city-level) coordinates.",
      },
      {
        id: `sample-day-3-${Date.now()}`,
        timestamp: "10:14:48",
        app: "DigiLocker Verification",
        process: "com.digilocker.android",
        hook: "Storage Provider",
        action: "ALLOWED",
        details: "Fetched Aadhaar e-KYC payload with valid cryptographic signature.",
        severity: "info",
        ruleTriggered: "OFFICIAL_GOVERNMENT_APP",
        explanation: "National digital identity verification completed through official UIDAI pipeline.",
      },
      {
        id: `sample-day-4-${Date.now()}`,
        timestamp: "11:32:05",
        app: "Google Play Services",
        process: "com.google.android.gms",
        hook: "Play Protect Scanner",
        action: "ALLOWED",
        details: "Background malware signature definition update.",
        severity: "info",
        ruleTriggered: "SYSTEM_COMPONENT",
        explanation: "Built-in operating system security service updating signature definitions.",
      },
      {
        id: `sample-day-5-${Date.now()}`,
        timestamp: "12:45:19",
        app: "Flashlight Torch Pro",
        process: "com.simple.flashlight.torch",
        hook: "Microphone Access",
        action: "BLOCKED",
        details: "Flashlight utility attempted to activate background audio recording.",
        severity: "critical",
        ruleTriggered: "IRRELEVANT_MICROPHONE_ACCESS",
        explanation: "Flashlight utilities have zero functional requirement for audio listening hardware.",
      },
      {
        id: `sample-day-6-${Date.now()}`,
        timestamp: "13:20:30",
        app: "TrendyShop Fast Deals",
        process: "com.trendyshop.fastdeals",
        hook: "Clipboard Listener",
        action: "FLAGGED",
        details: "Attempted to read system clipboard while banking app was active in background.",
        severity: "warning",
        ruleTriggered: "CLIPBOARD_SNOOPING_ANOMALY",
        explanation: "Shopping app inspected copied text which frequently contains sensitive 2FA codes.",
      },
      {
        id: `sample-day-7-${Date.now()}`,
        timestamp: "14:10:04",
        app: "WhatsApp Messenger",
        process: "com.whatsapp",
        hook: "Cloud Storage Backup",
        action: "ALLOWED",
        details: "Nightly end-to-end encrypted chat backup upload.",
        severity: "info",
        ruleTriggered: "USER_SCHEDULED_TASK",
        explanation: "Standard encrypted message backup to user's authorized cloud drive.",
      },
      {
        id: `sample-day-8-${Date.now()}`,
        timestamp: "15:05:51",
        app: "SocialMedia Video Hub",
        process: "com.socialhub.video",
        hook: "Background GPS Poll",
        action: "FLAGGED",
        details: "Queried precise GPS coordinates 14 times while app was minimized in background.",
        severity: "warning",
        ruleTriggered: "BACKGROUND_LOCATION_LEAK",
        explanation: "Continuous high-frequency background GPS queries waste battery and track user movements.",
      },
      {
        id: `sample-day-9-${Date.now()}`,
        timestamp: "16:18:22",
        app: "RTO Challan QuickPay",
        process: "com.rto.echallan.quickpay",
        hook: "SMS Content Provider",
        action: "BLOCKED",
        details: "Attempted bulk harvest of 212 SMS messages in 4 seconds.",
        severity: "critical",
        ruleTriggered: "BULK_SMS_READ_SPIKE",
        explanation: "Unverified traffic app attempted to siphon SMS messages to intercept banking codes.",
      },
      {
        id: `sample-day-10-${Date.now()}`,
        timestamp: "16:18:25",
        app: "E.D.I.T.H. Defense Engine",
        process: "system_shield",
        hook: "Auto-Containment Policy",
        action: "ISOLATED & FROZEN",
        details: "Revoked SMS and Accessibility scopes for RTO Challan QuickPay.",
        severity: "critical",
        ruleTriggered: "AUTO_CONTAINMENT_POLICY",
        explanation: "Application locked to prevent financial theft and identity leakage.",
      },
      {
        id: `sample-day-11-${Date.now()}`,
        timestamp: "17:40:12",
        app: "Smart Dialer CallerID",
        process: "com.smartdialer.callerid",
        hook: "Call Log Provider",
        action: "BLOCKED",
        details: "Sideloaded dialer attempted to upload entire 90-day call history to foreign server.",
        severity: "critical",
        ruleTriggered: "CALL_LOG_EXFILTRATION",
        explanation: "Unverified third-party dialers harvesting full call histories violate privacy safeguards.",
      },
      {
        id: `sample-day-12-${Date.now()}`,
        timestamp: "18:22:45",
        app: "Foodie Quick Express",
        process: "com.foodie.quickexpress",
        hook: "Coarse Location",
        action: "ALLOWED",
        details: "Retrieved delivery restaurant list for current neighborhood.",
        severity: "info",
        ruleTriggered: "DECLARED_PURPOSE_MATCH",
        explanation: "Food delivery application requesting local venue options.",
      },
      {
        id: `sample-day-13-${Date.now()}`,
        timestamp: "19:15:33",
        app: "Screen Recorder Free",
        process: "com.screenrec.free",
        hook: "Overlay Window",
        action: "BLOCKED",
        details: "Attempted to draw invisible overlay window on top of PhonePe PIN entry screen.",
        severity: "critical",
        ruleTriggered: "TAPJACKING_OVERLAY_ATTEMPT",
        explanation: "Invisible overlay windows (tapjacking) are used to capture secret UPI PIN inputs.",
      },
      {
        id: `sample-day-14-${Date.now()}`,
        timestamp: "20:30:10",
        app: "FitPulse Wearable Sync",
        process: "com.fitpulse.health",
        hook: "Bluetooth LE Radio",
        action: "ALLOWED",
        details: "Synchronized daily step count and heart rate records from smart band.",
        severity: "info",
        ruleTriggered: "DECLARED_PURPOSE_MATCH",
        explanation: "Fitness companion device communicating over local Bluetooth radio.",
      },
      {
        id: `sample-day-15-${Date.now()}`,
        timestamp: "21:45:00",
        app: "Android Battery Service",
        process: "android.os.batterymanager",
        hook: "Power Profile Optimization",
        action: "ALLOWED",
        details: "Routine background battery charge cycle diagnostics.",
        severity: "info",
        ruleTriggered: "SYSTEM_COMPONENT",
        explanation: "Operating system power management subsystem running routine health checks.",
      },
      {
        id: `sample-day-16-${Date.now()}`,
        timestamp: "22:10:19",
        app: "Privacy Doppelganger",
        process: "doppelganger_engine",
        hook: "Decoy Data Substitution",
        action: "DECOY DATA SERVED",
        details: "Injected 154 synthetic contacts to isolated scraper process.",
        severity: "success",
        ruleTriggered: "DECOY_PROTECTION_ENGAGED",
        explanation: "Synthetic decoy records safely fed to contained process.",
      },
    ]

    setEvents((prev) => {
      const existingIds = new Set(prev.map((e) => e.id))
      const fresh = daySamples.filter((s) => !existingIds.has(s.id))
      return [...fresh, ...prev]
    })

    toast.success("Added 16 realistic daily events to Activity Logs!")
  }, [])

  // Judge manual scenario triggers
  const triggerManualEvent = useCallback(
    (
      appId: string,
      eventType:
        | "INSTALL_WHATSAPP"
        | "GRANT_SMS"
        | "GRANT_ACCESSIBILITY"
        | "GRANT_INSTALL_PACKAGES"
        | "GRANT_NOTIFICATION"
        | "BULK_SMS_READ"
        | "HIDE_ICON"
        | "CONTACT_NEW_DOMAIN"
        | "REVOKE_SMS"
        | "REVOKE_ACCESSIBILITY"
        | "RESTORE_APP"
    ) => {
      setHasRun(true)
      const now = new Date()
      const timeStr = format24hTime(now)

      setApps((prev) =>
        prev.map((app) => {
          if (app.id !== appId) return app

          const updated: AppProfile = {
            ...app,
            grantedPermissions: [...app.grantedPermissions],
            activeBehaviors: { ...app.activeBehaviors },
          }

          if (eventType === "INSTALL_WHATSAPP") {
            updated.installSource = "WhatsApp file"
            updated.impersonatesBrand = true
            appendEvent({
              id: `evt-manual-${Date.now()}`,
              timestamp: timeStr,
              app: app.name,
              process: app.packageName,
              hook: "Package Broadcast Receiver",
              action: "MANUAL_INSTALL",
              details: `Scenario event: Installed from WhatsApp file (+25 risk points).`,
              severity: "warning",
            })
            toast.warning(`[Scenario Trigger] ${app.name} marked as WhatsApp sideload (+25 pts)`)
          } else if (eventType === "GRANT_SMS") {
            if (!updated.grantedPermissions.some((p) => p.includes("SMS"))) {
              updated.grantedPermissions.push("Read SMS")
              appendEvent({
                id: `evt-manual-${Date.now()}`,
                timestamp: timeStr,
                app: app.name,
                process: app.packageName,
                hook: "Permission Request Gate",
                action: "PERMISSION_GRANT",
                details: `Scenario event: Granted READ_SMS scope (+30 risk points).`,
                severity: "warning",
              })
              toast.warning(`[Scenario Trigger] Granted SMS scope to ${app.name} (+30 pts)`)
            }
          } else if (eventType === "GRANT_ACCESSIBILITY") {
            if (!updated.grantedPermissions.some((p) => p.includes("Accessibility"))) {
              updated.grantedPermissions.push("Accessibility Service")
              appendEvent({
                id: `evt-manual-${Date.now()}`,
                timestamp: timeStr,
                app: app.name,
                process: app.packageName,
                hook: "Accessibility Hook",
                action: "SERVICE_BIND",
                details: `Scenario event: Granted Accessibility Service (+30 risk points).`,
                severity: "warning",
              })
              toast.warning(`[Scenario Trigger] Granted Accessibility to ${app.name} (+30 pts)`)
            }
          } else if (eventType === "GRANT_INSTALL_PACKAGES") {
            if (!updated.grantedPermissions.some((p) => p.includes("Install Packages"))) {
              updated.grantedPermissions.push("Install Packages")
              appendEvent({
                id: `evt-manual-${Date.now()}`,
                timestamp: timeStr,
                app: app.name,
                process: app.packageName,
                hook: "Package Installer Hook",
                action: "DROPPER_SCOPE",
                details: `Scenario event: Granted Install-packages capability (+20 risk points).`,
                severity: "warning",
              })
              toast.warning(`[Scenario Trigger] Granted Install Packages to ${app.name} (+20 pts)`)
            }
          } else if (eventType === "BULK_SMS_READ") {
            updated.activeBehaviors.bulkSmsRead = true
            appendEvent({
              id: `evt-manual-${Date.now()}`,
              timestamp: timeStr,
              app: app.name,
              process: app.packageName,
              hook: "SMS Content Provider",
              action: "BULK_HARVEST",
              details: `Scenario event: Bulk read of 212 SMS in 4s (+25 risk points).`,
              severity: "critical",
            })
            toast.error(`[Scenario Trigger] Bulk SMS harvest anomaly on ${app.name} (+25 pts)`)
          } else if (eventType === "HIDE_ICON") {
            updated.activeBehaviors.hidesIcon = true
            appendEvent({
              id: `evt-manual-${Date.now()}`,
              timestamp: timeStr,
              app: app.name,
              process: app.packageName,
              hook: "Launcher Setting",
              action: "ICON_HIDDEN",
              details: `Scenario event: Hidden launcher activity icon (+20 risk points).`,
              severity: "warning",
            })
            toast.warning(`[Scenario Trigger] App icon concealed for ${app.name} (+20 pts)`)
          } else if (eventType === "CONTACT_NEW_DOMAIN") {
            updated.activeBehaviors.contactsNewDomain = true
            appendEvent({
              id: `evt-manual-${Date.now()}`,
              timestamp: timeStr,
              app: app.name,
              process: app.packageName,
              hook: "Socket Connect",
              action: "C2_BEACON",
              details: `Scenario event: Outbound connection to new domain (+10 risk points).`,
              severity: "warning",
            })
            toast.warning(`[Scenario Trigger] Outbound C2 socket from ${app.name} (+10 pts)`)
          } else if (eventType === "REVOKE_SMS") {
            updated.grantedPermissions = updated.grantedPermissions.filter((p) => !p.includes("SMS"))
            updated.activeBehaviors.bulkSmsRead = false
            appendEvent({
              id: `evt-manual-${Date.now()}`,
              timestamp: timeStr,
              app: app.name,
              process: app.packageName,
              hook: "Permission Revocation",
              action: "PERMISSION_REVOKED",
              details: `Consent Ledger: SMS permission manually revoked by user.`,
              severity: "info",
            })
            toast.success(`Consent Revoked: SMS for ${app.name}`)
          } else if (eventType === "REVOKE_ACCESSIBILITY") {
            updated.grantedPermissions = updated.grantedPermissions.filter(
              (p) => !p.includes("Accessibility")
            )
            appendEvent({
              id: `evt-manual-${Date.now()}`,
              timestamp: timeStr,
              app: app.name,
              process: app.packageName,
              hook: "Accessibility Revocation",
              action: "PERMISSION_REVOKED",
              details: `Consent Ledger: Accessibility permission manually revoked by user.`,
              severity: "info",
            })
            toast.success(`Consent Revoked: Accessibility for ${app.name}`)
          } else if (eventType === "RESTORE_APP") {
            const baseline = BASELINE_APPS.find((b) => b.id === appId)
            return baseline ? { ...baseline } : app
          }

          return updated
        })
      )
    },
    [appendEvent]
  )

  useEffect(() => {
    return () => clearAllTimers()
  }, [])

  return (
    <SimulationContext.Provider
      value={{
        isRunning,
        isCompleted,
        currentStep,
        baseTime,
        apps,
        evaluations,
        events,
        hasRun,
        evidenceHash,
        consentHistory,
        activeLure,
        runSimulation,
        resetSimulation,
        setStepManually,
        addEvent: appendEvent,
        resetAllDemoData,

        // Privacy Doppelganger
        decoyEnabled,
        setDecoyEnabled,
        serveDecoyData: decoyEnabled,
        setServeDecoyData: setDecoyEnabled,
        decoyReadsCount,
        lastDecoyRead,
        simulateAppReadsData,
        simulateDecoyTripwire,
        decoyTripwireAlert,
        dismissTripwireAlert,
        triggerManualEvent,

        // Incident Black Box
        blackBoxEvents,
        isRecordingBlackBox,
        blackBoxScenario,
        setBlackBoxScenario,
        recordBlackBoxScenario,
        replayStep,
        setReplayStep,
        tamperedIndex,
        tamperBlackBoxEvent,
        verificationResult,
        verifyBlackBoxEvidence,
        exportBlackBoxJson,

        // Consent Ledger
        toggleAppPermission,
        applyAllRecommendations,
        activeCreepAlert,
        triggerPermissionCreep,
        respondToPermissionCreep,

        // Activity Logs
        addSampleDayOfActivity,
      }}
    >
      {children}
    </SimulationContext.Provider>
  )
}

export function useSimulation() {
  const context = useContext(SimulationContext)
  if (!context) {
    throw new Error("useSimulation must be used within a SimulationProvider")
  }
  return context
}