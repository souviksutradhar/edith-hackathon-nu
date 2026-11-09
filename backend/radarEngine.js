const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// Statutory Legal Violation Mapping for Indian Cyber Crime (BNS 2023 & IT Act 2000)
const LEGAL_VIOLATIONS = [
  {
    section: "BNS Section 318(4)",
    act: "Bharatiya Nyaya Sanhita, 2023",
    offense: "Cheating and dishonestly inducing delivery of property",
    penalty: "Imprisonment up to 7 years and fine"
  },
  {
    section: "BNS Section 319",
    act: "Bharatiya Nyaya Sanhita, 2023",
    offense: "Cheating by personation (Impersonating Government Parivahan / Police Challan Authority)",
    penalty: "Imprisonment up to 5 years and fine"
  },
  {
    section: "IT Act 2000 Section 66D",
    act: "Information Technology Act, 2000",
    offense: "Cheating by personation by using computer resource or mobile device",
    penalty: "Imprisonment up to 3 years and fine up to ₹1,00,000"
  },
  {
    section: "IT Act 2000 Section 43/66",
    act: "Information Technology Act, 2000",
    offense: "Unauthorized data extraction, OTP scraping, spyware payload download & hacking",
    penalty: "Imprisonment up to 3 years and compensation up to ₹5,00,000"
  }
];

// Additive Risk Weights
const RISK_WEIGHTS = {
  SIDELOADED_CHAT_BROWSER: 25,
  BRAND_IMPERSONATION: 15,
  INTENT_MISMATCH_SMS: 25,
  INTENT_MISMATCH_ACCESSIBILITY: 35,
  INTENT_MISMATCH_NOTIFICATION: 20,
  HIDDEN_SECOND_STAGE_PAYLOAD: 30,
  FIRST_BULK_SMS_OTP_READ: 40,
  CONCEALING_APP_ICON: 20
};

// Base Applications for Project E.D.I.T.H.
function getBaseApps() {
  return [
    {
      id: 1,
      name: "BHIM UPI",
      packageName: "in.org.npci.upiapp",
      declaredPurpose: "Payments & Financial UPI",
      expectedPermissions: ["Contacts", "SMS", "Location"],
      grantedPermissions: ["Contacts", "SMS", "Location"],
      installSource: "Play Store",
      trustScore: 96,
      status: "Active", // "Active" | "Warning" | "Frozen"
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
      installSource: "WhatsApp Sideload",
      trustScore: 88,
      status: "Active",
      requestsPerHour: 12,
      spike: false,
      killChainStage: 0,
      activeRiskSignals: []
    }
  ];
}

// 5 Kill-Chain Stages Definitions
const KILL_CHAIN_STAGES = [
  {
    stage: 1,
    id: "LURE_RECEIVED",
    label: "Lure Detected",
    description: "WhatsApp phishing link received: 'bit.ly/parivahan-challan-pay.apk' alleging unpaid motor challan.",
    trustScore: 85,
    status: "Active",
    addedPermissions: [],
    signals: ["BRAND_IMPERSONATION"],
    severity: "low"
  },
  {
    stage: 2,
    id: "SIDELOADED_INSTALL",
    label: "Sideloaded Install",
    description: "APK installed outside Google Play via WhatsApp package installer without OEM signatures.",
    trustScore: 75,
    status: "Active",
    addedPermissions: ["Storage"],
    signals: ["BRAND_IMPERSONATION", "SIDELOADED_CHAT_BROWSER"],
    severity: "medium"
  },
  {
    stage: 3,
    id: "INTENT_MISMATCH",
    label: "Intent Mismatch",
    description: "Declared as Utility/Challan but requests SMS read and BIND_ACCESSIBILITY_SERVICE.",
    trustScore: 50,
    status: "Warning",
    addedPermissions: ["Storage", "Read SMS", "Accessibility Service"],
    signals: ["BRAND_IMPERSONATION", "SIDELOADED_CHAT_BROWSER", "INTENT_MISMATCH_SMS", "INTENT_MISMATCH_ACCESSIBILITY"],
    severity: "high"
  },
  {
    stage: 4,
    id: "SECOND_STAGE_PAYLOAD",
    label: "2nd Stage Dropper",
    description: "Downloads secondary encrypted DEX payload from unverified C2 IP (185.220.101.5) and hides launcher icon.",
    trustScore: 30,
    status: "Warning",
    addedPermissions: ["Storage", "Read SMS", "Accessibility Service", "Background Service"],
    signals: ["BRAND_IMPERSONATION", "SIDELOADED_CHAT_BROWSER", "INTENT_MISMATCH_SMS", "INTENT_MISMATCH_ACCESSIBILITY", "HIDDEN_SECOND_STAGE_PAYLOAD", "CONCEALING_APP_ICON"],
    severity: "critical"
  },
  {
    stage: 5,
    id: "ATTEMPTED_HARVEST",
    label: "Harvest Attempt (Frozen)",
    description: "Attempted automated scraping of 6-digit Bank OTPs during active session. AUTO-FREEZE KILL-SWITCH ACTIVATED.",
    trustScore: 10,
    status: "Frozen",
    addedPermissions: [], // all sensitive permissions revoked by kill-switch
    signals: ["BRAND_IMPERSONATION", "SIDELOADED_CHAT_BROWSER", "INTENT_MISMATCH_SMS", "INTENT_MISMATCH_ACCESSIBILITY", "HIDDEN_SECOND_STAGE_PAYLOAD", "CONCEALING_APP_ICON", "FIRST_BULK_SMS_OTP_READ"],
    severity: "neutralized"
  }
];

// Fallback plain Hindi/Hinglish warning
const DEFAULT_HINGLISH_WARNING = "चेतावनी: 'RTO Challan QuickPay' ऐप आपके बैंक OTP और गोपनीय मैसेज पढ़ने की कोशिश कर रहा था। E.D.I.T.H. ने इस फ़ेक ऐप को तुरंत फ़्रीज़ (ब्लॉक) कर दिया है।";

// Call Gemini 1.5 to generate contextual Hindi/Hinglish warning
async function generateHinglishWarning(appName, stageData) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      const prompt = `
You are E.D.I.T.H., an Indian Cybersecurity Defense Agent.
Generate a very concise (under 25 words), urgent warning in natural conversational Hindi/Hinglish.
Context:
App: "${appName}"
Attack Vector: Fake RTO Challan APK attempting to steal Banking OTPs and messages via Accessibility hook.
Action Taken: E.D.I.T.H. has frozen the app and generated a cyber police complaint dossier.
Provide ONLY the Hindi/Hinglish warning text.
Example: "चेतावनी: 'RTO Challan' ऐप आपके बैंक OTP और मैसेज पढ़ने की कोशिश कर रहा है। E.D.I.T.H. ने इसे तुरंत फ्रीज कर दिया है।"
`;

      const result = await model.generateContent(prompt);
      const text = result.response.text()?.trim();
      if (text && text.length > 10) {
        return text;
      }
    } catch (err) {
      console.error("[radarEngine] Gemini Hinglish warning failed, using default:", err.message);
    }
  }

  return DEFAULT_HINGLISH_WARNING;
}

// Generate pre-filled National Cyber Crime Reporting Portal (1930) Complaint Dossier
function generateComplaintDossier(targetApp, stageInfo) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  return {
    dossierId: `NCR-1930-EDITH-${Math.floor(100000 + Math.random() * 900000)}`,
    generatedAt: `${dateStr}, ${timeStr}`,
    reportingPortal: "National Cyber Crime Reporting Portal (https://cybercrime.gov.in)",
    helpline: "National Cyber Helpline: Dial 1930 (Immediate Financial Fraud Freeze)",
    targetApp: {
      name: targetApp.name,
      packageName: targetApp.packageName,
      sha256: "9f83a48e89f81f13b631d871ef3b586940a0fe5c862d2948bb319c5c93540b76",
      installSource: targetApp.installSource,
      declaredPurpose: targetApp.declaredPurpose,
      actualAbusePattern: "High-risk abuse of BIND_ACCESSIBILITY_SERVICE & READ_SMS for credential scraping"
    },
    victimEndpoint: {
      device: "Pixel 7A (Android 14)",
      osBuild: "UP1A.231005.007",
      agentStatus: "E.D.I.T.H. Zero-Trust Radar Active"
    },
    exfiltratedTargetData: [
      "Bank SMS Inbox (OTP Interception)",
      "Aadhaar / Driving License KYC credentials",
      "UPI PIN and viewport accessibility stream"
    ],
    killSwitchMitigationsApplied: [
      "[KILL_SWITCH] BIND_ACCESSIBILITY_SERVICE quarantined and binding detached",
      "[KILL_SWITCH] Android Runtime revoked READ_SMS and RECEIVE_SMS permissions",
      "[KILL_SWITCH] Outbound socket connection to C2 IP 185.220.101.5 severed",
      "[KILL_SWITCH] Application process placed into frozen state (SIGSTOP)"
    ],
    applicableLaws: LEGAL_VIOLATIONS,
    victimGuidance: "1. Do NOT open WhatsApp links from unknown numbers. 2. Verify all motor challans only on https://echallan.parivahan.gov.in. 3. If any money was deducted, immediately dial 1930 within the Golden Hour."
  };
}

module.exports = {
  getBaseApps,
  KILL_CHAIN_STAGES,
  RISK_WEIGHTS,
  LEGAL_VIOLATIONS,
  DEFAULT_HINGLISH_WARNING,
  generateHinglishWarning,
  generateComplaintDossier
};

