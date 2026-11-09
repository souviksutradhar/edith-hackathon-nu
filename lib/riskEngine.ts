/**
 * E.D.I.T.H. Risk & Heuristic Trust Engine
 * 
 * Transparent, weighted rule-based security evaluation for mobile apps.
 * Trust = 100 - Risk (clamped 0 to 100)
 * Status:
 *   - Risk < 40: Trusted
 *   - Risk 40-69: Watching / Suspicious
 *   - Risk >= 70: Frozen (Automatic OEM Kill-Switch Containment)
 */

export interface RiskRule {
  id: string
  name: string
  points: number
  description: string
}

export const RISK_RULES: Record<string, RiskRule> = {
  UNTRUSTED_INSTALL_SOURCE: {
    id: "UNTRUSTED_INSTALL_SOURCE",
    name: "Installed from WhatsApp / External Link",
    points: 25,
    description: "Application package installed via WhatsApp or sideload link rather than Google Play Protect.",
  },
  IMPERSONATES_BRAND: {
    id: "IMPERSONATES_BRAND",
    name: "Impersonates State / Institutional Brand",
    points: 10,
    description: "App package declares official utility/challan branding without verified cryptographic publisher signature.",
  },
  UNEXPECTED_SMS: {
    id: "UNEXPECTED_SMS",
    name: "Unexpected SMS Access Scope",
    points: 30,
    description: "READ_SMS or RECEIVE_SMS requested beyond app's declared utility purpose.",
  },
  UNEXPECTED_ACCESSIBILITY: {
    id: "UNEXPECTED_ACCESSIBILITY",
    name: "Unexpected Accessibility Service Hook",
    points: 30,
    description: "BIND_ACCESSIBILITY_SERVICE requested (allows screen scraping & keylogging).",
  },
  UNEXPECTED_INSTALL_PACKAGES: {
    id: "UNEXPECTED_INSTALL_PACKAGES",
    name: "Secondary Dropper Capability",
    points: 20,
    description: "REQUEST_INSTALL_PACKAGES requested (capability to install secondary APKs silently).",
  },
  UNEXPECTED_NOTIFICATION_LISTENER: {
    id: "UNEXPECTED_NOTIFICATION_LISTENER",
    name: "Notification Interception Scope",
    points: 15,
    description: "BIND_NOTIFICATION_LISTENER_SERVICE requested to observe incoming notification OTPs.",
  },
  BULK_SMS_READ_SPIKE: {
    id: "BULK_SMS_READ_SPIKE",
    name: "Bulk SMS Harvest Anomaly (> 10x baseline)",
    points: 25,
    description: "Application read 212 SMS messages in 4 seconds (device baseline: 0 queries/min).",
  },
  HIDES_APP_ICON: {
    id: "HIDES_APP_ICON",
    name: "Conceals Launcher Icon",
    points: 20,
    description: "Application disabled its main launcher activity component to resist user uninstallation.",
  },
  CONTACTS_NEW_DOMAIN: {
    id: "CONTACTS_NEW_DOMAIN",
    name: "Post-Grant C2 Domain Beacons",
    points: 10,
    description: "Outbound socket connection opened to an unindexed domain immediately after permissions grant.",
  },
}

export type AppSecurityStatus = "Trusted" | "Watching" | "Suspicious" | "Frozen"

export interface AppProfile {
  id: string
  name: string
  packageName: string
  declaredPurpose: string
  expectedPermissions: string[]
  installSource: "Google Play Store" | "WhatsApp file" | "Direct APK Sideload" | "SMS Link"
  impersonatesBrand?: boolean
  grantedPermissions: string[]
  activeBehaviors: {
    bulkSmsRead?: boolean
    hidesIcon?: boolean
    contactsNewDomain?: boolean
    notificationListener?: boolean
  }
}

export interface RuleMatch {
  ruleId: string
  name: string
  points: number
  reason: string
}

export interface RiskEvaluation {
  totalRisk: number
  trustScore: number
  status: AppSecurityStatus
  appliedRules: RuleMatch[]
  isContained: boolean
}

/**
 * Pure evaluation function: dynamically derives risk, trust score, status,
 * and an exact itemized breakdown of triggered rules.
 */
export function evaluateAppRisk(app: AppProfile): RiskEvaluation {
  const matches: RuleMatch[] = []
  let totalRisk = 0

  // 1. Install Source Check
  if (app.installSource !== "Google Play Store") {
    const rule = RISK_RULES.UNTRUSTED_INSTALL_SOURCE
    matches.push({
      ruleId: rule.id,
      name: rule.name,
      points: rule.points,
      reason: `Installed from "${app.installSource}" (not verified by Google Play Store)`,
    })
    totalRisk += rule.points
  }

  // 2. Brand Impersonation
  if (app.impersonatesBrand) {
    const rule = RISK_RULES.IMPERSONATES_BRAND
    matches.push({
      ruleId: rule.id,
      name: rule.name,
      points: rule.points,
      reason: `Declares state/bank brand without institutional signature`,
    })
    totalRisk += rule.points
  }

  // 3. Permission Scope Mismatch Checks
  const normalizedExpected = app.expectedPermissions.map((p) => p.toLowerCase())

  app.grantedPermissions.forEach((perm) => {
    const pLower = perm.toLowerCase()

    if (pLower.includes("sms") && !normalizedExpected.some((e) => e.includes("sms"))) {
      const rule = RISK_RULES.UNEXPECTED_SMS
      matches.push({
        ruleId: rule.id,
        name: rule.name,
        points: rule.points,
        reason: `Requested "${perm}" (expected: ${app.expectedPermissions.join(", ")})`,
      })
      totalRisk += rule.points
    }

    if (pLower.includes("accessibility") && !normalizedExpected.some((e) => e.includes("accessibility"))) {
      const rule = RISK_RULES.UNEXPECTED_ACCESSIBILITY
      matches.push({
        ruleId: rule.id,
        name: rule.name,
        points: rule.points,
        reason: `Requested "${perm}" (allows remote control & screen capture)`,
      })
      totalRisk += rule.points
    }

    if (pLower.includes("install") && !normalizedExpected.some((e) => e.includes("install"))) {
      const rule = RISK_RULES.UNEXPECTED_INSTALL_PACKAGES
      matches.push({
        ruleId: rule.id,
        name: rule.name,
        points: rule.points,
        reason: `Requested "${perm}" (can install secondary malicious APKs)`,
      })
      totalRisk += rule.points
    }

    if (pLower.includes("notification") && !normalizedExpected.some((e) => e.includes("notification"))) {
      const rule = RISK_RULES.UNEXPECTED_NOTIFICATION_LISTENER
      matches.push({
        ruleId: rule.id,
        name: rule.name,
        points: rule.points,
        reason: `Requested "${perm}" (can intercept 2FA notification codes)`,
      })
      totalRisk += rule.points
    }
  })

  // 4. Behavioral Anomalies
  if (app.activeBehaviors.bulkSmsRead) {
    const rule = RISK_RULES.BULK_SMS_READ_SPIKE
    matches.push({
      ruleId: rule.id,
      name: rule.name,
      points: rule.points,
      reason: "Bulk SMS read detected: 212 messages in 4 seconds",
    })
    totalRisk += rule.points
  }

  if (app.activeBehaviors.hidesIcon) {
    const rule = RISK_RULES.HIDES_APP_ICON
    matches.push({
      ruleId: rule.id,
      name: rule.name,
      points: rule.points,
      reason: "Disabled launcher activity to avoid user uninstallation",
    })
    totalRisk += rule.points
  }

  if (app.activeBehaviors.contactsNewDomain) {
    const rule = RISK_RULES.CONTACTS_NEW_DOMAIN
    matches.push({
      ruleId: rule.id,
      name: rule.name,
      points: rule.points,
      reason: "Opened secondary C2 socket immediately after permissions granted",
    })
    totalRisk += rule.points
  }

  // Trust = 100 - Risk, clamped between 0 and 100
  const clampedRisk = Math.min(100, Math.max(0, totalRisk))
  const trustScore = 100 - clampedRisk

  // Status mapping
  let status: AppSecurityStatus = "Trusted"
  if (clampedRisk >= 70) {
    status = "Frozen"
  } else if (clampedRisk >= 40) {
    status = app.grantedPermissions.some((p) => p.includes("SMS") || p.includes("Accessibility"))
      ? "Suspicious"
      : "Watching"
  } else if (clampedRisk > 0) {
    status = "Watching"
  }

  return {
    totalRisk: clampedRisk,
    trustScore,
    status,
    appliedRules: matches,
    isContained: clampedRisk >= 70,
  }
}

/**
 * Standard baseline applications declaring their honest profiles
 */
export const BASELINE_APPS: AppProfile[] = [
  {
    id: "app-bhim",
    name: "BHIM UPI",
    packageName: "in.org.npci.upiapp",
    declaredPurpose: "NPCI Unified Payments Interface bank transfers & settlements",
    expectedPermissions: ["UPI Engine", "Network", "SMS"],
    installSource: "Google Play Store",
    impersonatesBrand: false,
    grantedPermissions: ["UPI Engine", "Network", "SMS (Bank Verification Only)"],
    activeBehaviors: {},
  },
  {
    id: "app-weather",
    name: "Mausam Weather",
    packageName: "gov.imd.mausam",
    declaredPurpose: "India Meteorological Department precipitation & forecast alerts",
    expectedPermissions: ["Coarse Location", "Network"],
    installSource: "Google Play Store",
    impersonatesBrand: false,
    grantedPermissions: ["Coarse Location", "Network"],
    activeBehaviors: {},
  },
  {
    id: "app-digilocker",
    name: "DigiLocker Verification",
    packageName: "com.digilocker.android",
    declaredPurpose: "National digital document wallet and Aadhaar e-KYC credentials",
    expectedPermissions: ["Network", "Storage"],
    installSource: "Google Play Store",
    impersonatesBrand: false,
    grantedPermissions: ["Network", "Storage (e-KYC Payload)"],
    activeBehaviors: {},
  },
  {
    id: "app-rto",
    name: "RTO Challan QuickPay",
    packageName: "com.rto.echallan.quickpay",
    declaredPurpose: "View vehicle traffic challans and road tax invoices",
    expectedPermissions: ["Network"],
    installSource: "WhatsApp file",
    impersonatesBrand: true,
    grantedPermissions: ["Network"],
    activeBehaviors: {},
  },
]

