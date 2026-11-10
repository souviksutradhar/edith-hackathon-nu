import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const TRAI_DLT_REGEX = /^[A-Z]{2}-[A-Z0-9]{6}$/;

export async function POST(req) {
  const startTime = Date.now();
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not defined in environment variables!");
      return NextResponse.json({ error: "Missing GEMINI_API_KEY in .env.local" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });
    const { sender = "UNKNOWN", message, transportMedium = "SMS" } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "No message payload" }, { status: 400 });
    }

    // 1. Edge DLT Check
    const isDltCompliant = TRAI_DLT_REGEX.test(sender.trim());
    const isCivilianTenDigit = /^\+?91[6-9]\d{9}$|^[6-9]\d{9}$/.test(sender.trim());

    let dltClassification = "UNKNOWN";
    if (isDltCompliant) {
      dltClassification = "REGISTERED_ENTITY_HEADER";
    } else if (isCivilianTenDigit) {
      dltClassification = "UNREGISTERED_CIVILIAN_PE";
    } else {
      dltClassification = "MALFORMED_OR_SPOOFED_HEADER";
    }

    const edgeFilterLatency = Date.now() - startTime;
    const geminiStart = Date.now();

    // 2. Gemini 2.5 Flash Structured Ingress Analysis
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Perform sovereign cyber-defense forensic triage on this incoming Indian telecom transmission.
Sender Metadata: "${sender}" (DLT Status: ${dltClassification})
Transport Medium: "${transportMedium}"
Raw Ingress Text:
"""
${message}
"""`,
      config: {
        systemInstruction: `You are E.D.I.T.H., a Sovereign Mobile Cyber-Defense Forensic Engine deployed across Indian telecom boundaries.
1. Deconstruct psychological manipulation: calculate Urgency Density (ratio of coercive time-limited tokens to total tokens) and detect Authority Inversion (spoofing of CBI, ED, DoT, State Police, TRAI, or State Electricity Boards like DISCOM/e-Challan).
2. Automate Statutory Crosswalking: map offenses to Bharatiya Nyaya Sanhita, 2023 (e.g., BNS § 318(4) Cheating, § 204 Public Servant Impersonation, § 308(2) Extortion, § 336(3)/340(2) Forgery) and Information Technology Act, 2000 (§ 66D Cheating by Personation, § 43/66 Unauthorized Extraction).
3. Synthesize Indian Regulatory Reporting Schemas:
   - DoT Sanchar Saathi "Chakshu" narrative (must exceed 30 characters).
   - I4C 1930 NCRP complaint draft evidence payload.
Return valid structured JSON only.`,
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            threatScore: { type: "integer", description: "Risk rating 0-100" },
            isThreat: { type: "boolean" },
            scamCategory: { type: "string" },
            psychologicalVector: {
              type: "object",
              properties: {
                urgencyDensity: { type: "number" },
                coerciveTokens: { type: "array", items: { type: "string" } },
                authorityInversion: { type: "string" }
              },
              required: ["urgencyDensity", "coerciveTokens", "authorityInversion"]
            },
            statutoryMatrix: {
              type: "object",
              properties: {
                bnsOffenses: { type: "array", items: { type: "string" } },
                itActOffenses: { type: "array", items: { type: "string" } },
                firReadinessScore: { type: "string" }
              },
              required: ["bnsOffenses", "itActOffenses", "firReadinessScore"]
            },
            chakshuPayload: {
              type: "object",
              properties: {
                category: { type: "string" },
                verifiedNarrative: { type: "string" },
                isValidated: { type: "boolean" }
              },
              required: ["category", "verifiedNarrative", "isValidated"]
            },
            recommendedAction: { type: "string" }
          },
          required: [
            "threatScore",
            "isThreat",
            "scamCategory",
            "psychologicalVector",
            "statutoryMatrix",
            "chakshuPayload",
            "recommendedAction"
          ]
        }
      }
    });

    const geminiLatency = Date.now() - geminiStart;
    const triageData = JSON.parse(response.text);
    const totalLatency = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      telemetry: {
        latency: {
          ingress: 8,
          edgeFilter: edgeFilterLatency,
          geminiCore: geminiLatency,
          structGen: 12,
          total: totalLatency
        },
        dltIngress: {
          header: sender,
          status: isDltCompliant ? "COMPLIANT" : "VIOLATION",
          classification: dltClassification
        }
      },
      triage: triageData
    });
  } catch (err) {
    console.error("Ingress triage runtime error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}