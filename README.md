# Project E.D.I.T.H.
### **E**nhanced **D**igital **I**dentity, **T**rust & **H**euristics
> **Zero-Trust Mobile Threat Radar, Autonomous Kill-Switch & Forensic Ledger for Indian Telecom & Mobile Banking Defense**

---

## 🛡️ Executive Summary

Mobile banking and financial fraud across India has evolved into sophisticated multi-stage kill-chains combining **social engineering, malicious APK sideloading, Accessibility API exploitation, and Remote Access Tool (RAT) takeovers** (e.g., fake RTO Challan, electricity bill disconnection, parcel delivery KYC scams).

**Project E.D.I.T.H.** is an endpoint defense platform designed to protect Indian mobile users through real-time behavioral correlation, autonomous kill-switches, verifiable consent tracking under the **DPDP Act 2023**, and admissible forensic chain-of-custody bundles under **Section 65B of the Indian Evidence Act**.

---

## 🏛️ Core Architectural Modules

```
                                  +-------------------------------------------------------+
                                  |                 PROJECT E.D.I.T.H.                    |
                                  |             ZERO-TRUST COMMAND CENTER                 |
                                  +-------------------------------------------------------+
                                                              |
                 +--------------------------------------------+--------------------------------------------+
                 |                                            |                                            |
                 v                                            v                                            v
    +--------------------------+                 +--------------------------+                 +--------------------------+
    |   SCAM KILL-CHAIN RADAR  |                 |     MOBILE SHIELD        |                 |   CALLER & SMS RADAR     |
    |  - 5-Stage Progression   |                 |  - Offhook Voice Call    |                 |  - AI Telecom Caller ID  |
    |  - Deterministic Trust   |                 |  - AnyDesk / Mirroring   |                 |  - DoT Sanchar Saathi    |
    |  - NCRP 1930 FIR Dossier |                 |  - Accessibility Hook    |                 |  - Chakshu Portal Hook   |
    |  - Gemini Hinglish Alert |                 |  - Kill-Switch (Score 15)|                 |  - Carrier Cutoff Queue  |
    +--------------------------+                 +--------------------------+                 +--------------------------+
                 |                                            |                                            |
                 +--------------------------------------------+--------------------------------------------+
                                                              |
                 +--------------------------------------------+--------------------------------------------+
                 |                                            |                                            |
                 v                                            v                                            v
    +--------------------------+                 +--------------------------+                 +--------------------------+
    |   PERMISSION BLACK BOX   |                 |     CONSENT RECEIPTS     |                 |   PRIVACY DOPPELGANGER   |
    |  - 60s Rolling Buffer    |                 |  - DPDP Act 2023 Sec 6   |                 |  - Shadow Sandbox        |
    |  - eBPF Syscall Monitor  |                 |  - ISO 27560 Standard    |                 |  - 154 Canary Contacts   |
    |  - Sec 65B Evidence Cert |                 |  - SHA-256 Fingerprint   |                 |  - Mock SBI ₹140 Statement|
    |  - Legal Forensics Export|                 |  - Instant Token Purge   |                 |  - Decoy OTP Stream      |
    +--------------------------+                 +--------------------------+                 +--------------------------+
                                                              |
                                                              v
                                  +-------------------------------------------------------+
                                  |             SERVER-SENT EVENTS (SSE) STREAM           |
                                  |  - GET /api/stream-threats (Unidirectional Push)      |
                                  |  - POST /api/webhook/device-event (OEM Ingestion)     |
                                  |  - GET / (Mobile Field Incident Transmitter)          |
                                  +-------------------------------------------------------+
```

---

### 1. Scam Kill-Chain Radar (`/components/edith/scam-radar.tsx`)
* **Explainable Scoring Engine**: Computes dynamic trust:
  $$\text{Trust Score} = 100 - \sum \text{Additive Risk Weights}$$
* **5-Stage Attack Progression**:
  1. `LURE_RECEIVED`: Phishing link via WhatsApp / SMS detected.
  2. `SIDELOADED_INSTALL`: Untrusted APK package registered ($\text{Trust} = 75$).
  3. `INTENT_MISMATCH`: Declared utility app requests `SMS` + `BIND_ACCESSIBILITY_SERVICE` ($\text{Trust} = 50$, **Warning Triggered**).
  4. `SECOND_STAGE_PAYLOAD`: Unverified IP payload downloaded ($\text{Trust} = 30$).
  5. `ATTEMPTED_HARVEST`: OTP harvest attempt $\rightarrow$ **AUTO-FREEZE EXECUTED** ($\text{Trust} = 10$).
* **National Cyber Crime Reporting Portal (1930) Dossier**: Auto-generates complete evidence packets with target app SHA-256, C2 server IPs, and ready-to-file formal FIR draft text.
* **Multilingual AI Warnings**: Generates urgent plain Hindi / Hinglish warning alerts powered by Gemini 1.5 with deterministic offline fallback.

---

### 2. Mobile Shield & RAT Defense (`/components/edith/mobile-shield.tsx`)
* Evaluates 4 correlated attack flags:
  1. Active unknown voice call (`CALL_STATE_OFFHOOK`)
  2. Active screen mirroring / Remote desktop software (AnyDesk, TeamViewer, RustDesk)
  3. Sensitive foreground application (`com.phonepe.app`, `in.org.npci.upiapp`, banking screens)
  4. Sideloaded APK with active Accessibility Services (`BIND_ACCESSIBILITY_SERVICE`)
* **Zero-Trust Kill-Switch**: Drops trust score from $95 \rightarrow 15$, isolates virtual display stream, quarantines accessibility hooks, and enforces Android `FLAG_SECURE`.

---

### 3. Live Caller & SMS Threat Intelligence (`/components/edith/caller-radar.tsx`)
* **AI-Powered Caller ID**: Scans phone numbers and call transcripts/SMS body with Gemini 1.5 for urgency coercion, authority impersonation, and fraudulent payment prompts.
* **Sanchar Saathi & Chakshu Portal Integration**: Queries citizen complaint records in real-time ($87+$ complaints on electricity bill scammers, $64+$ on courier scams).
* **One-Click Reporting**: Dispatches citizen reports to the Department of Telecommunications (DoT) and returns live carrier disconnection reference IDs (e.g. `CK-2026-641290`).

---

### 4. Permission Black Box (`/components/edith/permission-black-box.tsx`)
* **Flight Data Recorder UI**: Tactical dark terminal with pulsing `ARMED / RECORDING` status.
* **Continuous Metrics**: 60-second rolling ring buffer, monotonic event counter (`#1,048,291`), and live eBPF system call hooks.
* **Section 65B Indian Evidence Act Forensic Bundle**: Instant export of cryptographically signed `.JSON` incident dossiers containing memory hashes, syscall traces, and legal authenticity certificates admissible in judicial proceedings.

---

### 5. Verifiable Consent Receipts (`/components/edith/consent-receipt.tsx`)
* **DPDP Act 2023 / ISO 27560 Verifiable Privacy Ledger**:
  * Tracks explicit purpose binding (e.g., *"Transactional SMS verification only"*).
  * Records data retention schedules, granted timestamps, and SHA-256 consent fingerprints.
  * **Instant Token Revocation**: Exercising Section 6(4) of the DPDP Act 2023 immediately wipes access tokens and records the audit mutation in the ledger.

---

### 6. Privacy Doppelganger (`/components/edith/privacy-doppelganger.tsx`)
* **Shadow Sandbox / Synthetic Persona Environment**:
  * **Real User Identity**: $1,280$ contacts encrypted with AES-GCM-256, real bank accounts protected by `FLAG_SECURE`.
  * **Doppelganger Canary Profile**: $154$ synthetic contacts, mock SBI statement balance of ₹140.50, spoofed GPS coordinates at *Agartala Airport (IXA), Tripura*.
* **Autonomous Decoy Emulation**: When active, untrusted sideloaded APKs probing the device are fed canary data and synthetic OTPs while genuine user credentials remain locked in the hardware vault.

---

### 7. Real-Time SSE Stream & External Webhook Ingestion
* **SSE Endpoint (`GET /api/stream-threats`)**: Unidirectional push stream delivering real-time telemetry, radar advances, and fraud alerts to connected dashboards.
* **Webhook Ingestion (`POST /api/webhook/device-event`)**: Ingests external device payloads from Android AppOps daemons or remote honeypots and broadcasts them over SSE.
* **Mobile Field Incident Transmitter (`GET /`)**: Lightweight mobile-optimized console accessible over Pinggy or ngrok tunnels, enabling remote smartphone testing with 1-tap presets.

---

## ⚖️ Indian Statutory Compliance & Legal Violation Mapping

| Statutory Law | Section | Legal Offense Covered by E.D.I.T.H. |
| :--- | :--- | :--- |
| **Bharatiya Nyaya Sanhita (BNS) 2023** | **Sec 318(4)** | Cheating and dishonestly inducing delivery of property (Online financial extortion) |
| **Bharatiya Nyaya Sanhita (BNS) 2023** | **Sec 319** | Cheating by personation (Impersonating Government RTO, Electricity Boards, or Police) |
| **Information Technology Act 2000** | **Sec 66D** | Cheating by personation using computer resource or mobile device |
| **Information Technology Act 2000** | **Sec 43/66** | Unauthorized data extraction, OTP scraping, spyware payload download & hacking |
| **DPDP Act 2023** | **Sec 6(1) & 6(4)** | Explicit purpose limitation & unconditional right to withdraw consent / wipe tokens |
| **Indian Evidence Act 1872 / BSA 2023** | **Sec 65B** | Admissibility of electronic records and cryptographic chain-of-custody certificate |

---

## 🚀 Quickstart & Setup

### 1. Prerequisites
- Node.js 18+ (tested on Node 20 / 22)
- npm or pnpm

### 2. Environment Configuration
Create `.env` in the root and in `/backend`:
```bash
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
```
*(Note: E.D.I.T.H. includes deterministic heuristic fallbacks for all AI models, ensuring 100% functionality even during offline testing or API rate-limits).*

### 3. Run Backend (Port 5000)
```bash
cd backend
npm install
node server.js
```

### 4. Run Frontend (Port 3000)
```bash
npm install
npm run dev
```

Visit the E.D.I.T.H. Command Center at **`http://localhost:3000`**.

---

## 📱 Mobile Field Testing via Pinggy / ngrok

To test live telemetry ingestion from an actual smartphone:
```bash
# Forward backend port 5000 through Pinggy
ssh -p 443 -R0:localhost:5000 a.pinggy.io
```
Open the generated HTTPS URL on your smartphone to access the **E.D.I.T.H. Field Incident Transmitter (`GET /`)**. Submitting an incident will immediately light up the Command Center dashboard over SSE!

---

## 🧪 Verification & Health Check

```bash
# Verify Next.js TypeScript Types
npx tsc --noEmit

# Run Production Turbopack Build
npm run build

# Test Backend Radar API
curl -X POST http://localhost:5000/api/radar/simulate-step
```

---

## 📜 License
Developed under MIT License for Hackathon demonstration.
*Disclaimer: Prototype telemetry simulator. Production deployment requires Android OEM / AppOps system privilege integration.*
