# E.D.I.T.H. — Sovereign Mobile Cyber-Defense & Anti-Scam Command Center
> **E**arly **D**etection, **I**solation &amp; **T**elemetry **H**oneypot  
> *Deterministic, In-Browser Endpoint Defense against WhatsApp/SMS Sideload Scams in India*

---

## 🛡️ 1. What is E.D.I.T.H.?

**E.D.I.T.H.** is a client-side, zero-login, privacy-preserving mobile cyber-defense command center prototype. It demonstrates how autonomous behavioral guardrails on Android smartphones can detect, isolate, and neutralize weaponized sideloaded APKs **before** a victim's one-time password (OTP) or bank credentials are stolen.

- **100% In-Browser & Simulated:** Runs entirely in your browser using deterministic TypeScript state. No login, no tracking, no external backend required, and no telemetry collected or transmitted anywhere.
- **Transparent Mathematical Scoring:** Trust is a pure arithmetic function derived from 9 transparent behavioral risk rules (`lib/riskEngine.ts`). Zero black-box AI hallucination.
- **Bilingual Warning & Autonomous Containment:** Evaluates intent mismatch, triggers OEM-style app freeze when risk reaches $\ge 70$, injects honeypot canary data, and prepares a cryptographically hashed Section 63 BSA forensic evidence bundle for reporting to the National Cyber Crime Portal (1930).

---

## ⚡ 2. The Threat: The WhatsApp APK Scam Epidemic

In India, cyber syndicates bypass Google Play Protect not through zero-day operating system exploits, but through urgent social engineering delivered over WhatsApp and SMS:

1. **Urgent Threat Lure:** The victim receives a message threatening immediate electricity disconnection, an unpaid court-date traffic challan, or a suspended bank KYC.
2. **Coerced Sideloading:** The victim is instructed to install a custom APK (`RTO-Challan-Pay.apk` or `Electricity-Update.apk`) sent directly as a WhatsApp file attachment or third-party download link.
3. **Privilege Escalation:** Upon installation, the app requests high-privilege Android permissions: `READ_SMS`, `BIND_ACCESSIBILITY_SERVICE`, and `REQUEST_INSTALL_PACKAGES`.
4. **Rapid Kill-Chain Harvest:** Within seconds of approval, the rogue application conceals its launcher icon (preventing uninstallation), begins bulk-scraping SMS inboxes (>10x baseline), and beacons out to offshore Command-and-Control (C2) servers.

Traditional mobile antiviruses rely on static signature matching and fail against freshly re-packed APKs. **E.D.I.T.H. stops the attack by monitoring behavioral anomalies dynamically.**

---

## 📱 3. Virtual Phone: SMS Shield (`lib/smsEngine.ts`)

A dedicated simulated mobile inbox that analyzes incoming SMS lures **before** any application is sideloaded. It evaluates messages through an animated 5-step heuristic pipeline (~600ms per step):

1. **Step 1: Sender Header Check:** Validates 6-character TRAI DLT commercial headers (e.g. `AX-DEMOBK`, `VM-PARIVA`, `AD-SBIINB`). Flags plain 10-digit mobile numbers claiming bank, RTO, or government identity (`+25 pts`).
2. **Step 2: URL & Domain Analysis:** Checks against sovereign allowlists (`.gov.in`, `.nic.in`) using precise suffix matching (`gov.in.evil.com` fails). Identifies lookalike domains (`+35 pts`), URL shorteners (`+20 pts`), insecure HTTP (`+10 pts`), and high-abuse TLDs (`.top`, `.xyz`, `.click`, `+15 pts`).
3. **Step 3: Urgency & Coercive Content:** Detects panic keywords in English and Hinglish (`immediately`, `blocked`, `arrest`, `giraftari`, `abhi`, `turant`, `+15 pts`) and digital arrest / credential demands (`+20 to +25 pts`). Differentiates legitimate "do not share" OTP advisories (which remain 0 pts / Green).
4. **Step 4: Executable / APK Attachment Scan:** Flags direct links to `.apk` files or instructions to sideload an app (`+40 pts`).
5. **Step 5: Synthesized Verdict & Forensics:** Categorizes risk into **Likely scam** ($\ge 60$, Red), **Suspicious** ($30-59$, Amber), or **Looks safe** ($< 30$, Green), providing defanged links (`hxxp://example[.]top`), bilingual warnings, and an action button: **"User installs the app anyway &rarr; Run Kill-Chain"**.

---

## 📋 4. Instant Cyber Fraud Complaint Kit (`lib/complaintEngine.ts`)

A zero-latency, 100% in-browser legal drafting engine that transforms detected cyber threats into a structured **"Cyber Fraud Complaint Draft"** ready for submission to the National Cyber Crime Reporting Portal (`cybercrime.gov.in`), `1930`, or `Chakshu`:

- **Sub-Second Generation:** Measures and displays exact compilation time (`Ready in 0.04s` via `performance.now()`).
- **Two Instant Questions:** Assesses financial loss (No / Yes) and app installation (No / Yes / N/A).
- **Rule-Based Crime Classification:**
  - `apk_malware`: IT Act § 43, § 66, § 66C, § 66D; BNS § 318(4), § 319(2)
  - `govt_impersonation`: BNS § 204, § 318(4), § 319(2), § 351; IT Act § 66C, § 66D
  - `phishing_kyc`: IT Act § 66C, § 66D; BNS § 318(4), § 319(2)
  - `extortion`: BNS § 308(2), § 351; IT Act § 66E
  - `job_investment`: IT Act § 66D; BNS § 318(4)
- **Emergency Safeguard Routing:**
  - *If money was lost:* Immediate 1930 dialer hook + bank alert protocol + cybercrime.gov.in.
  - *If no money lost:* Carrier disconnection route via Chakshu (Sanchar Saathi).
  - *If app was installed:* 5 mandatory sanitization steps (uninstall, revoke Accessibility, reset PINs).
- **Four Export Modes:**
  - **Download PDF:** Triggered via `window.print()` with a dedicated print stylesheet printing only the clean draft in black-and-white.
  - **Download .TXT:** Instant local file download via browser `Blob`.
  - **Copy for Portal:** Copies a clean plain-text summary formatted for online description text boxes.
  - **Direct Portal Links:** Opens the respective portal in a new tab.

---

## ⏱️ 5. How the 25-Second Attack Simulation Works

Clicking **"Run Attack Simulation"** runs a scripted 5-stage attack kill-chain over 25 seconds:

| Stage | Name | Elapsed | Behavioral Activity | E.D.I.T.H. Defensive Action |
| :--- | :--- | :--- | :--- | :--- |
| **Stage 1** | **Lure Received** | `T + 0s` | SMS/WhatsApp lure received from `+91 98765 43210` with fake APK link. | Flagged as unverified 10-digit sender (TRAI DLT mismatch). |
| **Stage 2** | **Unknown Install** | `T + 5s` | `rto-challan` installed directly from a WhatsApp file attachment. | Source evaluated: `WhatsApp file (+25 pts)`. Status moves to **Watching**. |
| **Stage 3** | **Risky Permissions** | `T + 10s` | App requests `READ_SMS (+30 pts)` &amp; `BIND_ACCESSIBILITY_SERVICE (+30 pts)`. | Intent mismatch alert triggered. Risk hits **85**, status moves to **Suspicious/Frozen**. |
| **Stage 4** | **Hidden Behavior** | `T + 15s` | App disables its launcher icon (`+20 pts`) and beacons to unindexed domain (`+10 pts`). | Stealth evasion detected. Trust score plunges to **0**. |
| **Stage 5** | **Auto-Freeze** | `T + 20s` | App attempts bulk query (212 SMS in 4s, `+25 pts`). Total Risk: **100/100**. | **CONTAINMENT ACTIVATED**: Process isolated, permissions revoked, canary data fed, SHA-256 evidence packet locked. |

---

## 📐 6. Transparent Weighted Risk Engine (`lib/riskEngine.ts`)

Every score is derived transparently by `evaluateAppRisk(app)`:

$$\text{Total Risk} = \sum \text{Triggered Rule Points}$$
$$\text{Trust Score} = \max(0, \min(100, 100 - \text{Total Risk}))$$

### Status Thresholds
- **Risk < 40:** `Trusted` (Green)
- **Risk 40–69:** `Watching / Suspicious` (Amber)
- **Risk $\ge$ 70:** `Frozen` (Auto-Containment, Rose/Red)

### The 9 Behavioral Rules
| Rule Identifier | Violation | Points | Trigger Logic |
| :--- | :--- | :---: | :--- |
| `UNTRUSTED_INSTALL_SOURCE` | Installed from WhatsApp / Sideload | **+25** | Installer source $\neq$ Google Play Protect |
| `IMPERSONATES_BRAND` | Impersonates State / Bank Brand | **+10** | Declares official branding without signed key |
| `UNEXPECTED_SMS` | Unexpected SMS Access Scope | **+30** | `READ_SMS` requested by non-SMS/banking app |
| `UNEXPECTED_ACCESSIBILITY` | Unexpected Accessibility Hook | **+30** | `BIND_ACCESSIBILITY_SERVICE` requested |
| `UNEXPECTED_INSTALL_PACKAGES` | Secondary Dropper Capability | **+20** | `REQUEST_INSTALL_PACKAGES` requested |
| `UNEXPECTED_NOTIFICATION_LISTENER`| Notification Scraper Hook | **+15** | `BIND_NOTIFICATION_LISTENER` requested |
| `BULK_SMS_READ_SPIKE` | Bulk SMS Harvest (>10x baseline) | **+25** | $\ge 200$ SMS queries in $<10$ seconds |
| `HIDES_APP_ICON` | Conceals Launcher Icon | **+20** | Main launcher activity component disabled |
| `CONTACTS_NEW_DOMAIN` | Post-Grant C2 Domain Beacons | **+10** | Immediate outbound socket to unindexed IP |

---

## 🚀 7. Getting Started & Running Locally

This project runs 100% locally with zero external configuration or backend requirements.

### Prerequisites
- Node.js 18+ or 20+
- npm or pnpm

### Quickstart
```bash
# Clone the repository
git clone https://github.com/souvikhaldar/edith-hackathon.git
cd edith-hackathon

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```

Open your browser and navigate to **`http://localhost:3000`**.

---

## 🎬 8. 2-Minute Judge Walkthrough

1. **Virtual Phone: SMS Shield (Top Section):**
   - Select **Sample A: Electricity / RTO Challan APK Scam** from the dropdown and click **Receive**.
   - Watch the animated 5-step heuristic pipeline scan the message (~600ms per step).
   - Observe the Red **Likely scam** verdict (Score 100/100), the defanged link (`hxxp://parivahan-echallan[.]top/RTO_Challan.apk`), and the bilingual warning.
   - Click **"Generate Complaint Kit"** to instantly generate a printable Section 63 BSA draft, or click **"User installs the app anyway &rarr; Run Kill-Chain"**.
2. **Live Attack Demo (Bottom Section):**
   - Watch the attack launch smoothly into Stage 1 (Lure received via SMS).
   - Observe the 5-stage stepper advance every 5 seconds.
   - Watch the animated trust score ring for **RTO Challan QuickPay** drop from 100 &rarr; 75 &rarr; 15 &rarr; 0.
   - Expand the **"Why this score?"** accordion on the RTO card to see each rule firing with exact points.
   - Note the bilingual emergency warning banner and the browser-computed SHA-256 evidence packet hash.
   - Click **"Generate Complaint Kit"** directly from the containment card.
3. **Cyber Fraud Complaint Kit Modal:**
   - See the generation time: `Ready in 0.04s` (measured dynamically).
   - Select "Did you lose money?" and "Did you install the app?" to watch safety steps and legal sections update in real time.
   - Click **"Download PDF"** (clean black-and-white print sheet), **"Download .txt"**, or **"Copy text for portal"**.
4. **Incident Black Box:**
   - Navigate via the sidebar to **Incident Black Box**.
   - Review the 60-second rolling telemetry buffer showing the initial SMS lure, permissions, and "KIT GENERATED" audit log.
   - Click **"Export Evidence Log (.JSON)"** to download the Section 63 BSA evidence bundle with embedded browser SHA-256 hash.
5. **Consent Ledger:**
   - View all installed apps and their granted permissions.
   - Observe **RTO Challan** marked as `Frozen by E.D.I.T.H. (Score 0)`.
   - Click **"Revoke"** or **"Restore"** on any app to see its trust score recalculate live.
6. **Privacy Doppelganger:**
   - Toggle **"Serve decoy data to frozen apps"**.
   - See the side-by-side comparison: Real user identity (masked &amp; protected) vs Decoy data served to the scraper (154 canary contacts, &#8377;140 fake wallet balance).
7. **About E.D.I.T.H.:**
   - Review the complete problem statement, full rules table, and the Phase 1 vs Phase 2 roadmap.

---

## 📱 9. How This Works on a Real Phone (Roadmap)

### Phase 1: Pure User-Space App (Deployable Today)
- Operates on standard, unmodified Android devices without root.
- Uses Android `PackageInstaller` callbacks to detect APKs installed from WhatsApp or browser folders.
- Displays high-contrast bilingual friction overlays before users grant risky permissions.
- Monitors query volume anomalies via `ContentObserver` to detect mass SMS reads.
- Compiles a tamper-evident Section 63 BSA incident log ready for submission to the 1930 portal.

### Phase 2: OEM / Telco / OS Integration (Sovereign OS Partner)
- Built directly into Android system ROMs (AOSP / BharOS / OEM firmware) with `MANAGE_APP_OPS_MODES` privileges.
- Autonomous kernel kill-switch (`AppOpsManager.setMode` + `SIGSTOP`) to isolate rogue apps instantly.
- Injects synthetic honeypot data at the Binder IPC boundary instead of null-pointer crashes.
- Direct telco SIM baseband cross-verification of TRAI commercial headers before messages reach the inbox.

*This prototype simulates the device and shows what both phases would do.*

---

## 🔒 10. Privacy & Sovereign Guarantee

- **No User Login:** No account, password, or registration required.
- **No Data Collection:** Zero analytics, telemetry, or user inputs leave your machine.
- **Open Source:** Available under the [MIT License](LICENSE) for independent review.
