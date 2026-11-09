/**
 * E.D.I.T.H. Virtual Phone SMS Shield Engine
 * 
 * Pure functions, deterministic, 100% in-browser rule-based analysis.
 * Analyzes sender headers, domain suffixes, lookalike patterns, urgency keywords,
 * and executable/APK dropper payloads.
 * 
 * Score: 0 to 100
 *  - >= 60: Red "Likely scam"
 *  - 30 to 59: Amber "Suspicious"
 *  - < 30: Green "Looks safe"
 */

export interface SmsFinding {
  ruleId: string
  title: string
  points: number
  description: string
  severity: "critical" | "warning" | "info" | "safe"
}

export interface SmsPipelineStep {
  step: number
  name: string
  status: "pending" | "running" | "completed"
  findingsCount: number
  summary: string
}

export interface SmsAnalysisResult {
  score: number
  verdict: "Likely scam" | "Suspicious" | "Looks safe"
  verdictColor: "red" | "amber" | "green"
  bilingualWarning: {
    hi: string
    en: string
  }
  findings: SmsFinding[]
  extractedUrls: string[]
  defangedUrls: string[]
  hasApk: boolean
  apkUrl?: string
  senderStatus: "Registered DLT Header" | "Plain Mobile (Brand Claim)" | "Standard Number"
  timestamp: string
}

export interface SampleSms {
  id: string
  label: string
  sender: string
  message: string
  expectedVerdict: "red" | "green" | "amber"
}

export const SAMPLE_SMS_LIST: SampleSms[] = [
  {
    id: "sample-a",
    label: "Sample A: Electricity / RTO Challan APK Scam (Red)",
    sender: "+91 98321 00000",
    message: "Pending e-challan Rs 500. Pay now to avoid legal action: http://parivahan-echallan.top/RTO_Challan.apk install the app",
    expectedVerdict: "red",
  },
  {
    id: "sample-b",
    label: "Sample B: SBI KYC Phishing Link (Red)",
    sender: "+91 90000 11111",
    message: "Dear customer, your SBI account is blocked. Update KYC immediately: http://sbi-kyc-update-fast.in",
    expectedVerdict: "red",
  },
  {
    id: "sample-c",
    label: "Sample C: Legitimate Bank OTP (Green)",
    sender: "AX-DEMOBK",
    message: "Your OTP is 482913. Do not share it with anyone. -DemoBank",
    expectedVerdict: "green",
  },
  {
    id: "sample-d",
    label: "Sample D: Official Parivahan Receipt (Green)",
    sender: "VM-PARIVA",
    message: "Your challan payment of Rs 500 was received. Receipt: https://echallan.parivahan.gov.in",
    expectedVerdict: "green",
  },
  {
    id: "sample-e",
    label: "Sample E: Digital Arrest / CBI Parcel Threat (Red, Content Only)",
    sender: "+91 88888 22222",
    message: "Illegal items were found in a parcel in your name. Join a video call with a CBI officer now or you will be arrested.",
    expectedVerdict: "red",
  },
]

// Allowlist hostnames: ending in .gov.in or .nic.in, or verified demo bank domains
const ALLOWED_DEMO_DOMAINS = [
  "demobank.com",
  "sbi.co.in",
  "hdfcbank.com",
  "icicibank.com",
  "axisbank.com",
  "parivahan.gov.in",
  "echallan.parivahan.gov.in",
  "cybercrime.gov.in",
]

// Known URL shorteners
const URL_SHORTENERS = [
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "is.gd",
  "cutt.ly",
  "shorturl.at",
  "rb.gy",
  "goo.gl",
  "ow.ly",
  "buff.ly",
]

// High-risk TLDs commonly used in smishing campaigns
const SUSPICIOUS_TLDS = [
  ".top",
  ".xyz",
  ".click",
  ".icu",
  ".tk",
  ".ml",
  ".ga",
  ".cf",
  ".gq",
  ".buzz",
  ".cam",
  ".live",
  ".loan",
  ".work",
  ".online",
]

// Institutional brand keywords to detect lookalikes
const BRAND_KEYWORDS = [
  "sbi",
  "hdfc",
  "icici",
  "rto",
  "parivahan",
  "echallan",
  "kyc",
  "aadhaar",
  "upi",
  "challan",
  "tsecl",
  "electricity",
  "bsnl",
  "jio",
  "airtel",
  "bank",
  "parcel",
  "customs",
  "police",
  "cbi",
]

/**
 * Checks whether a hostname is strictly on the sovereign .gov.in / .nic.in allowlist
 * or registered bank allowlist.
 * Ensures that lookalikes such as "gov.in.evil.com" correctly fail.
 */
export function isAllowedHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase()
  // Exact suffix check for sovereign domains
  if (lower === "gov.in" || lower.endsWith(".gov.in")) {
    return true
  }
  if (lower === "nic.in" || lower.endsWith(".nic.in")) {
    return true
  }
  for (const allowed of ALLOWED_DEMO_DOMAINS) {
    if (lower === allowed || lower.endsWith(`.${allowed}`)) {
      return true
    }
  }
  return false
}

/**
 * Defang URL for safe forensic display (hxxp://example[.]in)
 */
export function defangUrl(urlStr: string): string {
  try {
    let defanged = urlStr.replace(/^http:\/\//i, "hxxp://").replace(/^https:\/\//i, "hxxps://")
    // Defang domain dots
    const parts = defanged.split("/")
    if (parts.length > 2) {
      parts[2] = parts[2].replace(/\./g, "[.]")
      defanged = parts.join("/")
    }
    return defanged
  } catch {
    return urlStr.replace(/\./g, "[.]")
  }
}

/**
 * Extract raw URLs from text
 */
export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s"'<>]+)/gi
  const matches = text.match(urlRegex)
  return matches ? Array.from(new Set(matches)) : []
}

/**
 * Step 1: Sender Header & DLT Verification
 */
export function evaluateSender(sender: string, messageBody: string): { findings: SmsFinding[]; status: "Registered DLT Header" | "Plain Mobile (Brand Claim)" | "Standard Number" } {
  const findings: SmsFinding[] = []
  const cleanSender = sender.trim().toUpperCase()
  const lowerBody = messageBody.toLowerCase()

  // Standard Indian 6-character TRAI DLT header, typically preceded by 2-character circle/operator code
  // E.g., AX-DEMOBK, VM-PARIVA, AD-SBIINB, BZ-TSECLP, or standard standalone 6-character header
  const isDltHeader = /^[A-Z]{2}-[A-Z0-9]{5,8}$/.test(cleanSender) || /^[A-Z]{6}$/.test(cleanSender)

  // Plain mobile number pattern (+91 or 10 digits)
  const isPlainMobile = /^(\+?91[\s-]?)?[6-9]\d{9}$/.test(cleanSender.replace(/\s+/g, "")) || /^\d{10}$/.test(cleanSender.replace(/\s+/g, ""))

  const mentionsBrand = BRAND_KEYWORDS.some((kw) => lowerBody.includes(kw))

  if (isDltHeader) {
    findings.push({
      ruleId: "DLT_HEADER_VERIFIED",
      title: "Registered Official Header",
      points: 0,
      description: `Sender "${cleanSender}" matches canonical commercial registry format.`,
      severity: "safe",
    })
    return { findings, status: "Registered DLT Header" }
  }

  if (isPlainMobile && mentionsBrand) {
    findings.push({
      ruleId: "PLAIN_MOBILE_BRAND_IMPERSONATION",
      title: "Unregistered Mobile Impersonating Institutional Brand",
      points: 25,
      description: `Message originates from standard 10-digit mobile (${cleanSender}) yet claims official authority or banking identity. Official institutions are mandated to use registered commercial 6-character headers.`,
      severity: "critical",
    })
    return { findings, status: "Plain Mobile (Brand Claim)" }
  }

  if (isPlainMobile) {
    findings.push({
      ruleId: "PLAIN_MOBILE_NUMBER",
      title: "Personal / Unregistered Mobile Sender",
      points: 5,
      description: `Originates from standard personal mobile number (${cleanSender}).`,
      severity: "info",
    })
    return { findings, status: "Standard Number" }
  }

  return { findings, status: "Standard Number" }
}

/**
 * Step 2: URL & Domain Analysis
 */
export function evaluateLinks(urls: string[]): { findings: SmsFinding[]; hasLookalike: boolean } {
  const findings: SmsFinding[] = []
  let hasLookalike = false

  for (const rawUrl of urls) {
    try {
      const parsed = new URL(rawUrl)
      const hostname = parsed.hostname.toLowerCase()
      const isHttp = parsed.protocol === "http:"
      const isAllowed = isAllowedHostname(hostname)

      if (isAllowed) {
        findings.push({
          ruleId: "ALLOWED_DOMAIN",
          title: "Verified Allowlisted Domain",
          points: 0,
          description: `Host "${hostname}" matches canonical sovereign (.gov.in/.nic.in) or verified registry.`,
          severity: "safe",
        })
        continue
      }

      // Check lookalike brand in hostname
      const foundBrand = BRAND_KEYWORDS.find((brand) => hostname.includes(brand))
      if (foundBrand) {
        hasLookalike = true
        findings.push({
          ruleId: "LOOKALIKE_BRAND_DOMAIN",
          title: `Lookalike Domain (${foundBrand.toUpperCase()})`,
          points: 35,
          description: `Hostname "${hostname}" embeds brand keyword "${foundBrand}" but is NOT on the authorized registry. Lookalike spoofing detected.`,
          severity: "critical",
        })
      }

      // Check URL shorteners
      const isShortener = URL_SHORTENERS.some((s) => hostname === s || hostname.endsWith(`.${s}`))
      if (isShortener) {
        findings.push({
          ruleId: "URL_SHORTENER_DETECTED",
          title: "Obfuscated URL Shortener",
          points: 20,
          description: `Link uses shortener "${hostname}" to mask destination redirect.`,
          severity: "warning",
        })
      }

      // Insecure HTTP check
      if (isHttp) {
        findings.push({
          ruleId: "INSECURE_HTTP_LINK",
          title: "Unencrypted HTTP Protocol",
          points: 10,
          description: `Link connects via plain unencrypted HTTP (${rawUrl}) rather than modern HTTPS.`,
          severity: "warning",
        })
      }

      // Suspicious TLD check
      const hasSuspiciousTld = SUSPICIOUS_TLDS.some((tld) => hostname.endsWith(tld))
      if (hasSuspiciousTld) {
        findings.push({
          ruleId: "SUSPICIOUS_TLD",
          title: "High-Abuse Top-Level Domain (TLD)",
          points: 15,
          description: `Hostname ends with known cheap/abused TLD (${hostname}). Commonly used for ephemeral phishing.`,
          severity: "warning",
        })
      }
    } catch {
      findings.push({
        ruleId: "MALFORMED_URL",
        title: "Malformed URL String",
        points: 10,
        description: `Message contains malformed or unparseable URL string: "${rawUrl}".`,
        severity: "warning",
      })
    }
  }

  return { findings, hasLookalike }
}

/**
 * Step 3: Urgency, Threats & Credential Solicitation
 */
export function evaluateContent(messageBody: string): { findings: SmsFinding[] } {
  const findings: SmsFinding[] = []
  const lower = messageBody.toLowerCase()

  // Protective "do not share" check
  const hasDoNotShare =
    lower.includes("do not share") ||
    lower.includes("kisi se share na") ||
    lower.includes("never share") ||
    lower.includes("don't share") ||
    lower.includes("mat batayein") ||
    lower.includes("kisi ko na dein")

  // Urgency / threat words in English & Hinglish
  const urgencyKeywords = [
    "immediately",
    "blocked",
    "arrest",
    "legal action",
    "abhi",
    "turant",
    "band ho jayega",
    "giraftar",
    "giraftari",
    "disconnected",
    "tonight",
    "urgent",
    "non-bailable",
    "warrant",
    "police",
    "cbi",
    "customs",
    "warna",
    "illegal",
  ]

  const matchedUrgency = urgencyKeywords.filter((kw) => lower.includes(kw))
  if (matchedUrgency.length > 0) {
    findings.push({
      ruleId: "COERCIVE_URGENCY_THREAT",
      title: "Urgency / Legal Coercion Language",
      points: 15,
      description: `Contains high-pressure panic keywords (${matchedUrgency.slice(0, 3).join(", ")}) designed to induce rushed compliance.`,
      severity: "warning",
    })
  }

  // Severe extortion / digital arrest / arrest threat specifically
  const hasSevereArrestThreat =
    lower.includes("giraftari") ||
    lower.includes("giraftar") ||
    lower.includes("warrant") ||
    (lower.includes("cbi") && lower.includes("video call")) ||
    (lower.includes("police") && lower.includes("illegal"))

  if (hasSevereArrestThreat) {
    findings.push({
      ruleId: "DIGITAL_ARREST_EXTORTION",
      title: "Digital Arrest / False Prosecution Threat",
      points: 25,
      description: "Coercive extortion pattern threatening police or CBI arrest via immediate video call or physical custody.",
      severity: "critical",
    })
  }

  // Solicitation of OTP / PIN / Credentials
  const asksForCredentials =
    !hasDoNotShare &&
    (/(share|send|enter|give|provide)\s*(your\s*)?(otp|pin|cvv|password)/i.test(lower) ||
      /(otp|pin)\s*(bhejo|batao|share karo)/i.test(lower) ||
      /(pay\s*(now|rs|₹|fee)|transfer\s*(rs|₹))/i.test(lower))

  if (asksForCredentials) {
    findings.push({
      ruleId: "CREDENTIAL_OR_FEE_SOLICITATION",
      title: "Requests OTP / PIN / Immediate Payment",
      points: 20,
      description: "Directly prompts recipient to enter or provide one-time passwords, payment PIN, or advance fee.",
      severity: "critical",
    })
  }

  // Legitimate OTP safety reminder (Bonus: confirms safe posture)
  if (hasDoNotShare && (lower.includes("otp") || lower.includes("code"))) {
    findings.push({
      ruleId: "SAFE_OTP_REMINDER",
      title: "Protective 'Do Not Share' Advisory",
      points: 0,
      description: "Message explicitly reminds recipient never to share the authentication code.",
      severity: "safe",
    })
  }

  return { findings }
}

/**
 * Step 4: Executable / APK Attachment Scan
 */
export function evaluateAttachments(messageBody: string, extractedUrls: string[]): {
  findings: SmsFinding[]
  hasApk: boolean
  apkUrl?: string
} {
  const findings: SmsFinding[] = []
  const lower = messageBody.toLowerCase()

  // Check URL paths for .apk extension
  let foundApkUrl: string | undefined
  for (const u of extractedUrls) {
    try {
      const p = new URL(u)
      if (p.pathname.toLowerCase().endsWith(".apk") || p.href.toLowerCase().includes(".apk")) {
        foundApkUrl = u
        break
      }
    } catch {
      if (u.toLowerCase().includes(".apk")) {
        foundApkUrl = u
        break
      }
    }
  }

  // Also check message body for .apk filename or dropper phrases
  const hasApkFile = lower.includes(".apk")
  const hasInstallPhrase =
    lower.includes("install the app") ||
    lower.includes("install app") ||
    lower.includes("download app") ||
    lower.includes("download the app") ||
    lower.includes("app install karein") ||
    lower.includes("update app")

  const hasApk = Boolean(foundApkUrl || (hasApkFile && hasInstallPhrase))

  if (hasApk) {
    findings.push({
      ruleId: "MALICIOUS_APK_DROPPER",
      title: "Sideload APK Dropper Payload",
      points: 40,
      description: `Contains direct link or instruction to download executable Android package (${foundApkUrl || "APK payload"}). Out-of-store APK sideloading carries extreme malware and RAT risk.`,
      severity: "critical",
    })
  } else if (hasInstallPhrase) {
    findings.push({
      ruleId: "PROMPTS_APP_INSTALL",
      title: "Prompts Application Installation",
      points: 15,
      description: "Directs user to install software from unverified external channels.",
      severity: "warning",
    })
  }

  return { findings, hasApk, apkUrl: foundApkUrl }
}

/**
 * Master Pipeline: Evaluates a complete incoming SMS deterministically
 */
export function analyzeSms(sender: string, messageBody: string): SmsAnalysisResult {
  const extractedUrls = extractUrls(messageBody)
  const defangedUrls = extractedUrls.map(defangUrl)

  // Run the 4 evaluation modules
  const senderEval = evaluateSender(sender, messageBody)
  const linksEval = evaluateLinks(extractedUrls)
  const contentEval = evaluateContent(messageBody)
  const attachEval = evaluateAttachments(messageBody, extractedUrls)

  // Aggregate findings
  const allFindings: SmsFinding[] = [
    ...senderEval.findings,
    ...linksEval.findings,
    ...contentEval.findings,
    ...attachEval.findings,
  ]

  // Calculate raw points
  const rawScore = allFindings.reduce((acc, f) => acc + f.points, 0)
  const score = Math.max(0, Math.min(100, rawScore))

  // Determine verdict
  let verdict: "Likely scam" | "Suspicious" | "Looks safe"
  let verdictColor: "red" | "amber" | "green"
  let bilingualWarning: { hi: string; en: string }

  if (score >= 60) {
    verdict = "Likely scam"
    verdictColor = "red"
    bilingualWarning = {
      hi: "This looks like a scam. Do not tap the link or install any app.",
      en: "This looks like a scam. Do not tap the link or install any app.",
    }
  } else if (score >= 30) {
    verdict = "Suspicious"
    verdictColor = "amber"
    bilingualWarning = {
      hi: "This message looks suspicious. Verify the sender and link before proceeding.",
      en: "This message looks suspicious. Verify the sender and link before proceeding.",
    }
  } else {
    verdict = "Looks safe"
    verdictColor = "green"
    bilingualWarning = {
      hi: "This message appears safe. Please do not share your OTP with anyone.",
      en: "This message appears safe. Please do not share your OTP with anyone.",
    }
  }

  // Format 24h timestamp
  const now = new Date()
  const timestamp = now.toLocaleTimeString("en-GB", {
    timeZone: "Asia/Kolkata",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  return {
    score,
    verdict,
    verdictColor,
    bilingualWarning,
    findings: allFindings,
    extractedUrls,
    defangedUrls,
    hasApk: attachEval.hasApk,
    apkUrl: attachEval.apkUrl,
    senderStatus: senderEval.status,
    timestamp: `${timestamp} IST`,
  }
}

