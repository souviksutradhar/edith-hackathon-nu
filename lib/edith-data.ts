export type AppStatus = "Active" | "Warning" | "Frozen" | "Suspended" | "Flagged" | "healthy" | "suspicious" | "suspended" | "revoked" | string

export interface ConnectedApp {
  id: string | number
  name: string
  packageName?: string
  declaredPurpose?: string
  expectedPermissions?: string[]
  grantedPermissions?: string[]
  permissions: string[]
  installSource?: string
  requestsPerHour?: number
  spike?: boolean
  trustScore: number
  status: AppStatus
  alert?: string | null
  killChainStage?: number
  activeRiskSignals?: string[]
}

export type LogResult = "Allowed" | "Flagged" | "Blocked"

export interface AccessLogEntry {
  id: string
  time: string
  app: string
  resource: string
  result: LogResult
  details?: string
}

export interface ThreatAnalysis {
  threat_level: "high" | "low" | "CRITICAL" | "HIGH" | "LOW" | string
  recommended_action?: string
  trust_score_deduction?: number
  reason_for_user: string
  rawJson?: any
  targetApp?: string
  targetAppId?: string | number
}

export interface RATIncident {
  timestamp: string
  ai_response?: {
    threat_level: "CRITICAL" | "HIGH" | "LOW" | string
    attack_vector: "REMOTE_ACCESS_TAKEOVER" | "ACCESSIBILITY_SCRAPING" | "BENIGN" | string
    automated_mitigation: string
    trust_score_deduction: number
    confidence_score: number
    incident_summary: string
  }
  confidence_score: number
  incident_summary: string
  automated_mitigation: string
}

export interface DeviceTelemetry {
  device: string
  trust_score: number
  status: "SECURE" | "COMPROMISED - MITIGATED" | string
  telephony_state: string
  remote_access_service: string
  sideloaded_app: string
  accessibility_status: string
  foreground_app: string
  mitigation_status?: string
  last_incident?: RATIncident | null
}

export interface LegalViolation {
  section: string
  act: string
  offense: string
  penalty: string
}

export interface ComplaintDossier {
  dossierId: string
  generatedAt: string
  reportingPortal: string
  helpline: string
  targetApp: {
    name: string
    packageName: string
    sha256: string
    installSource: string
    declaredPurpose: string
    actualAbusePattern: string
  }
  victimEndpoint: {
    device: string
    osBuild: string
    agentStatus: string
  }
  exfiltratedTargetData: string[]
  killSwitchMitigationsApplied: string[]
  applicableLaws: LegalViolation[]
  victimGuidance: string
}

export interface KillChainStage {
  stage: number
  id: string
  label: string
  description: string
  trustScore: number
  status: string
  addedPermissions: string[]
  signals: string[]
  severity: "low" | "medium" | "high" | "critical" | "neutralized"
}

export const initialApps: ConnectedApp[] = [
  {
    id: 1,
    name: "BHIM UPI",
    packageName: "in.org.npci.upiapp",
    declaredPurpose: "Payments & Financial UPI",
    expectedPermissions: ["Contacts", "SMS", "Location"],
    grantedPermissions: ["Contacts", "SMS", "Location"],
    permissions: ["Contacts", "SMS", "Location"],
    installSource: "Play Store",
    trustScore: 96,
    status: "Active",
    requestsPerHour: 24,
    spike: false,
    killChainStage: 0,
    activeRiskSignals: []
  },
  {
    id: 2,
    name: "Mausam Weather",
    packageName: "com.imd.mausam.weather",
    declaredPurpose: "Weather Forecasting",
    expectedPermissions: ["Location"],
    grantedPermissions: ["Location"],
    permissions: ["Location"],
    installSource: "Play Store",
    trustScore: 98,
    status: "Active",
    requestsPerHour: 4,
    spike: false,
    killChainStage: 0,
    activeRiskSignals: []
  },
  {
    id: 3,
    name: "RTO Challan QuickPay",
    packageName: "com.rto.echallan.quickpay.apk",
    declaredPurpose: "Utility/Challan Payment",
    expectedPermissions: ["Camera", "Internet"],
    grantedPermissions: ["Internet"],
    permissions: ["Internet"],
    installSource: "WhatsApp Sideload",
    trustScore: 88,
    status: "Active",
    requestsPerHour: 12,
    spike: false,
    killChainStage: 0,
    activeRiskSignals: []
  }
]

export const initialLogs: AccessLogEntry[] = [
  { id: "log-1", time: "10:41 AM", app: "BHIM UPI", resource: "Bank Logs", result: "Allowed", details: "Routine NPCI UPI payment settlement check" },
  { id: "log-2", time: "10:42 AM", app: "Mausam Weather", resource: "Location", result: "Allowed", details: "Coarse geo-lookup for precipitation forecast" },
  { id: "log-3", time: "10:43 AM", app: "RTO Challan QuickPay", resource: "Internet", result: "Allowed", details: "Package install manifest registered" },
]

export const liveResources = ["Contacts", "Drive Files", "Bank Logs", "Location", "Local Network"]

export const recommendations = [
  {
    id: "r1",
    severity: "critical" as const,
    title: "Revoke RTO Challan QuickPay access to SMS and Accessibility",
    detail:
      "Utility application requesting BIND_ACCESSIBILITY_SERVICE and bulk OTP reading. Kill-switch containment recommended.",
  },
  {
    id: "r2",
    severity: "critical" as const,
    title: "Enforce FLAG_SECURE on Mobile Banking Screens",
    detail:
      "Prevent Remote Access Tools (AnyDesk, RustDesk) from screen-mirroring credentials and OTPs on PhonePe/BHIM.",
  },
  {
    id: "r3",
    severity: "medium" as const,
    title: "Audit Android Accessibility permissions for Sideloaded APKs",
    detail: "Immediately flag any non-Play Store APK requesting BIND_ACCESSIBILITY_SERVICE.",
  },
  {
    id: "r4",
    severity: "low" as const,
    title: "Rotate access tokens older than 90 days",
    detail: "Connected applications are using tokens issued more than 90 days ago.",
  },
]

export interface CallerThreatResult {
  phoneNumber: string
  contextType?: "CALL" | "SMS"
  identifiedEntity: string
  telecomCircle: string
  chakshuReportsCount: number
  spamCategory: string
  riskScore: number
  threatLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"
  geminiAnalysis: string
  recommendedAction: "BLOCK_AND_REPORT_1930" | "WARN_USER" | "ALLOW"
  isKnownScamNetwork: boolean
  messageText?: string
  reportedToChakshu?: boolean
  reportReferenceId?: string
}

export interface CallerPreset {
  id: string
  title: string
  phoneNumber: string
  contextType: "CALL" | "SMS"
  messageText: string
  expectedType: "scam" | "clean"
}

export const CALLER_PRESETS: CallerPreset[] = [
  {
    id: "preset-1",
    title: "Preset 1: Electricity Bill Disconnection Scam",
    phoneNumber: "+91 98321 00000",
    contextType: "SMS",
    messageText: "Dear consumer your electricity power will be disconnected tonight at 9:30 PM from electricity office because your previous month bill was not updated. Please immediately contact our power officer 9832100000 or pay via apk.",
    expectedType: "scam"
  },
  {
    id: "preset-2",
    title: "Preset 2: Fake Courier Address Update",
    phoneNumber: "+91 87654 32100",
    contextType: "SMS",
    messageText: "IndiaPost: Your package delivery has been put on hold due to incomplete house address number. Please update your address within 24 hours at http://indiapost-update-kyc.in to avoid return to sender.",
    expectedType: "scam"
  },
  {
    id: "preset-3",
    title: "Preset 3: Legitimate Friend / Normal Call",
    phoneNumber: "+91 94361 12345",
    contextType: "CALL",
    messageText: "Hey, are you free this evening? Let's catch up over coffee around 6 PM if you're done with work.",
    expectedType: "clean"
  }
]

// ==========================================
// 1. INCIDENT BLACK BOX FORENSICS TYPES
// ==========================================
export interface BlackBoxLogEntry {
  id: string
  timestamp: string
  processId: string
  processName: string
  sensorHook: "Accessibility Service" | "SMS Broadcast Receiver" | "Call Audio Tap" | "Screen Buffer Mirror" | "Clipboard Monitor"
  syscall: string
  riskWeight: number
  actionTaken: "ISOLATED & PACKED" | "QUARANTINED" | "ENCRYPTED_AND_LOGGED" | "BLOCKED"
  rawPayloadHash: string
}

export const initialBlackBoxLogs: BlackBoxLogEntry[] = [
  {
    id: "bb-1094",
    timestamp: "14:52:18.421",
    processId: "PID 18492 (com.rto.echallan.quickpay)",
    processName: "RTO Challan QuickPay",
    sensorHook: "Accessibility Service",
    syscall: "sys_accessibility_event_filter(TYPE_VIEW_TEXT_CHANGED)",
    riskWeight: 85,
    actionTaken: "ISOLATED & PACKED",
    rawPayloadHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  {
    id: "bb-1093",
    timestamp: "14:51:55.109",
    processId: "PID 18492 (com.rto.echallan.quickpay)",
    processName: "RTO Challan QuickPay",
    sensorHook: "SMS Broadcast Receiver",
    syscall: "sys_content_provider_query(content://sms/inbox)",
    riskWeight: 92,
    actionTaken: "ISOLATED & PACKED",
    rawPayloadHash: "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4"
  },
  {
    id: "bb-1092",
    timestamp: "14:49:12.784",
    processId: "PID 14201 (com.anydesk.anydeskandroid)",
    processName: "AnyDesk Remote Control",
    sensorHook: "Screen Buffer Mirror",
    syscall: "sys_media_projection_create_virtual_display()",
    riskWeight: 78,
    actionTaken: "QUARANTINED",
    rawPayloadHash: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8"
  },
  {
    id: "bb-1091",
    timestamp: "14:45:04.221",
    processId: "PID 9982 (com.telecom.spoofed.sip)",
    processName: "VoIP Gateway Trunk +92",
    sensorHook: "Call Audio Tap",
    syscall: "sys_audio_record_routing_intercept()",
    riskWeight: 95,
    actionTaken: "BLOCKED",
    rawPayloadHash: "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a"
  },
  {
    id: "bb-1090",
    timestamp: "14:40:33.892",
    processId: "PID 18492 (com.rto.echallan.quickpay)",
    processName: "RTO Challan QuickPay",
    sensorHook: "Clipboard Monitor",
    syscall: "sys_clipboard_get_primary_clip()",
    riskWeight: 65,
    actionTaken: "ENCRYPTED_AND_LOGGED",
    rawPayloadHash: "ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d"
  }
]

// ==========================================
// 2. DPDP ACT 2023 CONSENT RECEIPTS TYPES
// ==========================================
export interface ConsentReceipt {
  id: string
  appName: string
  packageName: string
  permissionScope: string
  explicitPurpose: string
  dataExpiry: string
  grantedAt: string
  sha256Fingerprint: string
  status: "ACTIVE" | "REVOKED" | "EXPIRED"
  legalBasis: "DPDP Act 2023 Sec 6(1)" | "Digital Personal Data Protection"
}

export const initialConsentReceipts: ConsentReceipt[] = [
  {
    id: "CR-2026-8941",
    appName: "BHIM UPI",
    packageName: "in.org.npci.upiapp",
    permissionScope: "Contacts, SMS, Location",
    explicitPurpose: "P2P UPI payment recipient lookup & NPCI device SIM binding",
    dataExpiry: "30 days (Auto-renews upon active session)",
    grantedAt: "01 Nov 2026, 09:30 AM",
    sha256Fingerprint: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
    status: "ACTIVE",
    legalBasis: "DPDP Act 2023 Sec 6(1)"
  },
  {
    id: "CR-2026-8942",
    appName: "Mausam Weather",
    packageName: "com.imd.mausam.weather",
    permissionScope: "Coarse Location",
    explicitPurpose: "Precipitation and local temperature forecast lookup only",
    dataExpiry: "Session Only (Ephemeral cache)",
    grantedAt: "03 Nov 2026, 11:15 AM",
    sha256Fingerprint: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
    status: "ACTIVE",
    legalBasis: "DPDP Act 2023 Sec 6(1)"
  },
  {
    id: "CR-2026-8943",
    appName: "RTO Challan QuickPay",
    packageName: "com.rto.echallan.quickpay.apk",
    permissionScope: "SMS, Accessibility, Camera",
    explicitPurpose: "Claimed challan payment verification; exceeded declared scope",
    dataExpiry: "Immediately Revoked by E.D.I.T.H. Kill-Switch",
    grantedAt: "09 Nov 2026, 10:20 AM",
    sha256Fingerprint: "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
    status: "REVOKED",
    legalBasis: "DPDP Act 2023 Sec 6(1)"
  },
  {
    id: "CR-2026-8940",
    appName: "Resume Builder Pro",
    packageName: "com.resumebuilder.pdf",
    permissionScope: "Device Storage / Files",
    explicitPurpose: "Export generated PDF resume to local Documents directory",
    dataExpiry: "Expired 05 Nov 2026",
    grantedAt: "05 Aug 2026, 02:40 PM",
    sha256Fingerprint: "ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d",
    status: "EXPIRED",
    legalBasis: "DPDP Act 2023 Sec 6(1)"
  }
]

// ==========================================
// 3. PRIVACY DOPPELGANGER CANARY TYPES
// ==========================================
export interface DoppelgangerCanaryProfile {
  syntheticContactsCount: number
  mockBankBalance: string
  mockBankName: string
  simulatedGeoLocation: string
  simulatedDeviceModel: string
  decoyOtpPattern: string
  activeEmulation: boolean
}

export interface DoppelgangerInterceptEvent {
  id: string
  timestamp: string
  app: string
  targetResource: string
  interceptAction: string
  decoyPayloadSupplied: string
}

export const initialDoppelgangerProfile: DoppelgangerCanaryProfile = {
  syntheticContactsCount: 154,
  mockBankBalance: "₹140.50",
  mockBankName: "State Bank of India (Canary Sandbox)",
  simulatedGeoLocation: "Agartala Airport (IXA), Tripura [23.8869° N, 91.2405° E]",
  simulatedDeviceModel: "Samsung Galaxy M14 (Virtual Decoy OEM)",
  decoyOtpPattern: "Dynamic 6-digit synthetic OTP token pool",
  activeEmulation: true
}

export const initialDoppelgangerIntercepts: DoppelgangerInterceptEvent[] = [
  {
    id: "dp-1",
    timestamp: "14:54:02",
    app: "RTO Challan QuickPay",
    targetResource: "Device Contacts List",
    interceptAction: "Unauthorized Contact Scraping Intercepted: Redirected to Canary DB",
    decoyPayloadSupplied: "154 synthetic mock contacts fed to isolate phone numbers"
  },
  {
    id: "dp-2",
    timestamp: "14:53:19",
    app: "Bijli_Bill_Update.apk",
    targetResource: "Banking OTP SMS",
    interceptAction: "SMS Harvest Attempted: Fed Decoy OTP Token",
    decoyPayloadSupplied: "Synthetic OTP token '839201' delivered; real SBI token retained in Knox vault"
  },
  {
    id: "dp-3",
    timestamp: "14:50:41",
    app: "Unknown Sideloaded Utility",
    targetResource: "GPS Fine Location",
    interceptAction: "Location Probe Intercepted: Geo-drift spoof applied",
    decoyPayloadSupplied: "Simulated Agartala Airport coordinates (23.8869° N, 91.2405° E)"
  }
]

export function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
}
