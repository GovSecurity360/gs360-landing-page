import path from "path"
import crypto from "crypto"
import OpenAI from "openai"
import { SP800_60_SERVICE_LABELS } from "../../../lib/sp80060_services"

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

export const runtime = "nodejs" // important for Next.js (don’t run on edge)

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

type ImpactLevel = "Low" | "Moderate" | "High"

type Row = {
  infoType: string
  c: ImpactLevel
  i: ImpactLevel
  a: ImpactLevel
  justification: string
}

type SystemCategory = {
  confidentiality: ImpactLevel
  integrity: ImpactLevel
  availability: ImpactLevel
}

// Simple in-memory cache to keep demo outputs stable for identical inputs.
// Note: In serverless, this persists only while the instance is warm.
const DEMO_CACHE_TTL_MS = Number(process.env.FIPS199_DEMO_CACHE_TTL_MS ?? "3600000") // 1 hour
const demoCache = new Map<
  string,
  { at: number; payload: { rows: Row[]; systemCategory: SystemCategory } }
>()

function cacheKeyFor(model: string, combined: string) {
  return crypto
    .createHash("sha256")
    .update(`${model}\n---\n${combined}`)
    .digest("hex")
}

function impactRank(x: ImpactLevel): number {
  return x === "Low" ? 1 : x === "Moderate" ? 2 : 3
}

function maxImpact(a: ImpactLevel, b: ImpactLevel): ImpactLevel {
  return impactRank(a) >= impactRank(b) ? a : b
}

function computeSystemCategory(rows: Row[]): SystemCategory {
  // FIPS 199 high-water mark: system objective impact is the highest among the info types.
  let confidentiality: ImpactLevel = "Low"
  let integrity: ImpactLevel = "Low"
  let availability: ImpactLevel = "Low"

  for (const r of rows) {
    confidentiality = maxImpact(confidentiality, r.c)
    integrity = maxImpact(integrity, r.i)
    availability = maxImpact(availability, r.a)
  }

  return { confidentiality, integrity, availability }
}

function normalizeLabel(s: string) {
  return String(s)
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[\u2019']/g, "'")
    .replace(/[^a-z0-9\s:]/g, "")
    .trim()
}

const SERVICE_LABELS: readonly string[] = SP800_60_SERVICE_LABELS as unknown as readonly string[]

// Map normalized -> canonical Service label for robust matching (case/punct/spacing tolerant)
const SERVICE_CANONICAL_BY_NORM = (() => {
  const m = new Map<string, string>()
  for (const svc of SERVICE_LABELS) {
    const k = normalizeLabel(svc)
    if (!m.has(k)) m.set(k, svc)
  }
  return m
})()

function coerceImpactLevel(x: any): ImpactLevel {
  const s = String(x ?? "").trim().toLowerCase()
  if (s === "low") return "Low"
  if (s === "moderate") return "Moderate"
  if (s === "high") return "High"
  return "Low"
}

function coerceServiceLabel(x: any): string {
  const raw = String(x ?? "").trim()
  if (!raw) return ""

  // Preserve Custom: prefix if provided.
  const isCustom = /^custom\s*:/i.test(raw)
  if (isCustom) {
    const rest = raw.replace(/^custom\s*:/i, "").trim()
    return rest ? `Custom: ${rest.slice(0, 120)}` : ""
  }

  // Try exact canonical match via normalized key.
  const norm = normalizeLabel(raw)
  const canonical = SERVICE_CANONICAL_BY_NORM.get(norm)
  if (canonical) return canonical

  // If not an exact service label, treat it as Custom.
  return `Custom: ${raw.slice(0, 120)}`
}

function isLikelySystemDescription(text: string) {
  const t = text.toLowerCase().trim()
  if (!t) return false
  // Very short inputs are usually noise.
  if (t.length < 8) return false

  // If it looks like noise, fail fast.
  // IMPORTANT: Do not block legitimate systems that happen to mention food/products.
  const hardNoise = /\b(asdf|qwerty|lorem\s*ipsum|test\s*test|blah\s*blah)\b/i.test(t)
  if (hardNoise) return false

  // Soft noise: jokes / meme-y fillers / food cravings. Only reject if there's no system intent.
  const softNoise =
    /\b(lol|lmao|rofl|knock\s*knock|tell\s*me\s*a\s*joke|make\s*me\s*a\s*sandwich|cheeseburger|hamburger|pizza|taco|fries|ice\s*cream|hot\s*dog|donut|burrito)\b/i.test(
      t,
    )

  const hasSystemIntent =
    /\b(system|software|app|application|platform|service|website|site|portal|api|tool|dashboard|database|build|create|develop|design|implement|manage|track|store|process|collect|provide|allow|enable|sell|order|checkout|cart|payment|inventory|catalog|customers?)\b/i.test(
      t,
    )

  if (softNoise && !hasSystemIntent) return false

  // Still treat certain ultra-generic single words as noise.
  const tooGeneric = /^\s*(hi|hello|hey|ok|okay|yes|no|maybe|cool|nice|thanks|thank\s*you)\s*$/i.test(t)
  if (tooGeneric) return false

  // Permissive mode: accept almost any non-junk text.
  return true
}

function findServiceByHints(hints: string[]): string | null {
  const hn = hints.map((h) => normalizeLabel(h)).filter(Boolean)
  if (!hn.length) return null

  const matches = SERVICE_LABELS
    .filter((svc) => {
      const sn = normalizeLabel(svc)
      return hn.every((h) => sn.includes(h))
    })
    .sort((a, b) => a.localeCompare(b))

  return matches.length ? matches[0] : null
}

function assumedBaselineServices(text: string): string[] {
  // Baseline “normal capabilities” many systems have even if not stated.
  const t = text.toLowerCase()
  const assumed: string[] = []

  const looksLikeSoftware =
    /\b(system|software|app|application|platform|service|website|site|portal|api|tool|dashboard)\b/i.test(t)

  const mentionsUsers =
    /\b(user|users|account|accounts|customer|customers|employee|employees|admin|administrator|login|log\s*in|authenticate|authentication|sso|mfa|password|credentials|role|roles|permission|permissions|access)\b/i.test(
      t,
    )

  const add = (x: string | null) => {
    if (!x) return
    if (!assumed.includes(x)) assumed.push(x)
  }

  if (looksLikeSoftware || mentionsUsers) {
    add(findServiceByHints(["identification", "authentication"]))
    add(findServiceByHints(["access", "control"]))
    add(findServiceByHints(["account", "management"]))
    add(findServiceByHints(["audit"]))
    add(findServiceByHints(["logging"]))
  }

  const isInventoryLike = /\b(inventory|asset|assets|hardware|device|devices|equipment|stock|catalog)\b/i.test(t)
  if (isInventoryLike) {
    add(findServiceByHints(["inventory"]))
    add(findServiceByHints(["asset"]))
    add(findServiceByHints(["configuration"]))
    add(findServiceByHints(["report"]))
  }

  const hasInterface = /\b(api|integration|integrates|interface|interfaces|endpoint|webhook|portal|website)\b/i.test(t)
  if (hasInterface) {
    add(findServiceByHints(["external", "interface"]))
    add(findServiceByHints(["interface"]))
  }

  return assumed.slice(0, 8)
}

function ensureMinimumRows(rows: Row[], _combinedText: string): Row[] {
  // Deduplicate and keep AI-selected rows as-is (no forced min/max here).
  const out: Row[] = []
  const seen = new Set<string>()

  for (const r of rows) {
    const k = normalizeLabel(r.infoType)
    if (!k) continue
    if (seen.has(k)) continue
    seen.add(k)
    out.push(r)
  }

  return out
}

async function aiCategorizeFips199(combined: string, cacheKey: string): Promise<{ rows: Row[]; systemCategory: SystemCategory }> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY")
  }

  const model = process.env.OPENAI_FIPS199_MODEL || "gpt-5.2"

  // Provide the taxonomy list so the model can choose exact strings.
  const taxonomy = SERVICE_LABELS.join("\n")

  const systemPrompt =
    "You are GS360-FIPS199 for a public demo. Your job is to: " +
    "(1) select relevant NIST SP 800-60r2 Service labels (information types) for the described system (including implied normal capabilities), " +
    "and (2) assign FIPS 199 impact levels (Low/Moderate/High) for Confidentiality, Integrity, and Availability per information type.\n\n" +
    "Rules:\n" +
    "- Output MUST be valid JSON only. Do not include markdown or extra text.\n" +
    "- Select ALL relevant rows. There is no target count; it may be as few as 1 and can be 20+ if warranted.\n" +
    "- Keep the list concise but complete. Do not add unrelated rows.\n" +
    "- infoType MUST match EXACTLY one label from the provided SP 800-60r2 Service list. If none fit, use 'Custom: <label>'.\n" +
    "- Assume typical capabilities when reasonable even if not stated (e.g., Identification and Authentication; Access Control; Audit Trail Capture and Analysis).\n" +
    "- Do NOT invent regulated data (PII/PHI/PCI) unless indicated by the description.\n" +
    "- Use FIPS 199 adverse-effect criteria: Low=limited adverse effect; Moderate=serious adverse effect; High=severe/catastrophic adverse effect.\n" +
    "- Provide a short justification per row referencing the described mission/data/operations.\n" +
    "- Return JSON schema: { rows: [{infoType,c,i,a,justification}, ...] }. Do NOT return systemCategory; the server computes it."

  const userPrompt =
    "System description (and any uploaded excerpt):\n" +
    combined +
    "\n\nAllowed SP 800-60r2 Service labels (use exact strings):\n" +
    taxonomy

  const resp = await client.responses.create({
    model,
    store: false,
    prompt_cache_key: cacheKey,
    input: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    text: {
      format: {
        name: "fips199_sp80060_rows",
        type: "json_schema",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            rows: {
              type: "array",
              minItems: 1,
              maxItems: 50,
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
    throw new Error("Model returned an unexpected format")
  }

  const inRows: any[] = Array.isArray(parsed?.rows) ? parsed.rows : []

  const rows: Row[] = inRows
    .slice(0, 50)
    .map((r: any) => {
      const infoType = coerceServiceLabel(r?.infoType)
      const c = coerceImpactLevel(r?.c)
      const i = coerceImpactLevel(r?.i)
      const a = coerceImpactLevel(r?.a)
      const justification = String(r?.justification ?? "").trim().slice(0, 900)
      return { infoType, c, i, a, justification }
    })
    .filter((r) => r.infoType)

  // Ensure we have a usable number of rows for the demo, but keep AI in control.
  const normalized = ensureMinimumRows(rows, combined).slice(0, 50)
  const systemCategory = computeSystemCategory(normalized)
  return { rows: normalized, systemCategory }
}

function baselineOnlyPayload(combined: string): { rows: Row[]; systemCategory: SystemCategory } {
  const baseline = assumedBaselineServices(combined)
  const rows: Row[] = (baseline.length ? baseline : SERVICE_LABELS.slice(0, 8)).slice(0, 20).map((svc) => ({
    infoType: svc,
    c: "Low",
    i: "Low",
    a: "Low",
    justification: "",
  }))
  return { rows, systemCategory: computeSystemCategory(rows) }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const description = String(body?.description ?? "").slice(0, 7000)
    const fileText = body?.fileText ? String(body.fileText).slice(0, 7000) : ""
    const combined = [description, fileText].filter(Boolean).join("\n\n---\n\n")

    if (!combined.trim()) {
      return Response.json({ error: "Please enter a short system description." }, { status: 400 })
    }

    // Guardrail: landing-page demo expects an information system description.
    if (!isLikelySystemDescription(combined)) {
      return Response.json(
        {
          error:
            "Please describe an information system (what it does, what mission it supports, and what data it handles). For the demo, avoid jokes/noise and use a short sanitized system description.",
        },
        { status: 400 },
      )
    }

    const model = process.env.OPENAI_FIPS199_MODEL || "gpt-5.2"
    const key = cacheKeyFor(model, combined)

    const cached = demoCache.get(key)
    if (cached && Date.now() - cached.at < DEMO_CACHE_TTL_MS) {
      return Response.json(cached.payload)
    }

    let payload: { rows: Row[]; systemCategory: SystemCategory }
    try {
      payload = await aiCategorizeFips199(combined, key)
    } catch (e) {
      // Never fail the demo completely—fall back to baseline-only output.
      console.error("/api/fips199-demo AI error (fallback used):", e)
      payload = baselineOnlyPayload(combined)
    }

    demoCache.set(key, { at: Date.now(), payload })
    return Response.json(payload)
  } catch (e: any) {
    // Surface useful details during local dev.
    console.error("/api/fips199-demo error:", e)

    const status =
      typeof e?.status === "number"
        ? e.status
        : typeof e?.response?.status === "number"
          ? e.response.status
          : 500

    const details = e?.error?.message || e?.response?.data?.error?.message || e?.message || "Server error."

    return Response.json({ error: String(details) }, { status })
  }
}