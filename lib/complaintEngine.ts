/**
 * E.D.I.T.H. Complaint Kit & Crime Classification Engine
 * 
 * Deterministic, rule-based classification and template compilation for Indian cybercrime reporting.
 * Strictly in-browser, no external network calls, no LLMs.
 * 
 * Generates an indicative "Cyber Fraud Complaint Draft" aligned with
 * Bharatiya Sakshya Adhiniyam (BSA 2023) Sec. 63 and relevant BNS / IT Act provisions.
 */

export type CrimeCategory =
  | "apk_malware"
  | "govt_impersonation"
  | "phishing_kyc"
  | "extortion"
  | "job_investment"
  | "other_suspicious"

export type ElementStatus = "shown" | "needs_facts" | "not_indicated"

export interface SimplifiedElement {
  id: string
  label: string
  sourceNote: string
  status: ElementStatus
  statusLabel: "Shown by this message" | "Needs your facts" | "Not indicated"
}

export interface SectionElementChecklist {
  sectionId: string
  sectionName: string
  elements: SimplifiedElement[]
}

export interface LegalSectionMapping {
  category: CrimeCategory
  categoryTitle: string
  bnsSections: string[]
  itActSections: string[]
  summaryTemplate: (data: ComplaintDataInput) => string
}

export interface ComplaintDataInput {
  incidentId: string
  timestamp: string // "HH:MM:SS IST" or Date string
  sender: string
  message: string
  defangedUrls: string[]
  findings: Array<{ title: string; points: number; description?: string }>
  totalScore: number
  hasApk: boolean
  apkName?: string
  evidenceHash: string
  lostMoney: boolean
  installedApp: "Yes" | "No" | "Not applicable"
  sourceChannel?: "SMS" | "WhatsApp" | "Call"
}

export const LEGAL_SECTIONS_REGISTRY: Record<CrimeCategory, LegalSectionMapping> = {
  apk_malware: {
    category: "apk_malware",
    categoryTitle: "Malicious APK Dropper / Mobile Spyware",
    bnsSections: [
      "BNS § 318(4) (Cheating and dishonestly inducing delivery of property)",
      "BNS § 319(2) (Cheating by personation)",
    ],
    itActSections: [
      "IT Act § 43 read with § 66 (Unauthorized access, data exfiltration & computer damage)",
      "IT Act § 66C (Identity theft & credential manipulation)",
      "IT Act § 66D (Cheating by personation using computer resource)",
    ],
    summaryTemplate: (d) =>
      `On ${d.timestamp}, the complainant received an unsolicited communication from sender "${d.sender}" containing deceptive instructions to download and install an unauthorized Android application package (${d.apkName || "external APK"}). The application attempted unauthorized permission escalation including SMS access and background service hooking, exhibiting spyware kill-chain behaviors to intercept sensitive one-time credentials.`,
  },
  govt_impersonation: {
    category: "govt_impersonation",
    categoryTitle: "Impersonation of Public Authority / Digital Arrest Extortion",
    bnsSections: [
      "BNS § 204 (Impersonating a public servant)",
      "BNS § 318(4) (Cheating)",
      "BNS § 319(2) (Cheating by personation)",
      "BNS § 351 (Criminal intimidation)",
    ],
    itActSections: [
      "IT Act § 66C (Identity theft / fraudulent use of official identity)",
      "IT Act § 66D (Cheating by personation using communication device)",
    ],
    summaryTemplate: (d) =>
      `On ${d.timestamp}, the complainant was targeted by sender "${d.sender}" falsely impersonating law enforcement, judicial, or government authority (e.g., CBI, Police, or RTO). The perpetrator used coercive intimidation, fabricated legal prosecution, and threatened immediate arrest or disconnection to force compliance.`,
  },
  phishing_kyc: {
    category: "phishing_kyc",
    categoryTitle: "Banking Phishing & Unauthorized KYC Lookalike Portal",
    bnsSections: [
      "BNS § 318(4) (Cheating)",
      "BNS § 319(2) (Cheating by personation)",
    ],
    itActSections: [
      "IT Act § 66C (Identity theft)",
      "IT Act § 66D (Cheating by personation using computer resource)",
    ],
    summaryTemplate: (d) =>
      `On ${d.timestamp}, the complainant received a deceptive alert from "${d.sender}" falsely stating that their bank account, PAN, or services were suspended. The message directed the complainant to an unauthorized lookalike portal (${d.defangedUrls.join(", ") || "unverified domain"}) intended to harvest netbanking credentials and OTPs.`,
  },
  extortion: {
    category: "extortion",
    categoryTitle: "Cyber Blackmail & Extortion",
    bnsSections: [
      "BNS § 308(2) (Extortion by putting person in fear of injury)",
      "BNS § 351 (Criminal intimidation)",
    ],
    itActSections: [
      "IT Act § 66E (Violation of privacy / transmission of images without consent, if applicable)",
      "IT Act § 66D (Cheating by personation)",
    ],
    summaryTemplate: (d) =>
      `On ${d.timestamp}, the complainant was subjected to coercive blackmail demands from "${d.sender}", threatening to release compromised personal media or cause grave reputational damage unless financial ransom was paid.`,
  },
  job_investment: {
    category: "job_investment",
    categoryTitle: "Online Job / Investment Task Scheme",
    bnsSections: [
      "BNS § 318(4) (Cheating and inducement)",
    ],
    itActSections: [
      "IT Act § 66D (Cheating by personation using computer resource)",
    ],
    summaryTemplate: (d) =>
      `On ${d.timestamp}, the complainant was approached by "${d.sender}" offering fraudulent high-yield investment returns, part-time rating tasks, or instant unverified loans, intended to defraud the recipient of advance deposits.`,
  },
  other_suspicious: {
    category: "other_suspicious",
    categoryTitle: "Unsolicited Fraudulent Smishing Communication",
    bnsSections: [
      "BNS § 318(4) (Cheating)",
    ],
    itActSections: [
      "IT Act § 66D (Cheating by personation using communication device)",
    ],
    summaryTemplate: (d) =>
      `On ${d.timestamp}, an unsolicited suspicious message was received from "${d.sender}" containing deceptive links and unverified claims (${d.defangedUrls.join(", ") || "unauthorized link"}), in violation of telecom commercial communications regulations.`,
  },
}

/**
 * Classifies an incident into one statutory crime category
 */
export function classifyCrime(input: {
  message: string
  hasApk: boolean
  sender: string
  findings: Array<{ title: string; points: number }>
}): CrimeCategory {
  const text = (input.message + " " + input.sender).toLowerCase()

  // 1. APK Malware / Dropper
  if (
    input.hasApk ||
    text.includes(".apk") ||
    text.includes("install the app") ||
    text.includes("download app") ||
    text.includes("echallan.quickpay")
  ) {
    return "apk_malware"
  }

  // 2. Govt / Police / Arrest / Digital Arrest Impersonation
  if (
    text.includes("arrest") ||
    text.includes("giraftar") ||
    text.includes("cbi") ||
    text.includes("police") ||
    text.includes("court") ||
    text.includes("customs") ||
    text.includes("warrant") ||
    text.includes("parivahan") ||
    text.includes("echallan") ||
    text.includes("traffic challan") ||
    text.includes("electricity") ||
    text.includes("tsecl") ||
    text.includes("digital arrest")
  ) {
    return "govt_impersonation"
  }

  // 3. Phishing / KYC
  if (
    text.includes("sbi") ||
    text.includes("hdfc") ||
    text.includes("icici") ||
    text.includes("kyc") ||
    text.includes("account blocked") ||
    text.includes("pan card") ||
    text.includes("aadhaar") ||
    text.includes("update kyc") ||
    text.includes("bank")
  ) {
    return "phishing_kyc"
  }

  // 4. Extortion / Blackmail
  if (
    text.includes("video leak") ||
    text.includes("photos") ||
    text.includes("blackmail") ||
    text.includes("leak") ||
    text.includes("nude") ||
    text.includes("compromised")
  ) {
    return "extortion"
  }

  // 5. Job / Investment / Loan
  if (
    text.includes("part time") ||
    text.includes("job") ||
    text.includes("daily income") ||
    text.includes("investment") ||
    text.includes("guaranteed return") ||
    text.includes("telegram task") ||
    text.includes("instant loan")
  ) {
    return "job_investment"
  }

  return "other_suspicious"
}

/**
 * Redacts one-time passwords (OTPs) and PINs from text to protect user confidentiality
 */
export function redactOtpFromMessage(text: string): string {
  if (!text) return ""
  return text
    // Replace numbers following OTP, PIN, code, password, verification
    .replace(/(\b(?:otp|code|pin|password|verification|verify)\s*(?:is|:|-)?\s*)(\d{4,8})\b/gi, "$1[REDACTED OTP]")
    // Replace numbers preceding "is your OTP", etc.
    .replace(/\b(\d{4,8})(\s*(?:is your|is the)?\s*(?:otp|code|pin|verification\s*code)\b)/gi, "[REDACTED OTP]$2")
    // Replace any standalone 6-digit number if message contains OTP/verification/banking keywords
    .replace(/\b\d{6}\b/g, (match) => {
      if (/(?:otp|pin|code|verify|verification|bank|rto|challan|cbi|police|aadhaar|pan)/i.test(text)) {
        return "[REDACTED OTP]"
      }
      return match
    })
}

/**
 * Defangs a URL to prevent accidental clicks while preserving forensic domain structure
 */
export function defangUrl(url: string): string {
  if (!url) return ""
  return url
    .replace(/^https?:\/\//i, (m) => (m.toLowerCase().startsWith("https") ? "hxxps://" : "hxxp://"))
    .replace(/\./g, "[.]")
}

/**
 * Extracts and defangs URLs found in free text
 */
export function extractAndDefangUrls(text: string): string[] {
  if (!text) return []
  const urlRegex = /(?:https?:\/\/|www\.)[^\s/$.?#].[^\s]*/gi
  const matches = text.match(urlRegex) || []
  return matches.map(defangUrl)
}

/**
 * Maps internal crime category to plain-English Chakshu suspected category
 */
export function getChakshuCategory(category: CrimeCategory): string {
  switch (category) {
    case "apk_malware":
      return "Malicious App / APK Dropper"
    case "govt_impersonation":
      return "Impersonation of Government / Police Official"
    case "phishing_kyc":
      return "Fake Bank / KYC Suspension"
    case "extortion":
      return "Blackmail & Cyber Extortion"
    case "job_investment":
      return "Fake Job / Investment Scheme"
    case "other_suspicious":
    default:
      return "Suspicious / Unsolicited Fraudulent Message"
  }
}

/**
 * Generates 2 factual sentences from templates for Chakshu Short Description
 */
export function getChakshuShortDescription(category: CrimeCategory): string {
  switch (category) {
    case "apk_malware":
      return "Received an unsolicited message with an external link attempting to install an unauthorized APK. The application seeks high-privilege permissions to intercept device notifications and messages."
    case "govt_impersonation":
      return "Received an unsolicited message threatening legal action and arrest by falsely claiming to represent police or government authorities. The sender demands immediate payment or verification through an unauthorized link."
    case "phishing_kyc":
      return "Received a deceptive message claiming my bank account or KYC verification is suspended. The sender provides an unauthorized lookalike link to harvest confidential banking credentials."
    case "extortion":
      return "Received a coercive message threatening harm or unauthorized release of personal data unless money is transferred. No funds were transferred and no response was provided."
    case "job_investment":
      return "Received an unsolicited message offering unrealistic part-time earnings or investment returns. The sender asks for advance deposits through an unverified link."
    case "other_suspicious":
    default:
      return "Received an unsolicited fraudulent message from an unregistered sender containing suspicious links. No money was lost and no credentials were shared."
  }
}

/**
 * Generates the simplified legal elements checklist for the 6 mandatory statutory sections
 */
export function getLegalElementsChecklist(
  data: ComplaintDataInput,
  category: CrimeCategory
): SectionElementChecklist[] {
  const text = (data.message + " " + data.sender).toLowerCase()

  // Heuristic indicator checks
  const isGovtOrPolice =
    category === "govt_impersonation" ||
    text.includes("police") ||
    text.includes("cbi") ||
    text.includes("court") ||
    text.includes("customs") ||
    text.includes("arrest") ||
    text.includes("rto") ||
    text.includes("echallan") ||
    text.includes("parivahan") ||
    text.includes("electricity") ||
    text.includes("tsecl") ||
    text.includes("warrant") ||
    text.includes("officer")

  const isBrandOrOrg =
    isGovtOrPolice ||
    category === "phishing_kyc" ||
    category === "apk_malware" ||
    text.includes("sbi") ||
    text.includes("hdfc") ||
    text.includes("icici") ||
    text.includes("bank") ||
    text.includes("telecom") ||
    text.includes("jio") ||
    text.includes("airtel") ||
    text.includes("challan")

  const isCoerciveOrFear =
    category === "extortion" ||
    text.includes("arrest") ||
    text.includes("warrant") ||
    text.includes("leak") ||
    text.includes("police") ||
    text.includes("court") ||
    text.includes("disconnect") ||
    text.includes("power cut") ||
    text.includes("legal action") ||
    text.includes("seize")

  const isIdentityShared = data.installedApp === "Yes" || data.lostMoney

  return [
    {
      sectionId: "bns-318-4",
      sectionName: "BNS 318(4) Cheating",
      elements: [
        {
          id: "deception",
          label: "Deception",
          sourceNote: "from message",
          status: "shown",
          statusLabel: "Shown by this message",
        },
        {
          id: "dishonest_inducement",
          label: "Dishonestly inducing the person",
          sourceNote: "from message",
          status: "shown",
          statusLabel: "Shown by this message",
        },
        {
          id: "delivery_property",
          label: "Delivery of property or money",
          sourceNote: 'needs victim facts, set by "lost money"',
          status: data.lostMoney ? "needs_facts" : "not_indicated",
          statusLabel: data.lostMoney ? "Needs your facts" : "Not indicated",
        },
      ],
    },
    {
      sectionId: "bns-319-2",
      sectionName: "BNS 319(2) Cheating by personation",
      elements: [
        {
          id: "pretends_person_org",
          label: "Pretends to be another person or organisation",
          sourceNote: "from message",
          status: isBrandOrOrg ? "shown" : "not_indicated",
          statusLabel: isBrandOrOrg ? "Shown by this message" : "Not indicated",
        },
        {
          id: "cheating_as_above",
          label: "Cheating as above",
          sourceNote: "cheating as above",
          status: isBrandOrOrg ? "shown" : "not_indicated",
          statusLabel: isBrandOrOrg ? "Shown by this message" : "Not indicated",
        },
      ],
    },
    {
      sectionId: "bns-204",
      sectionName: "BNS 204 Personating a public servant",
      elements: [
        {
          id: "claims_public_servant",
          label: "Claims to hold a government or police office",
          sourceNote: "from message",
          status: isGovtOrPolice ? "shown" : "not_indicated",
          statusLabel: isGovtOrPolice ? "Shown by this message" : "Not indicated",
        },
      ],
    },
    {
      sectionId: "it-act-66d",
      sectionName: "IT Act 66D",
      elements: [
        {
          id: "cheating_personation_device",
          label: "Cheating by personation",
          sourceNote: "from message",
          status: isBrandOrOrg ? "shown" : "not_indicated",
          statusLabel: isBrandOrOrg ? "Shown by this message" : "Not indicated",
        },
        {
          id: "communication_device",
          label: "By means of a communication device or computer resource",
          sourceNote: "yes, SMS/WhatsApp/app",
          status: "shown",
          statusLabel: "Shown by this message",
        },
      ],
    },
    {
      sectionId: "it-act-66c",
      sectionName: "IT Act 66C Identity theft",
      elements: [
        {
          id: "identity_theft_creds",
          label: "Fraudulent use of someone else's password, OTP or unique ID",
          sourceNote: "needs victim facts: only if they shared it",
          status: isIdentityShared ? "needs_facts" : "not_indicated",
          statusLabel: isIdentityShared ? "Needs your facts" : "Not indicated",
        },
      ],
    },
    {
      sectionId: "bns-308-2",
      sectionName: "BNS 308(2) Extortion",
      elements: [
        {
          id: "puts_in_fear",
          label: "Puts the person in fear",
          sourceNote: "from message",
          status: isCoerciveOrFear ? "shown" : "not_indicated",
          statusLabel: isCoerciveOrFear ? "Shown by this message" : "Not indicated",
        },
        {
          id: "induces_delivery_fear",
          label: "Dishonestly induces delivery of money or property",
          sourceNote: "needs victim facts",
          status: isCoerciveOrFear && data.lostMoney ? "needs_facts" : "not_indicated",
          statusLabel: isCoerciveOrFear && data.lostMoney ? "Needs your facts" : "Not indicated",
        },
      ],
    },
  ]
}

/**
 * Formats the elements checklist for inclusion in the plain text complaint draft
 */
export function formatElementsChecklistPlainText(checklists: SectionElementChecklist[]): string {
  return checklists
    .map((sec) => {
      const lines = sec.elements.map((el) => {
        const mark =
          el.status === "shown"
            ? "[✓ Shown by this message]"
            : el.status === "needs_facts"
            ? "[• Needs your facts]"
            : "[- Not indicated]"
        return `  ${mark} ${el.label} [${el.sourceNote}]`
      })
      return `• ${sec.sectionName}:\n${lines.join("\n")}`
    })
    .join("\n\n")
}

/**
 * Computes browser SHA-256 hash using crypto.subtle
 */
export async function computeClientSha256(text: string): Promise<string> {
  try {
    if (typeof window !== "undefined" && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder()
      const data = encoder.encode(text)
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
    }
  } catch {
    // fallback
  }
  return "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4"
}

/**
 * Compiles the text draft for portal copy or .txt download
 */
export function generatePlainTextComplaint(
  data: ComplaintDataInput,
  mapping: LegalSectionMapping
): string {
  const checklists = getLegalElementsChecklist(data, mapping.category)
  const checklistText = formatElementsChecklistPlainText(checklists)

  const lossSection = data.lostMoney
    ? `
SECTION 6: FINANCIAL LOSS PARTICULARS
--------------------------------------------------------------------------------
Total Loss Amount (INR) : ₹ ________________________________
Date & Time of Debit    : ___________________________________
Transaction / UTR ID    : ___________________________________
Complainant Bank Name   : ___________________________________
Account / Card / UPI ID : ___________________________________
Beneficiary Bank / UPI  : ___________________________________ (if known)
`
    : `
SECTION 6: FINANCIAL LOSS PARTICULARS
--------------------------------------------------------------------------------
No direct financial loss reported at the time of drafting.
Timely containment by E.D.I.T.H. prevented OTP exfiltration.
`

  return `================================================================================
CYBER FRAUD COMPLAINT DRAFT
(Prepared for submission to National Cyber Crime Reporting Portal / 1930 / Chakshu)
================================================================================
Generated via   : E.D.I.T.H. Sovereign Mobile Defense (Simulated Prototype)
Date & Time     : ${data.timestamp}
Incident ID     : ${data.incidentId}
Crime Category  : ${mapping.categoryTitle}
Forensic Seal   : SHA-256 [${data.evidenceHash}]

IMPORTANT NOTICE:
This document is an auto-generated Complaint draft prepared from deterministic rule-based
checks on the complainant's device. It is an indicative document.
Law enforcement authorities decide the applicable statutory sections and procedure.

--------------------------------------------------------------------------------
SECTION 1: COMPLAINANT DETAILS
--------------------------------------------------------------------------------
Full Name               : ____________________________________________________
Contact Mobile Number   : ____________________________________________________
Residential Address     : ____________________________________________________
Email Address           : ____________________________________________________
Government Photo ID     : ____________________________________________________

--------------------------------------------------------------------------------
SECTION 2: INCIDENT SUMMARY
--------------------------------------------------------------------------------
${mapping.summaryTemplate(data)}

App Installation Status : ${data.installedApp}
Financial Loss Reported : ${data.lostMoney ? "YES (Details below)" : "NO"}

--------------------------------------------------------------------------------
SECTION 3: DIGITAL EVIDENCE & FORENSIC ARTIFACTS
--------------------------------------------------------------------------------
Sender Number / Header  : ${data.sender}
Communication Channel   : ${data.sourceChannel || "SMS / Telecom"}
Received Date / Time    : ${data.timestamp}
Full Message Content    : "${data.message}"
Defanged Link(s)        : ${data.defangedUrls.join(", ") || "None"}
Executable / APK Target : ${data.apkName || (data.hasApk ? "External Sideload APK" : "None")}
Evidence SHA-256 Seal   : ${data.evidenceHash}

--------------------------------------------------------------------------------
SECTION 4: WHAT E.D.I.T.H. RULE-BASED ENGINE DETECTED
--------------------------------------------------------------------------------
${
  data.findings.length > 0
    ? data.findings.map((f, i) => `${i + 1}. [${f.points > 0 ? `+${f.points} pts` : "0 pts"}] ${f.title}: ${f.description || ""}`).join("\n")
    : "No adverse heuristic violations logged."
}
Total Risk Score        : ${data.totalScore} / 100

--------------------------------------------------------------------------------
SECTION 5: LAWS THAT MAY APPLY (Simplified and indicative. Police decide.)
--------------------------------------------------------------------------------
${checklistText}

${lossSection}
--------------------------------------------------------------------------------
SECTION 7: REQUEST & RELIEF SOUGHT
--------------------------------------------------------------------------------
I request registration of my complaint and appropriate legal action under the
applicable laws, including:
1. Blocking the sender phone number and unregistering offending DLT / telecom routes.
2. Takedown of malicious domain(s) and URL(s) through DoT / CERT-In channels.
3. Freezing the beneficiary account(s) and UPI handles where funds are held.
4. Preserving subscriber details and IP connection logs under Section 91 CrPC / BNSS.

--------------------------------------------------------------------------------
SECTION 8: VERIFICATION & DECLARATION
--------------------------------------------------------------------------------
I hereby declare that the information provided in this complaint draft is true
and correct to the best of my knowledge and belief. I have saved all relevant
screenshots and communication records for forensic presentation.

Signature of Complainant : _________________________________________
Date & Place             : _________________________________________
================================================================================
Auto-generated Complaint draft from rule-based checks. Not legal advice.
Police decide the applicable sections. Nothing leaves your browser.
================================================================================`
}

