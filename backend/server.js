const express = require('express');
const cors = require('cors');
const {
  verifyIndianSenderHeader,
  resolveDomainIntegrity,
  analyzeAttackVectors,
  evaluateCommunicationThreat,
  analyzeAppThreat,
  analyzeRATThreat,
  analyzeCallerThreat
} = require('./threatDetector');
const {
  getBaseApps,
  KILL_CHAIN_STAGES,
  LEGAL_VIOLATIONS,
  DEFAULT_HINGLISH_WARNING,
  generateHinglishWarning,
  generateComplaintDossier
} = require('./radarEngine');

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

process.on('uncaughtException', (err) => {
  console.error('[SERVER ERROR] Uncaught exception:', err.message);
});
process.on('unhandledRejection', (reason) => {
  console.error('[SERVER ERROR] Unhandled rejection:', reason);
});

function formatCurrentTime() {
  return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

// In-Memory Database of Monitored Applications (Using Radar Engine base apps)
let apps = getBaseApps();
let currentRadarStage = 0;
let currentDossier = null;
let currentHinglishWarning = DEFAULT_HINGLISH_WARNING;

// Chronological Stream of Access Logs & AI Threat Assessments
let logs = [
  {
    id: "log-1",
    time: "10:41 AM",
    app: "BHIM UPI",
    resource: "Bank Logs",
    result: "Allowed",
    details: "Routine NPCI UPI payment settlement check"
  },
  {
    id: "log-2",
    time: "10:42 AM",
    app: "Mausam Weather",
    resource: "Location",
    result: "Allowed",
    details: "Coarse geo-lookup for precipitation forecast"
  },
  {
    id: "log-3",
    time: "10:43 AM",
    app: "RTO Challan QuickPay",
    resource: "Internet",
    result: "Allowed",
    details: "Package install manifest registered"
  }
];

// Device Telemetry State (Zero-Trust Endpoint Defense)
const DEFAULT_TELEMETRY = {
  device: "Pixel 7A (Android 14)",
  trust_score: 95,
  status: "SECURE",
  telephony_state: "IDLE (No active calls)",
  remote_access_service: "NONE (No active mirroring)",
  sideloaded_app: "NONE (Play Protect Verified)",
  accessibility_status: "DEFAULT_SYSTEM_SERVICES_ONLY",
  foreground_app: "com.android.launcher (Home Screen)",
  mitigation_status: "STANDBY",
  last_incident: null
};

let deviceTelemetry = { ...DEFAULT_TELEMETRY };
let incidentHistory = [];

// Mock Sanchar Saathi / Chakshu & National Telecom Fraud Repository
const CHAKSHU_DATABASE = {
  "+919832100000": {
    phoneNumber: "+91 98321 00000",
    identifiedEntity: "Suspected Electricity Bill Scammer (Fake CESC/TSECL)",
    telecomCircle: "West Bengal / Kolkata (VoIP Gateway)",
    chakshuReportsCount: 87,
    spamCategory: "KYC & Utility Impersonation",
    riskScore: 92,
    threatLevel: "CRITICAL",
    isKnownScamNetwork: true,
    commonLure: "Dear consumer your electricity power will be disconnected tonight at 9:30 PM from electricity office because your previous month bill was not updated. Please immediately contact our power officer 9832100000."
  },
  "+918765432100": {
    phoneNumber: "+91 87654 32100",
    identifiedEntity: "Fake India Post / Courier Address Update Scam",
    telecomCircle: "Delhi NCR (Virtual SIM Pool)",
    chakshuReportsCount: 64,
    spamCategory: "Courier Delivery Phishing",
    riskScore: 89,
    threatLevel: "CRITICAL",
    isKnownScamNetwork: true,
    commonLure: "IndiaPost: Your package delivery has been put on hold due to incomplete house address number. Please update your address within 24 hours at http://indiapost-update-kyc.in to avoid return to sender."
  },
  "+919436112345": {
    phoneNumber: "+91 94361 12345",
    identifiedEntity: "Verified Personal Contact / Friend",
    telecomCircle: "Assam / North East (Jio 5G)",
    chakshuReportsCount: 0,
    spamCategory: "Legitimate / Personal",
    riskScore: 4,
    threatLevel: "LOW",
    isKnownScamNetwork: false,
    commonLure: "Hey, are you free this evening? Let's catch up over coffee around 6 PM if you're done with work."
  }
};

// ==========================================
// SERVER-SENT EVENTS (SSE) STREAMING POOL
// ==========================================
let sseClients = [];

function broadcastSSE(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients = sseClients.filter((client) => {
    try {
      if (!client.writableEnded && !client.destroyed) {
        client.write(payload);
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  });
}

// GET /api/stream-threats
// Server-Sent Events stream for live endpoint telemetry, threat detection & external webhooks
app.get('/api/stream-threats', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  res.on('error', (err) => {
    console.warn('[SSE] Client response error:', err.message);
  });
  req.on('error', (err) => {
    console.warn('[SSE] Client request error:', err.message);
  });

  sseClients.push(res);
  console.log(`[SSE] Client connected. Total active clients: ${sseClients.length}`);

  // Send initial handshake
  try {
    res.write(`event: connected\ndata: ${JSON.stringify({
      message: "Connected to E.D.I.T.H. Real-Time Zero-Trust SSE Threat Stream",
      clientCount: sseClients.length,
      time: formatCurrentTime(),
      currentStage: currentRadarStage,
      telemetry: deviceTelemetry
    })}\n\n`);
  } catch (err) {
    console.warn('[SSE] Handshake error:', err.message);
  }

  // Heartbeat keep-alive every 25s
  const heartbeat = setInterval(() => {
    try {
      if (!res.writableEnded && !res.destroyed) {
        res.write(`: heartbeat\n\n`);
      } else {
        clearInterval(heartbeat);
      }
    } catch (e) {
      clearInterval(heartbeat);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients = sseClients.filter(c => c !== res);
    console.log(`[SSE] Client disconnected. Remaining clients: ${sseClients.length}`);
  });
});

// ==========================================
// 0. GET / - MOBILE FIELD INCIDENT TRANSMITTER
// Mobile-friendly HTML test console for Pinggy / ngrok tunnel smartphone access
// ==========================================
app.get('/', (req, res) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>E.D.I.T.H. Field Incident Transmitter</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #070a12;
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 16px;
      line-height: 1.5;
      min-height: 100vh;
    }
    .container {
      max-width: 520px;
      margin: 0 auto;
      padding-bottom: 30px;
    }
    .header {
      text-align: center;
      margin-bottom: 20px;
      padding: 16px;
      background: linear-gradient(180deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%);
      border: 1px solid rgba(56, 189, 248, 0.2);
      border-radius: 16px;
      backdrop-filter: blur(10px);
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-family: monospace;
      font-weight: 600;
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.4);
      color: #34d399;
      margin-bottom: 8px;
    }
    .pulse-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #34d399;
      box-shadow: 0 0 8px #34d399;
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.8); }
    }
    h1 {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.5px;
      color: #f8fafc;
    }
    .subtitle {
      font-size: 12px;
      color: #94a3b8;
      margin-top: 4px;
    }
    .section-title {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #94a3b8;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .presets {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 20px;
    }
    .preset-btn {
      background: #0f172a;
      border: 1px solid rgba(148, 163, 184, 0.2);
      color: #f1f5f9;
      padding: 10px 14px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 500;
      text-align: left;
      cursor: pointer;
      transition: all 0.2s;
    }
    .preset-btn:active {
      transform: scale(0.98);
      background: #1e293b;
      border-color: #38bdf8;
    }
    .card {
      background: #0f172a;
      border: 1px solid rgba(148, 163, 184, 0.15);
      border-radius: 14px;
      padding: 16px;
      margin-bottom: 20px;
    }
    label {
      display: block;
      font-size: 12px;
      font-weight: 600;
      color: #cbd5e1;
      margin-bottom: 6px;
    }
    input, textarea {
      width: 100%;
      background: #070a13;
      border: 1px solid rgba(148, 163, 184, 0.25);
      border-radius: 8px;
      color: #f8fafc;
      padding: 10px 12px;
      font-size: 14px;
      font-family: inherit;
      margin-bottom: 14px;
      outline: none;
    }
    input:focus, textarea:focus {
      border-color: #38bdf8;
      box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.2);
    }
    .submit-btn {
      width: 100%;
      background: linear-gradient(135deg, #ef4444 0%, #f59e0b 100%);
      color: white;
      border: none;
      border-radius: 10px;
      padding: 14px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(239, 68, 68, 0.4);
      transition: all 0.2s;
    }
    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .result-box {
      display: none;
      margin-top: 20px;
      padding: 16px;
      border-radius: 12px;
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.4);
    }
    .result-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #34d399;
      font-weight: 700;
      font-size: 14px;
      margin-bottom: 10px;
    }
    .metric {
      font-size: 12px;
      color: #94a3b8;
      margin-bottom: 4px;
    }
    .metric strong {
      color: #f1f5f9;
    }
    .analysis {
      font-size: 12px;
      line-height: 1.4;
      color: #cbd5e1;
      margin-top: 10px;
      padding: 10px;
      background: rgba(0,0,0,0.3);
      border-radius: 8px;
      border-left: 3px solid #38bdf8;
    }
    .footer {
      text-align: center;
      font-size: 11px;
      color: #64748b;
      margin-top: 24px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="badge">
        <span class="pulse-dot"></span> LIVE UPLINK ACTIVE
      </div>
      <h1>E.D.I.T.H. Field Incident Transmitter</h1>
      <p class="subtitle">Next-Gen Zero-Trust Mobile Fraud Defense &middot; NCRP 1930 &amp; Chakshu Gateway</p>
    </div>

    <div class="section-title">Quick Threat Presets</div>
    <div class="presets">
      <button type="button" class="preset-btn" onclick="setPreset('electricity')">
        ⚡ <strong>Electricity Bill Scam</strong> (+91 98321 00000)
      </button>
      <button type="button" class="preset-btn" onclick="setPreset('sbi')">
        🏦 <strong>SBI KYC Suspension</strong> (+91 91234 56789)
      </button>
      <button type="button" class="preset-btn" onclick="setPreset('cbi')">
        🚨 <strong>Digital Arrest Police Threat</strong> (+91 88776 65544)
      </button>
    </div>

    <div class="card">
      <form id="incidentForm" onsubmit="transmitIncident(event)">
        <label for="phone">Originator Phone Number</label>
        <input type="tel" id="phone" value="+91 98321 00000" required>

        <label for="msg">Threat / SMS Message Content</label>
        <textarea id="msg" rows="4" required>Dear consumer your electricity power will be disconnected tonight at 9:30 PM from electricity office because your previous month bill was not updated. Please immediately contact our power officer 9832100000.</textarea>

        <button type="submit" id="submitBtn" class="submit-btn">
          🚀 Transmit Incident to Command Center
        </button>
      </form>

      <div id="resultBox" class="result-box">
        <div class="result-banner">
          <span>✓</span>
          <span>Payload Ingested Live &amp; Broadcasted to Command Center</span>
        </div>
        <div class="metric"><strong>Identified Entity:</strong> <span id="resEntity"></span></div>
        <div class="metric"><strong>Threat Level:</strong> <span id="resThreat" style="font-weight:bold;"></span></div>
        <div class="metric"><strong>Risk Score:</strong> <span id="resRisk"></span>/100</div>
        <div class="metric"><strong>Telecom Circle:</strong> <span id="resCircle"></span></div>
        <div class="metric"><strong>Chakshu Reports:</strong> <span id="resReports"></span></div>
        <div class="analysis" id="resAnalysis"></div>
      </div>
    </div>

    <div class="footer">
      Protected by E.D.I.T.H. Heuristics &middot; Governed under IT Act 2000 &amp; BNS 318(4)
    </div>
  </div>

  <script>
    const PRESETS = {
      electricity: {
        phone: "+91 98321 00000",
        msg: "Dear consumer your electricity power will be disconnected tonight at 9:30 PM from electricity office because your previous month bill was not updated. Please immediately contact our power officer 9832100000 or pay via apk."
      },
      sbi: {
        phone: "+91 91234 56789",
        msg: "SBI Alert: Your YONO NetBanking account has been blocked due to incomplete PAN KYC verification. Immediately update PAN at http://sbi-kyc-verify.in to restore access."
      },
      cbi: {
        phone: "+91 88776 65544",
        msg: "CBI Cyber Cell Notice: A parcel containing contraband narcotics in your name was intercepted by Mumbai Customs. A warrant under NDPS has been issued. Cooperate via video call immediately."
      }
    };

    function setPreset(key) {
      const p = PRESETS[key];
      if (!p) return;
      document.getElementById('phone').value = p.phone;
      document.getElementById('msg').value = p.msg;
      document.getElementById('resultBox').style.display = 'none';
    }

    async function transmitIncident(e) {
      e.preventDefault();
      const phone = document.getElementById('phone').value.trim();
      const msg = document.getElementById('msg').value.trim();
      const btn = document.getElementById('submitBtn');
      const box = document.getElementById('resultBox');

      btn.disabled = true;
      btn.innerHTML = '⏳ Transmitting to E.D.I.T.H. AI...';
      box.style.display = 'none';

      try {
        const res = await fetch('/api/lookup-threat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: phone,
            messageText: msg,
            contextType: 'SMS'
          })
        });

        const data = await res.json();
        if (data.success && data.result) {
          const r = data.result;
          document.getElementById('resEntity').innerText = r.identifiedEntity;
          document.getElementById('resThreat').innerText = r.threatLevel;
          document.getElementById('resThreat').style.color = (r.threatLevel === 'CRITICAL' || r.threatLevel === 'HIGH') ? '#f87171' : '#34d399';
          document.getElementById('resRisk').innerText = r.riskScore;
          document.getElementById('resCircle').innerText = r.telecomCircle;
          document.getElementById('resReports').innerText = r.chakshuReportsCount + ' citizen complaints';
          document.getElementById('resAnalysis').innerText = r.geminiAnalysis;
          box.style.display = 'block';
          box.scrollIntoView({ behavior: 'smooth' });
        } else {
          alert('Failed to transmit incident: ' + (data.error || 'Unknown error'));
        }
      } catch (err) {
        alert('Transmission error: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = '🚀 Transmit Incident to Command Center';
      }
    }
  </script>
</body>
</html>`;

  res.send(html);
});

// ==========================================
// 1. GET /api/apps
// Returns apps with declared purpose, expected vs granted permissions, trust score & stage
// ==========================================
app.get('/api/apps', (req, res) => {
  res.json(apps);
});

// ==========================================
// 2. GET /api/logs
// ==========================================
app.get('/api/logs', (req, res) => {
  res.json(logs);
});

// ==========================================
// 3. GET /api/device-telemetry
// ==========================================
app.get('/api/device-telemetry', (req, res) => {
  res.json({
    success: true,
    telemetry: deviceTelemetry,
    incident_history: incidentHistory
  });
});

// ==========================================
// ZERO-TRUST AUTONOMOUS MITIGATION POLICIES
// ==========================================
let zeroTrustPolicies = [
  {
    id: "auto-freeze-radar",
    label: "Auto-Freeze Scam Kill-Chain (Trust < 30)",
    description: "Instantly revoke sensitive permissions and trigger OEM kill-switch when stage 5 harvest is detected.",
    enabled: true,
    category: "kill-chain",
    eventCount: 14,
    eventLabel: "Kill-Switches Executed",
    mitigationHook: "OEM_PERMISSION_KILL_SWITCH",
    statutoryRef: "BNS § 318(4) & IT Act § 66D"
  },
  {
    id: "chakshu-auto-dispatch",
    label: "Automatic Sanchar Saathi / Chakshu Reporting (> 90% Risk)",
    description: "Transmit evidence packet to DoT and NCRP 1930 when fraud probability exceeds 90%.",
    enabled: true,
    category: "telecom",
    eventCount: 87,
    eventLabel: "Packets Transmitted",
    mitigationHook: "SANCHAR_SAATHI_NCRP_1930",
    statutoryRef: "TRAI TCCCPR 2018 & DoT Circular"
  },
  {
    id: "flag-secure-enforce",
    label: "Enforce Android FLAG_SECURE on UPI Screens",
    description: "Blank out screen mirroring for AnyDesk, RustDesk, and TeamViewer over banking apps.",
    enabled: true,
    category: "endpoint",
    eventCount: 32,
    eventLabel: "Sessions Blackened",
    mitigationHook: "SURFACE_PROJECTION_INTERCEPT",
    statutoryRef: "RBI Cyber Security Framework"
  },
  {
    id: "accessibility-quarantine",
    label: "Isolate BIND_ACCESSIBILITY_SERVICE on Sideloads",
    description: "Immediately restrict non-Play Store APKs requesting accessibility or notification interception.",
    enabled: true,
    category: "endpoint",
    eventCount: 9,
    eventLabel: "Sideloads Isolated",
    mitigationHook: "APPOPS_BIND_ACCESSIBILITY_QUARANTINE",
    statutoryRef: "IT Act § 43 & § 66"
  },
  {
    id: "auto-suspend-spikes",
    label: "Auto-Suspend on Request Rate Spikes (10x Baseline)",
    description: "Temporarily freeze applications exceeding 10x baseline query frequencies on private data.",
    enabled: true,
    category: "heuristics",
    eventCount: 5,
    eventLabel: "Rate Spikes Suspended",
    mitigationHook: "EBPF_RATE_LIMITER_PAUSE_PID",
    statutoryRef: "DPDP Act 2023 Sec 6 (Purpose Limitation)"
  }
];

function isPolicyEnabled(policyId) {
  const p = zeroTrustPolicies.find(item => item.id === policyId);
  return p ? p.enabled : true;
}

function incrementPolicyCount(policyId) {
  const p = zeroTrustPolicies.find(item => item.id === policyId);
  if (p) {
    p.eventCount += 1;
    return p.eventCount;
  }
  return 0;
}

// GET /api/policies
app.get('/api/policies', (req, res) => {
  return res.json({
    success: true,
    policies: zeroTrustPolicies,
    summary: {
      total: zeroTrustPolicies.length,
      active: zeroTrustPolicies.filter(p => p.enabled).length,
      totalInterventions: zeroTrustPolicies.reduce((acc, p) => acc + p.eventCount, 0)
    }
  });
});

// POST /api/policies/toggle
app.post('/api/policies/toggle', (req, res) => {
  const { id, enabled } = req.body;
  const policy = zeroTrustPolicies.find(p => p.id === id);
  if (!policy) {
    return res.status(404).json({ error: `Policy '${id}' not found` });
  }

  policy.enabled = typeof enabled === 'boolean' ? enabled : !policy.enabled;

  const logEntry = {
    id: `log-${Date.now()}-policy-toggle`,
    time: formatCurrentTime(),
    app: "Zero-Trust Policy Engine",
    resource: policy.id,
    result: policy.enabled ? "Allowed" : "Flagged",
    details: `Policy [${policy.label}] updated status: ${policy.enabled ? "ENFORCING (ACTIVE)" : "DISABLED / MANUAL ONLY"}`
  };
  logs.unshift(logEntry);

  broadcastSSE('policies_update', { policies: zeroTrustPolicies });
  broadcastSSE('log_entry', logEntry);

  return res.json({
    success: true,
    policy,
    policies: zeroTrustPolicies
  });
});

function executeDiagnosticStep(stepNum) {
  const step = Number(stepNum);
  const now = formatCurrentTime();
  const timestamp = new Date().toISOString();

  if (step === 1) {
    const policy = zeroTrustPolicies.find(p => p.id === "auto-freeze-radar");
    const isEnabled = policy ? policy.enabled : false;

    if (isEnabled) {
      policy.eventCount += 1;
      deviceTelemetry.status = "COMPROMISED - MITIGATED";
      deviceTelemetry.trust_score = 12;
      deviceTelemetry.mitigation_status = "AUTO_FREEZE_TRIGGERED_&_ACCESSIBILITY_QUARANTINED";

      const log = {
        id: `log-${Date.now()}-diag-step-1`,
        time: now,
        app: "E.D.I.T.H. Kill-Switch Engine",
        resource: "PID 18492 / READ_SMS, READ_CALL_LOG",
        result: "Blocked",
        details: "[KILL-CHAIN MITIGATED] OEM permission freeze executed for PID 18492 (Revoked READ_SMS, READ_CALL_LOG)"
      };
      logs.unshift(log);

      const eventPayload = {
        source: "POLICY_DIAGNOSTIC",
        deviceId: "Android-Kernel-Hook",
        eventType: "KILL_CHAIN_MITIGATION",
        appName: "RTO Challan QuickPay (PID 18492)",
        threatLevel: "CRITICAL",
        details: log.details,
        timestamp,
        log
      };

      broadcastSSE('webhook_event', eventPayload);
      broadcastSSE('log_entry', log);
      broadcastSSE('telemetry_update', deviceTelemetry);

      return {
        step: 1,
        policyId: "auto-freeze-radar",
        policyLabel: policy.label,
        status: "VERIFIED",
        verdict: "VERIFIED OPERATIONAL",
        latencyMs: 14,
        details: "OEM permission freeze executed for PID 18492. Sensitive scopes revoked.",
        counter: policy.eventCount,
        log
      };
    } else {
      const log = {
        id: `log-${Date.now()}-diag-step-1-bypassed`,
        time: now,
        app: "E.D.I.T.H. Kill-Switch Engine",
        resource: "PID 18492",
        result: "Flagged",
        details: "[KILL-CHAIN BYPASSED] Stage 5 harvest on PID 18492 detected, but Auto-Freeze policy is DISABLED. Manual intervention required."
      };
      logs.unshift(log);
      broadcastSSE('log_entry', log);

      return {
        step: 1,
        policyId: "auto-freeze-radar",
        policyLabel: policy.label,
        status: "BYPASSED",
        verdict: "BYPASSED / MANUAL ACTION REQUIRED",
        latencyMs: 4,
        details: "Policy disabled. Kill-switch skipped.",
        counter: policy.eventCount,
        log
      };
    }
  }

  if (step === 2) {
    const policy = zeroTrustPolicies.find(p => p.id === "chakshu-auto-dispatch");
    const isEnabled = policy ? policy.enabled : false;

    if (isEnabled) {
      policy.eventCount += 1;
      const refId = `CK-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

      const log = {
        id: `log-${Date.now()}-diag-step-2`,
        time: now,
        app: "Sanchar Saathi / NCRP 1930 Gateway",
        resource: "+91 98321 00000 / Evidence Seal",
        result: "Blocked",
        details: `[1930 DISPATCH] TRANSMITTED TO SANCHAR SAATHI / NCRP 1930 INGESTION GATEWAY (SHA-256 sealed, BNS § 318(4) & IT Act § 66D, Ref: ${refId})`
      };
      logs.unshift(log);

      const eventPayload = {
        source: "POLICY_DIAGNOSTIC",
        deviceId: "DoT-Chakshu-Gateway",
        eventType: "SANCHAR_SAATHI_DISPATCH",
        appName: "National Cyber Defense 1930",
        threatLevel: "CRITICAL",
        details: log.details,
        timestamp,
        log
      };

      broadcastSSE('webhook_event', eventPayload);
      broadcastSSE('log_entry', log);

      return {
        step: 2,
        policyId: "chakshu-auto-dispatch",
        policyLabel: policy.label,
        status: "VERIFIED",
        verdict: "VERIFIED OPERATIONAL",
        latencyMs: 18,
        details: `Evidence packet transmitted to DoT Sanchar Saathi and NCRP 1930 (Ref: ${refId}).`,
        counter: policy.eventCount,
        log
      };
    } else {
      const log = {
        id: `log-${Date.now()}-diag-step-2-bypassed`,
        time: now,
        app: "Sanchar Saathi / NCRP 1930 Gateway",
        resource: "+91 98321 00000",
        result: "Flagged",
        details: "[1930 DISPATCH BYPASSED] 94% risk smishing payload detected, but Automatic Sanchar Saathi Reporting policy is DISABLED."
      };
      logs.unshift(log);
      broadcastSSE('log_entry', log);

      return {
        step: 2,
        policyId: "chakshu-auto-dispatch",
        policyLabel: policy.label,
        status: "BYPASSED",
        verdict: "BYPASSED / MANUAL ACTION REQUIRED",
        latencyMs: 3,
        details: "Policy disabled. Regulatory dispatch skipped.",
        counter: policy.eventCount,
        log
      };
    }
  }

  if (step === 3) {
    const policy = zeroTrustPolicies.find(p => p.id === "flag-secure-enforce");
    const isEnabled = policy ? policy.enabled : false;

    if (isEnabled) {
      policy.eventCount += 1;
      deviceTelemetry.remote_access_service = "BLOCKED (SURFACE_PROJECTION_INTERCEPT)";
      deviceTelemetry.foreground_app = "com.phonepe.app (FLAG_SECURE Active)";

      const log = {
        id: `log-${Date.now()}-diag-step-3`,
        time: now,
        app: "SurfaceFlinger / WindowManager Shield",
        resource: "VirtualDisplay Surface Mirror",
        result: "Blocked",
        details: "[FLAG_SECURE ENFORCED] WindowManager.LayoutParams.FLAG_SECURE active. Screen projection blackened (SURFACE_PROJECTION_INTERCEPT)"
      };
      logs.unshift(log);

      const eventPayload = {
        source: "POLICY_DIAGNOSTIC",
        deviceId: "WindowManager-Service",
        eventType: "SURFACE_PROJECTION_INTERCEPT",
        appName: "PhonePe UPI (com.phonepe.app)",
        threatLevel: "CRITICAL",
        details: log.details,
        timestamp,
        log
      };

      broadcastSSE('webhook_event', eventPayload);
      broadcastSSE('log_entry', log);
      broadcastSSE('telemetry_update', deviceTelemetry);

      return {
        step: 3,
        policyId: "flag-secure-enforce",
        policyLabel: policy.label,
        status: "VERIFIED",
        verdict: "VERIFIED OPERATIONAL",
        latencyMs: 15,
        details: "WindowManager FLAG_SECURE enforced over active UPI screen. Mirror feed neutralized.",
        counter: policy.eventCount,
        log
      };
    } else {
      const log = {
        id: `log-${Date.now()}-diag-step-3-bypassed`,
        time: now,
        app: "SurfaceFlinger / WindowManager Shield",
        resource: "VirtualDisplay Surface Mirror",
        result: "Flagged",
        details: "[FLAG_SECURE BYPASSED] Screen mirroring active over UPI app, but FLAG_SECURE policy is DISABLED."
      };
      logs.unshift(log);
      broadcastSSE('log_entry', log);

      return {
        step: 3,
        policyId: "flag-secure-enforce",
        policyLabel: policy.label,
        status: "BYPASSED",
        verdict: "BYPASSED / MANUAL ACTION REQUIRED",
        latencyMs: 3,
        details: "Policy disabled. Screen mirror permitted.",
        counter: policy.eventCount,
        log
      };
    }
  }

  if (step === 4) {
    const policy = zeroTrustPolicies.find(p => p.id === "accessibility-quarantine");
    const isEnabled = policy ? policy.enabled : false;

    if (isEnabled) {
      policy.eventCount += 1;
      deviceTelemetry.sideloaded_app = "com.bijli.bill.update (ISOLATED)";
      deviceTelemetry.accessibility_status = "REVOKED_AND_QUARANTINED";

      const log = {
        id: `log-${Date.now()}-diag-step-4`,
        time: now,
        app: "AppOps / Package Manager",
        resource: "BIND_ACCESSIBILITY_SERVICE",
        result: "Blocked",
        details: "[ACCESSIBILITY ISOLATED] Revoked BIND_ACCESSIBILITY_SERVICE token for com.bijli.bill.update (installSource != com.android.vending)"
      };
      logs.unshift(log);

      const eventPayload = {
        source: "POLICY_DIAGNOSTIC",
        deviceId: "AppOps-Kernel-Daemon",
        eventType: "ACCESSIBILITY_SERVICE_QUARANTINED",
        appName: "com.bijli.bill.update",
        threatLevel: "CRITICAL",
        details: log.details,
        timestamp,
        log
      };

      broadcastSSE('webhook_event', eventPayload);
      broadcastSSE('log_entry', log);
      broadcastSSE('telemetry_update', deviceTelemetry);

      return {
        step: 4,
        policyId: "accessibility-quarantine",
        policyLabel: policy.label,
        status: "VERIFIED",
        verdict: "VERIFIED OPERATIONAL",
        latencyMs: 19,
        details: "Accessibility binding revoked for untrusted sideloaded APK container.",
        counter: policy.eventCount,
        log
      };
    } else {
      const log = {
        id: `log-${Date.now()}-diag-step-4-bypassed`,
        time: now,
        app: "AppOps / Package Manager",
        resource: "BIND_ACCESSIBILITY_SERVICE",
        result: "Flagged",
        details: "[ACCESSIBILITY BYPASSED] Untrusted sideload requested accessibility token, but Accessibility Quarantine policy is DISABLED."
      };
      logs.unshift(log);
      broadcastSSE('log_entry', log);

      return {
        step: 4,
        policyId: "accessibility-quarantine",
        policyLabel: policy.label,
        status: "BYPASSED",
        verdict: "BYPASSED / MANUAL ACTION REQUIRED",
        latencyMs: 4,
        details: "Policy disabled. Sideload accessibility binding allowed.",
        counter: policy.eventCount,
        log
      };
    }
  }

  if (step === 5) {
    const policy = zeroTrustPolicies.find(p => p.id === "auto-suspend-spikes");
    const isEnabled = policy ? policy.enabled : false;

    if (isEnabled) {
      policy.eventCount += 1;

      const log = {
        id: `log-${Date.now()}-diag-step-5`,
        time: now,
        app: "Kernel eBPF / Anomaly Engine",
        resource: "Contacts Provider / sys_query",
        result: "Blocked",
        details: "[RATE ANOMALY] 15x baseline threshold exceeded on Contacts. Process PID 2201 paused and alert dispatched to Incident Black Box"
      };
      logs.unshift(log);

      const eventPayload = {
        source: "POLICY_DIAGNOSTIC",
        deviceId: "Kernel-eBPF-Monitor",
        eventType: "RATE_SPIKE_SUSPENSION",
        appName: "Process PID 2201",
        threatLevel: "HIGH",
        details: log.details,
        timestamp,
        log
      };

      broadcastSSE('webhook_event', eventPayload);
      broadcastSSE('log_entry', log);

      return {
        step: 5,
        policyId: "auto-suspend-spikes",
        policyLabel: policy.label,
        status: "VERIFIED",
        verdict: "VERIFIED OPERATIONAL",
        latencyMs: 18,
        details: "15x query frequency detected. Process PID 2201 suspended and alert pushed to Black Box.",
        counter: policy.eventCount,
        log
      };
    } else {
      const log = {
        id: `log-${Date.now()}-diag-step-5-bypassed`,
        time: now,
        app: "Kernel eBPF / Anomaly Engine",
        resource: "Contacts Provider",
        result: "Flagged",
        details: "[RATE ANOMALY BYPASSED] 15x baseline rate spike detected on Contacts, but Auto-Suspend policy is DISABLED."
      };
      logs.unshift(log);
      broadcastSSE('log_entry', log);

      return {
        step: 5,
        policyId: "auto-suspend-spikes",
        policyLabel: policy.label,
        status: "BYPASSED",
        verdict: "BYPASSED / MANUAL ACTION REQUIRED",
        latencyMs: 4,
        details: "Policy disabled. Rate anomaly unthrottled.",
        counter: policy.eventCount,
        log
      };
    }
  }

  return { error: `Invalid step: ${stepNum}` };
}

// POST /api/policies/run-diagnostic-step
app.post('/api/policies/run-diagnostic-step', (req, res) => {
  const { step } = req.body;
  if (!step || step < 1 || step > 5) {
    return res.status(400).json({ error: "Step must be between 1 and 5" });
  }
  const result = executeDiagnosticStep(step);
  broadcastSSE('policies_update', { policies: zeroTrustPolicies });
  return res.json({
    success: true,
    stepResult: result,
    policies: zeroTrustPolicies
  });
});

// POST /api/policies/run-diagnostic
app.post('/api/policies/run-diagnostic', async (req, res) => {
  try {
    const results = [];
    for (let s = 1; s <= 5; s++) {
      results.push(executeDiagnosticStep(s));
    }
    const passed = results.filter(r => r.status === "VERIFIED").length;
    const allPassed = passed === 5;

    const report = {
      totalTested: 5,
      passed,
      bypassed: 5 - passed,
      latencyMs: 18,
      message: allPassed
        ? "ALL 5 AUTONOMOUS MITIGATION POLICIES VERIFIED OPERATIONAL"
        : `${passed}/5 POLICIES ACTIVE (${5 - passed} Policy Bypassed / Manual Action Required)`
    };

    broadcastSSE('policies_update', { policies: zeroTrustPolicies });

    return res.json({
      success: true,
      verification: report,
      steps: results,
      policies: zeroTrustPolicies,
      logs
    });
  } catch (err) {
    return res.status(500).json({ error: "Diagnostic test failed", details: err.message });
  }
});

// ==========================================
// WEBHOOK INGESTION (EXTERNAL DEVICES / APPOPS / OEM PRIVILEGE)
// ==========================================
const handleDeviceWebhook = async (req, res) => {
  try {
    const {
      deviceId = "External-Android-Pixel7A",
      eventType = "SUSPICIOUS_PERMISSION_HOOK",
      appName = "Bijli_Bill_Update.apk",
      packageName = "com.bijli.bill.update",
      details = "Untrusted accessibility service attempting to scrape SMS and OTP input fields",
      threatLevel = "HIGH",
      telephonyState,
      remoteAccessService,
      accessibilityStatus,
      foregroundApp
    } = req.body;

    console.log(`[WEBHOOK] Received external payload from ${deviceId}: ${eventType}`);

    // Update telemetry state if payload contains telemetry vectors
    if (telephonyState || remoteAccessService || accessibilityStatus || foregroundApp) {
      deviceTelemetry = {
        ...deviceTelemetry,
        device: deviceId,
        telephony_state: telephonyState || deviceTelemetry.telephony_state,
        remote_access_service: remoteAccessService || deviceTelemetry.remote_access_service,
        accessibility_status: accessibilityStatus || deviceTelemetry.accessibility_status,
        foreground_app: foregroundApp || deviceTelemetry.foreground_app,
        status: threatLevel === "CRITICAL" ? "COMPROMISED - MITIGATED" : (threatLevel === "HIGH" ? "WARNING" : "SECURE"),
        trust_score: threatLevel === "CRITICAL" ? 15 : (threatLevel === "HIGH" ? 45 : 95)
      };
    }

    const newLog = {
      id: `log-${Date.now()}-webhook`,
      time: formatCurrentTime(),
      app: appName,
      resource: eventType,
      result: threatLevel === "CRITICAL" ? "Blocked" : (threatLevel === "HIGH" ? "Flagged" : "Allowed"),
      details: `[WEBHOOK INGEST (${deviceId})] ${details}`
    };
    logs.push(newLog);

    const eventPayload = {
      source: "EXTERNAL_WEBHOOK",
      deviceId,
      eventType,
      appName,
      packageName,
      details,
      threatLevel,
      timestamp: new Date().toISOString(),
      telemetry: deviceTelemetry,
      log: newLog
    };

    // Broadcast live over SSE to all connected Next.js UI clients!
    broadcastSSE('webhook_event', eventPayload);
    broadcastSSE('telemetry_update', deviceTelemetry);
    broadcastSSE('log_entry', newLog);

    return res.json({
      success: true,
      message: "Webhook event processed and broadcasted via SSE stream",
      activeClients: sseClients.length,
      event: eventPayload
    });
  } catch (err) {
    console.error("[WEBHOOK] Error processing webhook event:", err);
    return res.status(500).json({ error: "Failed to process webhook event", details: err.message });
  }
};

app.post('/api/webhook/device-event', handleDeviceWebhook);
app.post('/api/webhook', handleDeviceWebhook);

// ==========================================
// 4. SCAM KILL-CHAIN RADAR ENDPOINTS
// ==========================================

// GET /api/radar/state
app.get('/api/radar/state', (req, res) => {
  const targetApp = apps.find(a => a.name === "RTO Challan QuickPay") || apps[2];
  res.json({
    success: true,
    currentStage: currentRadarStage,
    stageInfo: currentRadarStage > 0 ? KILL_CHAIN_STAGES[currentRadarStage - 1] : null,
    targetApp,
    dossier: currentDossier,
    hinglishWarning: currentHinglishWarning,
    legalViolations: LEGAL_VIOLATIONS,
    stages: KILL_CHAIN_STAGES
  });
});

// POST /api/radar/simulate-step
app.post('/api/radar/simulate-step', async (req, res) => {
  try {
    const requestedStage = req.body?.stage !== undefined ? Number(req.body.stage) : null;
    if (requestedStage !== null && requestedStage >= 1 && requestedStage <= 5) {
      currentRadarStage = requestedStage;
    } else {
      currentRadarStage = currentRadarStage >= 5 ? 5 : currentRadarStage + 1;
    }

    const stageData = KILL_CHAIN_STAGES[currentRadarStage - 1];
    const targetApp = apps.find(a => a.name === "RTO Challan QuickPay") || apps[2];

    // Update target application state
    targetApp.killChainStage = stageData.stage;
    targetApp.trustScore = stageData.trustScore;
    targetApp.status = stageData.status;
    targetApp.activeRiskSignals = stageData.signals;
    targetApp.grantedPermissions = stageData.addedPermissions.length > 0 
      ? ["Internet", ...stageData.addedPermissions] 
      : ["Internet"];
    targetApp.permissions = targetApp.grantedPermissions;
    targetApp.spike = stageData.stage >= 3;
    targetApp.requestsPerHour = stageData.stage === 5 ? 0 : (stageData.stage >= 3 ? 3200 : 45);
    targetApp.alert = stageData.stage >= 3 ? stageData.description : null;

    console.log(`[RADAR] Advanced to Stage ${currentRadarStage}: ${stageData.id} (App Trust: ${targetApp.trustScore})`);

    // Generate Dossier & Hinglish Warning
    currentDossier = generateComplaintDossier(targetApp, stageData);
    currentHinglishWarning = await generateHinglishWarning(targetApp.name, stageData);

    // Sync into Device Telemetry
    if (currentRadarStage >= 2) {
      deviceTelemetry.sideloaded_app = "RTO_Challan_QuickPay.apk (WhatsApp Sideload)";
    }
    if (currentRadarStage >= 3) {
      deviceTelemetry.accessibility_status = "GRANTED_AND_OBSERVING_EVENTS";
      deviceTelemetry.telephony_state = "CALL_ACTIVE (Incoming +91-98765-XXXXX)";
    }
    if (currentRadarStage >= 4) {
      deviceTelemetry.remote_access_service = "C2 Secondary Dropper (185.220.101.5)";
    }
    if (currentRadarStage === 5) {
      if (isPolicyEnabled('auto-freeze-radar')) {
        incrementPolicyCount('auto-freeze-radar');
        deviceTelemetry.trust_score = 10;
        deviceTelemetry.status = "COMPROMISED - MITIGATED";
        deviceTelemetry.mitigation_status = "AUTO_FREEZE_TRIGGERED_&_ACCESSIBILITY_QUARANTINED";
        deviceTelemetry.last_incident = {
          timestamp: formatCurrentTime(),
          confidence_score: 99,
          incident_summary: stageData.description,
          automated_mitigation: "AUTO_FREEZE_PROCESS_AND_DISMISS_ACCESSIBILITY_BINDING",
          ai_response: {
            threat_level: "CRITICAL",
            attack_vector: "INDIAN_APK_SCAM_TAKEOVER",
            automated_mitigation: "AUTO_FREEZE_KILL_SWITCH",
            trust_score_deduction: 78,
            confidence_score: 99,
            incident_summary: stageData.description
          }
        };

        logs.unshift({
          id: `log-${Date.now()}-stage-5-kill-mitigated`,
          time: formatCurrentTime(),
          app: "E.D.I.T.H. Kill-Switch Engine",
          resource: "PID 18492 / READ_SMS, READ_CALL_LOG",
          result: "Blocked",
          details: "[KILL-CHAIN MITIGATED] OEM permission freeze executed for PID 18492 (Revoked READ_SMS, READ_CALL_LOG)"
        });

        broadcastSSE('policies_update', { policies: zeroTrustPolicies });
      } else {
        deviceTelemetry.status = "COMPROMISED - UNMITIGATED";
        deviceTelemetry.mitigation_status = "BYPASSED_AUTO_FREEZE_DISABLED";
        logs.unshift({
          id: `log-${Date.now()}-stage-5-bypassed`,
          time: formatCurrentTime(),
          app: "E.D.I.T.H. Kill-Switch Engine",
          resource: "PID 18492",
          result: "Flagged",
          details: "[KILL-CHAIN BYPASSED] Stage 5 harvest on PID 18492 detected, but Auto-Freeze policy is DISABLED."
        });
      }
    }

    // Add Audit Logs for this stage
    const stageLog = {
      id: `log-${Date.now()}-stage-${stageData.stage}`,
      time: formatCurrentTime(),
      app: targetApp.name,
      resource: stageData.signals.join(", "),
      result: stageData.stage >= 3 ? (stageData.stage === 5 ? "Blocked" : "Flagged") : "Allowed",
      details: `[RADAR STAGE ${stageData.stage}: ${stageData.id}] ${stageData.description}`
    };
    logs.push(stageLog);

    if (stageData.stage === 5) {
      logs.push({
        id: `log-${Date.now()}-1930-dossier`,
        time: formatCurrentTime(),
        app: "E.D.I.T.H. Radar Engine",
        resource: "National Cyber Helpline 1930 Dossier",
        result: "Blocked",
        details: `[CONTAINMENT] Auto-Freeze executed. Statutory violations mapped to BNS 318(4), 319 & IT Act 66D. Dossier #${currentDossier.dossierId} created.`
      });
    }

    const stepResponse = {
      success: true,
      currentStage: currentRadarStage,
      stageInfo: stageData,
      activeRiskSignals: stageData.signals,
      trustScore: targetApp.trustScore,
      targetApp,
      apps,
      dossier: currentDossier,
      hinglishWarning: currentHinglishWarning,
      legalViolations: LEGAL_VIOLATIONS,
      telemetry: deviceTelemetry,
      logs
    };

    broadcastSSE('radar_step', stepResponse);
    broadcastSSE('telemetry_update', deviceTelemetry);

    return res.json(stepResponse);
  } catch (err) {
    console.error("[RADAR] Error in simulate-step:", err);
    return res.status(500).json({ error: "Failed to simulate radar step", details: err.message });
  }
});

// POST /api/radar/reset
app.post('/api/radar/reset', (req, res) => {
  currentRadarStage = 0;
  apps = getBaseApps();
  currentDossier = null;
  currentHinglishWarning = DEFAULT_HINGLISH_WARNING;
  deviceTelemetry = { ...DEFAULT_TELEMETRY };

  logs.push({
    id: `log-${Date.now()}-radar-reset`,
    time: formatCurrentTime(),
    app: "E.D.I.T.H. Radar",
    resource: "Scam Kill-Chain Radar",
    result: "Allowed",
    details: "Radar Environment reset back to Stage 0 (Baseline Secure)."
  });

  console.log("[RADAR] Simulator reset to Stage 0.");

  const resetData = {
    success: true,
    message: "Radar simulator reset to Stage 0",
    currentStage: 0,
    apps,
    telemetry: deviceTelemetry,
    logs
  };

  broadcastSSE('radar_reset', resetData);
  broadcastSSE('telemetry_update', deviceTelemetry);

  return res.json(resetData);
});

// ==========================================
// 5. MOBILE SHIELD & RAT DEFENSE ENDPOINTS
// ==========================================

// POST /api/simulate-rat-takeover
app.post('/api/simulate-rat-takeover', async (req, res) => {
  try {
    const attackTelemetry = {
      device: "Pixel 7A (Android 14)",
      telephony_state: "CALL_ACTIVE (Incoming from unknown number +91-98765-XXXXX)",
      remote_access_service: "AnyDesk Remote Session (Active Screen Mirroring)",
      sideloaded_app: "RTO_Challan_QuickPay.apk (Source: WhatsApp / Sideloaded)",
      accessibility_status: "GRANTED_AND_OBSERVING_EVENTS",
      foreground_app: "com.phonepe.app (UPI Payment Screen)"
    };

    const aiDecision = await analyzeRATThreat(attackTelemetry);
    const deduction = Number(aiDecision?.trust_score_deduction) || 80;
    const finalScore = Math.max(0, 95 - deduction);

    const isFlagSecureOn = isPolicyEnabled('flag-secure-enforce');
    const isAccessibilityQuarantineOn = isPolicyEnabled('accessibility-quarantine');

    if (isFlagSecureOn) {
      incrementPolicyCount('flag-secure-enforce');
    }
    if (isAccessibilityQuarantineOn) {
      incrementPolicyCount('accessibility-quarantine');
    }

    const appliedMitigations = [];
    if (isFlagSecureOn) appliedMitigations.push("FLAG_SECURE_ENFORCED");
    if (isAccessibilityQuarantineOn) appliedMitigations.push("ACCESSIBILITY_QUARANTINED");

    const mitigationStatus = appliedMitigations.length > 0 
      ? appliedMitigations.join("_&_") 
      : "BYPASSED_POLICIES_DISABLED";

    deviceTelemetry = {
      ...attackTelemetry,
      remote_access_service: isFlagSecureOn ? "BLOCKED (SURFACE_PROJECTION_INTERCEPT)" : attackTelemetry.remote_access_service,
      accessibility_status: isAccessibilityQuarantineOn ? "REVOKED_AND_QUARANTINED" : attackTelemetry.accessibility_status,
      trust_score: finalScore,
      status: "COMPROMISED - MITIGATED",
      mitigation_status: mitigationStatus,
      last_incident: {
        timestamp: formatCurrentTime(),
        ai_response: aiDecision,
        confidence_score: aiDecision.confidence_score || 98,
        incident_summary: aiDecision.incident_summary,
        automated_mitigation: aiDecision.automated_mitigation
      }
    };

    if (isFlagSecureOn) {
      logs.unshift({
        id: `log-${Date.now()}-flag-sec`,
        time: formatCurrentTime(),
        app: "SurfaceFlinger / WindowManager Shield",
        resource: "VirtualDisplay Surface Mirror",
        result: "Blocked",
        details: "[FLAG_SECURE ENFORCED] WindowManager.LayoutParams.FLAG_SECURE active. Screen projection blackened (SURFACE_PROJECTION_INTERCEPT)"
      });
    }

    if (isAccessibilityQuarantineOn) {
      logs.unshift({
        id: `log-${Date.now()}-acc-iso`,
        time: formatCurrentTime(),
        app: "AppOps / Package Manager",
        resource: "BIND_ACCESSIBILITY_SERVICE",
        result: "Blocked",
        details: "[ACCESSIBILITY ISOLATED] Revoked BIND_ACCESSIBILITY_SERVICE token for RTO_Challan_QuickPay.apk (installSource != com.android.vending)"
      });
    }

    broadcastSSE('policies_update', { policies: zeroTrustPolicies });

    const ratPayload = {
      success: true,
      message: "RAT & Accessibility Takeover detected and automated mitigation executed",
      ai_response: aiDecision,
      telemetry: deviceTelemetry,
      incident: deviceTelemetry.last_incident,
      logs
    };

    broadcastSSE('rat_attack', ratPayload);
    broadcastSSE('telemetry_update', deviceTelemetry);

    return res.json(ratPayload);
  } catch (err) {
    console.error("[E.D.I.T.H.] Error in simulate-rat-takeover:", err);
    return res.status(500).json({ error: "Failed to simulate RAT takeover", details: err.message });
  }
});

// POST /api/reset-device
app.post('/api/reset-device', (req, res) => {
  deviceTelemetry = { ...DEFAULT_TELEMETRY };
  logs.push({
    id: `log-${Date.now()}-reset`,
    time: formatCurrentTime(),
    app: "Pixel 7A Endpoint Shield",
    resource: "Device Telemetry & Heuristic Hooks",
    result: "Allowed",
    details: "Zero-Trust Device baseline restored. Telemetry reset to 95/100 SECURE status."
  });

  const resetDevicePayload = {
    success: true,
    message: "Device telemetry reset to SECURE baseline",
    telemetry: deviceTelemetry,
    logs
  };

  broadcastSSE('device_reset', resetDevicePayload);
  broadcastSSE('telemetry_update', deviceTelemetry);

  return res.json(resetDevicePayload);
});

// ==========================================
// 6. CALLER & SMS THREAT INTELLIGENCE (SANCHAR SAATHI / CHAKSHU)
// ==========================================

// POST /api/lookup-threat
app.post('/api/lookup-threat', async (req, res) => {
  try {
    const { phoneNumber = "", messageText = "", contextType = "SMS" } = req.body;

    // Evaluate via autonomous Indian Enterprise & Telecom Verification Engine
    const autonomousAssessment = evaluateCommunicationThreat(phoneNumber, messageText);
    const isSafe = autonomousAssessment.threatLevel === "VERIFIED SAFE";

    // Run AI assessment with pre-computed autonomous metadata
    const aiAssessment = await analyzeCallerThreat(phoneNumber, messageText, {
      contextType,
      telecomCircle: autonomousAssessment.dltValidated ? "Pan-India National DLT Gateway" : "Unregistered Route",
      chakshuReportsCount: isSafe ? 0 : 14,
      isKnownScamNetwork: !isSafe
    });

    const result = {
      phoneNumber: phoneNumber || (isSafe ? "VERIFIED-DLT" : "+91 98321 00000"),
      identifiedEntity: autonomousAssessment.matchedEntity || aiAssessment.identifiedEntity,
      telecomCircle: autonomousAssessment.dltValidated ? "Pan-India National Enterprise Route" : "Unregistered Mobile Line / IP Route",
      chakshuReportsCount: isSafe ? 0 : 14,
      spamCategory: autonomousAssessment.category || aiAssessment.spamCategory,
      riskScore: autonomousAssessment.threatScore,
      threatLevel: isSafe ? "LOW" : "CRITICAL",
      verdictSummary: autonomousAssessment.verdictSummary,
      geminiAnalysis: aiAssessment.geminiAnalysis || autonomousAssessment.verdictSummary,
      recommendedAction: isSafe ? "ALLOW" : "BLOCK_AND_REPORT_1930",
      originStatus: autonomousAssessment.originStatus,
      statutoryGrounds: autonomousAssessment.statutoryGrounds,
      showFir: autonomousAssessment.showFir,
      firDossier: autonomousAssessment.firDossier,
      attackVectors: autonomousAssessment.attackVectors,
      contextType,
      messageText
    };

    // Log the lookup event in E.D.I.T.H. Chronological Access Logs
    const callerLog = {
      id: `log-${Date.now()}-telecom-triage`,
      time: formatCurrentTime(),
      app: "Sovereign Telecom Radar",
      resource: `${contextType}: ${phoneNumber || 'Raw Payload'}`,
      result: isSafe ? "Allowed" : "Blocked",
      details: `[TRIAGE] ${result.identifiedEntity}. Score: ${result.riskScore}/100. ${result.verdictSummary}`
    };
    logs.push(callerLog);

    // Broadcast live over SSE to Next.js command center
    broadcastSSE('caller_threat', { result, logs });
    broadcastSSE('log_entry', callerLog);
    if (!isSafe) {
      broadcastSSE('webhook_event', {
        source: "TELECOM_TRIAGE_RADAR",
        deviceId: "Mobile-Field-Uplink",
        eventType: "SMISHING_COERCION_FLAGGED",
        appName: result.identifiedEntity,
        details: `${result.spamCategory}: ${messageText.slice(0, 90)}...`,
        threatLevel: "CRITICAL",
        log: callerLog
      });

      // Policy Enforcement: Automatic Sanchar Saathi / Chakshu Reporting (> 90% Risk)
      if (result.riskScore >= 90) {
        if (isPolicyEnabled('chakshu-auto-dispatch')) {
          incrementPolicyCount('chakshu-auto-dispatch');
          const autoChakshuLog = {
            id: `log-${Date.now()}-chakshu-auto`,
            time: formatCurrentTime(),
            app: "Sanchar Saathi / NCRP 1930 Gateway",
            resource: `${result.phoneNumber} / Evidence Seal`,
            result: "Blocked",
            details: `[1930 DISPATCH] TRANSMITTED TO SANCHAR SAATHI / NCRP 1930 INGESTION GATEWAY (SHA-256 sealed, BNS § 318(4) & IT Act § 66D)`
          };
          logs.unshift(autoChakshuLog);
          broadcastSSE('log_entry', autoChakshuLog);
          broadcastSSE('policies_update', { policies: zeroTrustPolicies });
        } else {
          const bypassLog = {
            id: `log-${Date.now()}-chakshu-bypassed`,
            time: formatCurrentTime(),
            app: "Sanchar Saathi / NCRP 1930 Gateway",
            resource: `${result.phoneNumber}`,
            result: "Flagged",
            details: `[1930 DISPATCH BYPASSED] 90%+ risk detected, but Automatic Sanchar Saathi Reporting policy is DISABLED.`
          };
          logs.unshift(bypassLog);
          broadcastSSE('log_entry', bypassLog);
        }
      }
    }

    return res.json({
      success: true,
      result
    });
  } catch (err) {
    console.error("Error in /api/lookup-threat:", err);
    return res.status(500).json({ error: "Failed to evaluate threat", details: err.message });
  }
});

// POST /api/report-chakshu
app.post('/api/report-chakshu', (req, res) => {
  try {
    const { phoneNumber = "", reason = "Suspected Smishing / Impersonation Fraud" } = req.body;
    const cleanNumber = phoneNumber.replace(/[\s-]/g, "");
    
    if (CHAKSHU_DATABASE[cleanNumber]) {
      CHAKSHU_DATABASE[cleanNumber].chakshuReportsCount += 1;
    }

    const refId = `CK-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    logs.push({
      id: `log-${Date.now()}-chakshu-report`,
      time: formatCurrentTime(),
      app: "Sanchar Saathi / Chakshu",
      resource: `Report ID: ${refId}`,
      result: "Blocked",
      details: `Citizen complaint logged for ${phoneNumber} to DoT Sanchar Saathi & NCRP (1930). Status: Flagged for Telecom Carrier Disconnection.`
    });

    return res.json({
      success: true,
      message: `Successfully reported ${phoneNumber} to Sanchar Saathi Chakshu Portal and NCRP 1930`,
      referenceId: refId,
      newReportCount: (CHAKSHU_DATABASE[cleanNumber]?.chakshuReportsCount) || 1,
      logs
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to submit report", details: err.message });
  }
});

// ==========================================
// 7. APP PERMISSION INCIDENT ENDPOINTS
// ==========================================

// POST /api/apps/:id/quarantine
app.post('/api/apps/:id/quarantine', (req, res) => {
  try {
    const id = req.params.id;
    const app = apps.find(a => a.id == id || a.name.toLowerCase() === id.toLowerCase());
    if (!app) {
      return res.status(404).json({ error: `App with id '${id}' not found` });
    }

    app.status = "Frozen";
    const highRisk = ["Contacts", "Files", "Drive Files", "Read SMS", "Bank Logs", "Location", "Accessibility Service"];
    const revoked = app.permissions ? app.permissions.filter(p => highRisk.includes(p)) : [];
    app.permissions = app.permissions ? app.permissions.filter(p => !highRisk.includes(p)) : [];
    app.grantedPermissions = app.permissions;
    app.requestsPerHour = 0;
    app.spike = false;
    app.trustScore = Math.min(app.trustScore, 20);
    app.alert = "Quarantined & Frozen: High-risk permissions revoked by E.D.I.T.H. Kill-Switch.";

    logs.push({
      id: `log-${Date.now()}-quarantine`,
      time: formatCurrentTime(),
      app: app.name,
      resource: revoked.length > 0 ? revoked.join(", ") : "All High-Risk Scopes",
      result: "Blocked",
      details: "Manual quarantine executed: Sensitive permissions revoked and process isolated."
    });

    broadcastSSE('apps_update', { updated_apps: apps, logs });

    return res.json({
      success: true,
      message: `${app.name} has been quarantined and permissions revoked`,
      app,
      updated_apps: apps,
      logs
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to quarantine app", details: err.message });
  }
});

// POST /api/apps/:id/restore
app.post('/api/apps/:id/restore', (req, res) => {
  try {
    const id = req.params.id;
    const app = apps.find(a => a.id == id || a.name.toLowerCase() === id.toLowerCase());
    if (!app) {
      return res.status(404).json({ error: `App with id '${id}' not found` });
    }

    app.status = "Active";
    app.trustScore = 95;
    app.alert = null;
    app.spike = false;
    app.requestsPerHour = 15;
    app.killChainStage = 0;
    app.activeRiskSignals = [];
    app.grantedPermissions = app.expectedPermissions || ["Internet"];
    app.permissions = app.grantedPermissions;

    logs.push({
      id: `log-${Date.now()}-restore`,
      time: formatCurrentTime(),
      app: app.name,
      resource: app.permissions.join(", "),
      result: "Allowed",
      details: "Application trust reset: Status restored to Active and permissions re-authorized."
    });

    broadcastSSE('apps_update', { updated_apps: apps, logs });

    return res.json({
      success: true,
      message: `${app.name} restored to Active state`,
      app,
      updated_apps: apps,
      logs
    });
  } catch (err) {
    return res.status(500).json({ error: "Failed to restore app", details: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`E.D.I.T.H. Radar & Backend running on http://localhost:${PORT}`);
});
