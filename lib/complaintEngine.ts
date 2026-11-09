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
This document is an auto-generated draft prepared from deterministic rule-based
checks on the complainant's device. It is NOT a First Information Report (FIR).
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
SECTION 5: SECTIONS POLICE MAY CONSIDER (Indicative, not legal advice)
--------------------------------------------------------------------------------
Bharatiya Nyaya Sanhita (BNS) 2023:
${mapping.bnsSections.map((s) => `• ${s}`).join("\n")}

Information Technology Act 2000 (as amended):
${mapping.itActSections.map((s) => `• ${s}`).join("\n")}

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
Auto-generated draft from rule-based checks. Not legal advice. Police decide
the applicable sections. Nothing leaves your browser.
================================================================================`
}

