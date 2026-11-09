export type AppStatus = "healthy" | "suspicious" | "suspended" | "revoked"

export interface ConnectedApp {
  id: string
  name: string
  permissions: string[]
  requestsPerHour: number
  spike?: boolean
  trustScore: number
  status: AppStatus
}

export type LogResult = "Allowed" | "Flagged" | "Blocked"

export interface AccessLogEntry {
  id: string
  time: string
  app: string
  resource: string
  result: LogResult
}

export const initialApps: ConnectedApp[] = [
  {
    id: "resume-builder",
    name: "Resume Builder",
    permissions: ["Contacts", "Files"],
    requestsPerHour: 3050,
    spike: true,
    trustScore: 34,
    status: "suspicious",
  },
  {
    id: "budget-tracker",
    name: "Budget Tracker",
    permissions: ["Read SMS", "Bank Logs"],
    requestsPerHour: 12,
    trustScore: 95,
    status: "healthy",
  },
  {
    id: "pixel-game",
    name: "Pixel Game",
    permissions: ["Local Network"],
    requestsPerHour: 2,
    trustScore: 88,
    status: "healthy",
  },
]

export const initialLogs: AccessLogEntry[] = [
  { id: "l1", time: "10:41 AM", app: "Budget Tracker", resource: "Bank Logs", result: "Allowed" },
  { id: "l2", time: "10:42 AM", app: "Pixel Game", resource: "Local Network", result: "Allowed" },
  { id: "l3", time: "10:44 AM", app: "Resume Builder", resource: "Contacts", result: "Allowed" },
  { id: "l4", time: "10:44 AM", app: "Resume Builder", resource: "Contacts", result: "Allowed" },
  { id: "l5", time: "10:45 AM", app: "Resume Builder", resource: "Drive Files", result: "Flagged" },
]

export const liveResources = ["Contacts", "Drive Files", "Contacts", "Drive Files", "Contacts"]

export const recommendations = [
  {
    id: "r1",
    severity: "critical" as const,
    title: "Revoke Resume Builder access to Contacts and Drive Files",
    detail:
      "The app escalated from limited access to 3,050 requests/hr. Its trust score fell from 92 to 34 within minutes.",
  },
  {
    id: "r2",
    severity: "medium" as const,
    title: "Review Budget Tracker's Bank Logs permission",
    detail:
      "Highly sensitive scope. Consider restricting it to read-only transaction summaries instead of full logs.",
  },
  {
    id: "r3",
    severity: "low" as const,
    title: "Enable automatic suspension on request spikes",
    detail:
      "Apps exceeding 10x their baseline request rate can be suspended automatically until you approve them.",
  },
  {
    id: "r4",
    severity: "low" as const,
    title: "Rotate access tokens older than 90 days",
    detail: "Two connected apps are using tokens issued more than 90 days ago.",
  },
]

export function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}

export const resumeBuilderProfile = {
  publisher: "Nimbus Labs Inc.",
  publisherVerified: false,
  installed: "Oct 28, 2026",
  installedAgo: "12 days ago",
  version: "2.4.1",
  source: "Third-party web connector",
  domain: "app.nimbus-resume.io",
}

export const trustBaseline = 92

export const trustDeductions = [
  { id: "d1", points: 40, reason: "50x request spike", detail: "Request rate jumped from ~4/hr to 3,050/hr within one minute." },
  { id: "d2", points: 16, reason: "Out-of-bounds Drive access", detail: "Attempted to read files outside the folders you approved." },
  { id: "d3", points: 2, reason: "Unverified publisher", detail: "Publisher identity has not been confirmed." },
]

export const permissionList = [
  { id: "Contacts", description: "Read names, emails and phone numbers" },
  { id: "Drive Files", description: "Read and download files from Drive" },
  { id: "Camera", description: "Capture photos and video" },
  { id: "Microphone", description: "Record audio" },
] as const

export type PermissionId = (typeof permissionList)[number]["id"]

const baselineRequests = [4, 3, 5, 4, 2, 3, 4, 6, 5, 4, 3, 4, 5, 4, 3, 2, 4, 5, 4, 3, 4, 5, 4]

function hourLabel(hoursAgo: number) {
  const hour = (((10 - hoursAgo) % 24) + 24) % 24
  const suffix = hour >= 12 ? "PM" : "AM"
  return `${hour % 12 === 0 ? 12 : hour % 12} ${suffix}`
}

export const requestHistory = [...baselineRequests, 3050].map((requests, i, all) => ({
  time: i === all.length - 1 ? "Now" : hourLabel(all.length - 1 - i),
  requests,
}))

export interface ForensicEntry {
  id: string
  time: string
  action: string
  instances: number
  result: LogResult
}

export const forensicLog: ForensicEntry[] = [
  { id: "f1", time: "10:45:01 AM", action: "Requested Drive Files", instances: 1, result: "Blocked" },
  { id: "f2", time: "10:45:00 AM", action: "Requested Contacts", instances: 50, result: "Flagged" },
  { id: "f3", time: "09:12:00 AM", action: "Requested Contacts", instances: 1, result: "Allowed" },
]
