import path from "path"
// NOTE: Next.js automatically loads .env.local in dev/build.
// This is an extra safety net for local demos where the server is started in nonstandard ways.
// Requires: `npm i dotenv`
if (process.env.NODE_ENV !== "production") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const dotenv = require("dotenv")
    dotenv.config({ path: path.resolve(process.cwd(), ".env.local") })
  } catch {
    // ignore: dotenv not installed
  }
}

if (!process.env.OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY. Ensure it is set in .env.local or your environment.")
}

import OpenAI from "openai"
import crypto from "crypto"

export const runtime = "nodejs" // important for Next.js (don’t run on edge)

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

type Row = {
  infoType: string
  c: "Low" | "Moderate" | "High"
  i: "Low" | "Moderate" | "High"
  a: "Low" | "Moderate" | "High"
  justification: string
}

// Simple in-memory cache to keep demo outputs stable for identical inputs.
// Note: In serverless, this persists only while the instance is warm.
const DEMO_CACHE_TTL_MS = Number(process.env.FIPS199_DEMO_CACHE_TTL_MS ?? "3600000") // 1 hour
const demoCache = new Map<string, { at: number; payload: { rows: Row[] } }>()

function cacheKeyFor(model: string, combined: string) {
  return crypto
    .createHash("sha256")
    .update(`${model}\n---\n${combined}`)
    .digest("hex")
}

// Fixed demo catalog (controls allowed labels + stable ordering).
// Defaults are conservative “starter” values (often aligned to common NIST 800-60 patterns),
// and are elevated ONLY when explicit triggers appear in the provided context.
const INFO_TYPE_CATALOG: Array<{
  infoType: string
  base: { c: Row["c"]; i: Row["i"]; a: Row["a"] }
}> = [
  { infoType: "Public Facing Content", base: { c: "Low", i: "Moderate", a: "Moderate" } },
  { infoType: "User Account Data", base: { c: "Moderate", i: "Moderate", a: "Low" } },
  { infoType: "Authentication Credentials", base: { c: "High", i: "High", a: "Moderate" } },
  { infoType: "Access Control Lists", base: { c: "Moderate", i: "High", a: "Low" } },
  { infoType: "Audit Logs", base: { c: "Low", i: "Moderate", a: "Low" } },
  { infoType: "Security Monitoring Alerts", base: { c: "Moderate", i: "Moderate", a: "Moderate" } },
  { infoType: "System Configuration Data", base: { c: "Moderate", i: "High", a: "Moderate" } },
  { infoType: "Software Inventory", base: { c: "Low", i: "Moderate", a: "Low" } },
  { infoType: "Vulnerability and Patch Data", base: { c: "Moderate", i: "Moderate", a: "Moderate" } },
  { infoType: "Incident Response Records", base: { c: "Moderate", i: "Moderate", a: "Moderate" } },
  { infoType: "Risk Assessments", base: { c: "Moderate", i: "Moderate", a: "Low" } },
  { infoType: "Control Implementation Evidence", base: { c: "Moderate", i: "Moderate", a: "Low" } },
  { infoType: "System Security Plan Data", base: { c: "Moderate", i: "Moderate", a: "Low" } },
  { infoType: "Security Assessment Results", base: { c: "Moderate", i: "Moderate", a: "Low" } },
  { infoType: "Plan of Action and Milestones", base: { c: "Moderate", i: "Moderate", a: "Low" } },
  { infoType: "PII", base: { c: "Moderate", i: "Moderate", a: "Low" } },
  { infoType: "PHI", base: { c: "High", i: "Moderate", a: "Low" } },
  { infoType: "Financial Transactions", base: { c: "Moderate", i: "Moderate", a: "Moderate" } },
  { infoType: "Payment Card Data", base: { c: "High", i: "Moderate", a: "Low" } },
  { infoType: "Case Management Records", base: { c: "Moderate", i: "Moderate", a: "Moderate" } },
  { infoType: "Service Requests and Tickets", base: { c: "Low", i: "Moderate", a: "Moderate" } },
  { infoType: "Operational Reports", base: { c: "Low", i: "Moderate", a: "Moderate" } },
  { infoType: "Data Exports", base: { c: "Moderate", i: "Moderate", a: "Low" } },
  { infoType: "External Interfaces", base: { c: "Low", i: "High", a: "Moderate" } },
]

const CATALOG_INDEX = new Map(INFO_TYPE_CATALOG.map((x, idx) => [x.infoType.toLowerCase(), idx]))
const CATALOG_DEFAULTS = new Map(INFO_TYPE_CATALOG.map((x) => [x.infoType.toLowerCase(), x.base]))


function detectTriggers(text: string) {
  const t = text.toLowerCase()
  return {
    // Regulated / sensitive data indicators
    phi: /(phi|hipaa|medical|health record|patient|clinical|diagnosis|treatment)/i.test(t),
    pci: /(pci|payment card|credit card|debit card|cardholder|cvv|pan\b)/i.test(t),
    pii: /(pii|ssn|social security|date of birth|dob|driver'?s license|passport|taxpayer)/i.test(t),

    // High availability / life safety / mission critical
    lifeSafety: /(life safety|emergency|911|dispatch|public safety|critical care|hospital|first responder)/i.test(t),
    missionCritical: /(mission[-\s]?critical|24\/?7|high availability|real[-\s]?time operations|critical infrastructure)/i.test(t),

    // National security / law enforcement sensitive
    natSec: /(national security|classified|secret|top secret|cui|law enforcement sensitive|investigation)/i.test(t),
  }
}

function isLikelySystemDescription(text: string) {
  const t = text.toLowerCase().trim()
  if (!t) return false

  // Very short inputs are usually noise.
  if (t.length < 40) return false

  // Require at least one "system/app" indicator.
  const systemIndicators = [
    "system",
    "application",
    "app",
    "platform",
    "service",
    "portal",
    "website",
    "api",
    "database",
    "data",
    "users",
    "records",
    "workflow",
    "process",
    "intake",
    "case",
    "grant",
    "health",
    "surveillance",
    "report",
    "dashboard",
    "authenticate",
    "login",
    "access",
  ]

  const indicatorHits = systemIndicators.reduce((acc, w) => (t.includes(w) ? acc + 1 : acc), 0)

  // Also require some descriptive structure (not just a single noun/phrase).
  const hasSentenceLikeStructure = /\b(does|supports|manages|tracks|stores|processes|collects|provides|allows|enables|uses)\b/.test(t)

  // If it looks like a food / joke prompt, fail fast.
  const obviousJunk = /\b(cheeseburger|hamburger|pizza|taco|fries|ice cream|lol|asdf|qwerty)\b/.test(t)

  if (obviousJunk) return false

  return indicatorHits >= 2 || (indicatorHits >= 1 && hasSentenceLikeStructure)
}

function elevateToHighIf(current: Row["c"], cond: boolean): Row["c"] {
  return cond ? "High" : current
}

function applyRubric(infoType: string, base: { c: Row["c"]; i: Row["i"]; a: Row["a"] }, triggers: ReturnType<typeof detectTriggers>) {
  let c = base.c
  let i = base.i
  let a = base.a
  let justification = ""

  // Deterministic, explicit-trigger elevations.
  // Credentials are always High/High by default (already in base).

  if (infoType.toLowerCase() === "phi") {
    // PHI is inherently highly sensitive.
    c = "High"
  }

  if (infoType.toLowerCase() === "payment card data") {
    c = "High"
  }

  if (infoType.toLowerCase() === "pii") {
    // PII typically warrants at least Moderate confidentiality; elevate only when explicitly indicated.
    c = elevateToHighIf(c, triggers.pii && triggers.natSec)
  }

  // System-wide explicit high-impact drivers.
  if (triggers.natSec) {
    // Conservative: national security / investigations can elevate confidentiality & integrity.
    c = "High"
    i = elevateToHighIf(i, true)
  }

  if (triggers.lifeSafety) {
    // Life safety: availability and integrity are critical.
    a = "High"
    i = elevateToHighIf(i, true)
  } else if (triggers.missionCritical) {
    a = "High"
  }

  // If we elevated any value to High beyond its base, add justification.
  if (c !== base.c || i !== base.i || a !== base.a) {
    const reasons: string[] = []
    if (triggers.lifeSafety) reasons.push("life-safety or emergency operations")
    if (triggers.missionCritical) reasons.push("mission-critical / high-availability requirements")
    if (triggers.natSec) reasons.push("national security or investigative sensitivity")
    if (infoType.toLowerCase() === "phi") reasons.push("regulated health information")
    if (infoType.toLowerCase() === "payment card data") reasons.push("regulated payment card data")

    const reasonText = reasons.length ? reasons.join(", ") : "explicit user-stated conditions"
    justification = `CIA values were elevated based on ${reasonText} described in the provided context. These impacts reflect the potential mission consequences of loss of confidentiality, integrity, or availability for this information type.`
  }

  return { c, i, a, justification }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const description = String(body?.description ?? "").slice(0, 7000)
    const fileText = body?.fileText ? String(body.fileText).slice(0, 7000) : ""
    const combined = [description, fileText].filter(Boolean).join("\n\n---\n\n")

    if (!combined.trim()) {
      return Response.json(
        { error: "Please enter a short system description." },
        { status: 400 },
      )
    }

    // Guardrail: landing-page demo expects an information system description.
    // If the input is noise (e.g., "I want a cheeseburger"), return a friendly 400.
    if (!isLikelySystemDescription(combined)) {
      return Response.json(
        {
          error:
            "Please describe an information system (what it does, what mission it supports, and what data it handles). For the demo, avoid jokes/noise and use a short sanitized system description.",
        },
        { status: 400 },
      )
    }

    const model = process.env.OPENAI_FIPS199_MODEL || "gpt-5-mini" // configurable

    const system = `
You are GS360-FIPS199, an assistant for the GovSecurity360 (GS360) platform specializing in FIPS 199 security categorization and downstream impacts (FIPS 200, NIST SP 800-53 baseline selection, SSP/SAR/POA&M alignment).

IMPORTANT (Landing-page demo context):
- You ONLY have what the user types into the text box and optional uploaded file text (if provided). There is NO GS360 questionnaire context available in this demo.
- Treat user-provided context and file text as supporting evidence only; do not assume it is correct. Make conservative, reasonable inferences from the stated mission/business purpose.
- Do not invent facts about the system; if something is unknown, keep CIA impacts conservative.

Your purpose:
- Help users determine or validate a system’s Confidentiality, Integrity, Availability (CIA) impact levels (Low/Moderate/High).
- Auto-generate an initial FIPS 199 “Information Types” table by compiling likely information types the system processes/stores/transmits and assigning NIST-guided CIA impacts per information type.
- Where appropriate, elevate a CIA value ONLY when the system context strongly justifies it.

Behavior and constraints:
- Stay within GS360 security/compliance context.

DEMO MODE (strict, low-creativity):
- You MUST choose information types ONLY from the fixed catalog below. Do NOT invent new information types.
- Selection procedure (deterministic):
  1) Read the user’s description (and file text if present).
  2) Select the FIRST 10 entries (in the order listed) that are clearly relevant to the described system.
  3) If fewer than 10 are relevant, continue selecting the next entries from the top of the catalog until you have exactly 10.
  4) Do NOT reorder the selected items. Do NOT output duplicates.

CIA values:
- Use the CIA defaults for each catalog label.
- ONLY elevate a value to High if the user explicitly states high-impact conditions (life safety/emergency operations, national security/investigations, regulated data like PHI/PCI in scope).
- Otherwise do not deviate from defaults.

Information Type formatting (strict):
- \`infoType\` MUST be ONLY the catalog label (exact spelling).
- Do NOT append example lists or clarifying details.
- Do NOT use dash separators in \`infoType\`.
- Avoid commas in \`infoType\`.

Justification:
- Always include "justification" as a string.
- Default to an empty string.
- Only add justification when you elevated any CIA value to High; write 2–4 sentences tying it to explicit user context.

FIXED CATALOG (use ONLY these labels; keep exact labels):
1) Public Facing Content
2) User Account Data
3) Authentication Credentials
4) Access Control Lists
5) Audit Logs
6) Security Monitoring Alerts
7) System Configuration Data
8) Software Inventory
9) Vulnerability and Patch Data
10) Incident Response Records
11) Risk Assessments
12) Control Implementation Evidence
13) System Security Plan Data
14) Security Assessment Results
15) Plan of Action and Milestones
16) PII
17) PHI
18) Financial Transactions
19) Payment Card Data
20) Case Management Records
21) Service Requests and Tickets
22) Operational Reports
23) Data Exports
24) External Interfaces
`

    const key = cacheKeyFor(model, combined)
    const cached = demoCache.get(key)
    if (cached && Date.now() - cached.at < DEMO_CACHE_TTL_MS) {
      return Response.json(cached.payload)
    }

    const resp = await client.responses.create({
      model,
      store: false,
      prompt_cache_key: key,
      input: [
        { role: "system", content: system },
        { role: "user", content: combined },
      ],
      text: {
        format: {
          name: "fips199_rows",
          type: "json_schema",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              rows: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    infoType: { type: "string" },
                    c: { type: "string", enum: ["Low", "Moderate", "High"] },
                    i: { type: "string", enum: ["Low", "Moderate", "High"] },
                    a: { type: "string", enum: ["Low", "Moderate", "High"] },
                    justification: { type: "string" },
                  },
                  required: ["infoType", "c", "i", "a", "justification"],
                },
              },
            },
            required: ["rows"],
          },
        },
      },
    })

    const text = (resp as any).output_text ?? ""
    let parsed: any
    try {
      parsed = text ? JSON.parse(text) : null
    } catch {
      return Response.json(
        { error: "Model returned an unexpected format. Please try again." },
        { status: 502 },
      )
    }

    const rows: Row[] = Array.isArray(parsed?.rows) ? parsed.rows : []

    const triggers = detectTriggers(combined)
    const seen = new Set<string>()

    const normalized = rows
      .map((r: any) => ({
        infoType: (() => {
          const raw = String(r.infoType ?? "")
          // If the model included an example clause after a dash (e.g., "PII – SSNs, DOB"), drop that suffix.
          const cut = raw.split(/\s[-–—]\s/)[0]
          // Remove any remaining dash characters.
          const cleaned = cut.replace(/[-–—]/g, " ")

          // Humanize: add spaces for camelCase/PascalCase and underscores.
          const withSpaces = cleaned
            .replace(/_/g, " ")
            // split: "abcDef" -> "abc Def"
            .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
            // split: "APIResponse" -> "API Response"
            .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")

          return withSpaces.replace(/\s+/g, " ").trim().slice(0, 80)
        })(),
        // CIA values are computed server-side from catalog defaults + explicit trigger rules.
        c: "Moderate" as const,
        i: "Moderate" as const,
        a: "Low" as const,
        justification: "",
      }))
      .filter((r: any) => r.infoType)
      .filter((r: any) => {
        const k = String(r.infoType).toLowerCase()
        if (seen.has(k)) return false
        seen.add(k)
        return true
      })

    if (normalized.length === 0) {
      return Response.json({ error: "AI returned no rows." }, { status: 502 })
    }

    // Keep only catalog-known labels; order deterministically; fill to exactly 10.
    const onlyCatalog = normalized.filter((r) => CATALOG_DEFAULTS.has(r.infoType.toLowerCase()))

    const sorted = [...onlyCatalog].sort((a, b) => {
      const ai = CATALOG_INDEX.get(a.infoType.toLowerCase()) ?? 9999
      const bi = CATALOG_INDEX.get(b.infoType.toLowerCase()) ?? 9999
      return ai - bi
    })

    const picked: string[] = []
    for (const r of sorted) {
      if (picked.length >= 10) break
      picked.push(r.infoType)
    }

    if (picked.length < 10) {
      for (const entry of INFO_TYPE_CATALOG) {
        if (picked.length >= 10) break
        const exists = picked.some((x) => x.toLowerCase() === entry.infoType.toLowerCase())
        if (exists) continue
        picked.push(entry.infoType)
      }
    }

    const finalRows: Row[] = picked.slice(0, 10).map((label) => {
      const base = CATALOG_DEFAULTS.get(label.toLowerCase())!
      const { c, i, a, justification } = applyRubric(label, base, triggers)
      return { infoType: label, c, i, a, justification }
    })

    const payload = { rows: finalRows }
    demoCache.set(key, { at: Date.now(), payload })
    return Response.json(payload)
  } catch (e: any) {
    // Surface useful details during local dev.
    console.error("/api/fips199-demo error:", e)

    // If this is an OpenAI API error, it often includes an HTTP status and a structured payload.
    const status =
      typeof e?.status === "number"
        ? e.status
        : typeof e?.response?.status === "number"
          ? e.response.status
          : 500

    const details =
      e?.error?.message ||
      e?.response?.data?.error?.message ||
      e?.message ||
      "Server error."

    return Response.json(
      {
        error: String(details),
      },
      { status },
    )
  }
}