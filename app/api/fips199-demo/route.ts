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

import crypto from "crypto"

export const runtime = "nodejs" // important for Next.js (don’t run on edge)

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
  // Very short inputs are usually noise, but allow concise system blurbs.
  if (t.length < 20) return false

  // Require at least one "system/app" indicator.
  const systemIndicators = [
    "system",
    "application",
    "app",
    "platform",
    "service",
    "portal",
    "website",
    "site",
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
    // Expanded indicators for payroll/HR/infra
    "payroll",
    "salary",
    "compensation",
    "w-2",
    "w2",
    "tax",
    "withholding",
    "timesheet",
    "hr",
    "human resources",
    "employee",
    "addresses",
    "address",
    "aws",
    "cloud",
    // Additional indicators for concise internal system blurbs
    "repository",
    "document",
    "documents",
    "file",
    "files",
    "sharepoint",
    "intranet",
    "internal",
    "staff",
    "azure",
    "sso",
  ]

  const indicatorHits = systemIndicators.reduce((acc, w) => (t.includes(w) ? acc + 1 : acc), 0)

  // Also require some descriptive structure (not just a single noun/phrase).
  const hasSentenceLikeStructure = /\b(does|supports|manages|tracks|stores|processes|collects|provides|allows|enables|uses|holds|contains|handles|serves|lets|can|view|predict|analyz(?:e|es|ing)|recommend(?:s|ing)?)\b/.test(t)

  // If it looks like a food / joke prompt, fail fast.
  const obviousJunk = /\b(cheeseburger|hamburger|pizza|taco|fries|ice cream|lol|asdf|qwerty)\b/.test(t)

  if (obviousJunk) return false

  // If the user explicitly mentions regulated/sensitive data, accept even if phrasing is concise.
  const trig = detectTriggers(t)
  const sensitiveMention = trig.pii || trig.phi || trig.pci || trig.natSec || trig.lifeSafety
  if (sensitiveMention && indicatorHits >= 1) return true

  // Allow concise but clearly system-like blurbs (e.g., internal repo in Azure using SSO)
  // even if they don't use the exact word "system".
  const hasCloudOrProvider = /(aws|azure|gcp|cloud|saas|kubernetes|k8s|terraform)/i.test(t)
  const hasAuthSignal = /(sso|login|log\s*in|authenticate|authentication|mfa|credentials)/i.test(t)
  if ((hasCloudOrProvider || hasAuthSignal) && hasSentenceLikeStructure) return true

  // Accept common, user-written blurbs like: "A football gambling site. Users can view this site to make analytical predictions."
  // If it mentions users + a site/website/app/service and includes an action verb, treat it as system-like.
  const hasWebOrServiceSurface = /(site|website|portal|app|application|platform|service)/i.test(t)
  const hasUserSurface = /(users?|customer|clients?|members?|visitors?)/i.test(t)

  if (hasWebOrServiceSurface && hasUserSurface && hasSentenceLikeStructure) return true

  return indicatorHits >= 2 || (indicatorHits >= 1 && hasSentenceLikeStructure)
}
// Deterministic info type picker for the demo: only includes info types if context strongly suggests it.
function pickDemoInfoTypesDeterministic(text: string): string[] {
  const t = text.toLowerCase()
  const triggers = detectTriggers(text)

  // Relevance rules are intentionally conservative: only include an info type if the user context
  // strongly suggests it. Otherwise, we fill from the top of the catalog (stable ordering).
  const isPublicFacing = /(public\s*facing|public\s*website|website|landing\s*page|external\s*users|customer\s*portal|public\s*portal)/i.test(t)
  const hasUsers = /(user\s*account|user\s*accounts|users|login|log\s*in|authenticate|authentication|sso|mfa|password|credentials)/i.test(t)
  const hasConfigOps = /(aws|cloud|kubernetes|k8s|terraform|configuration|config|iam|role|policy|security\s*group|vpc|network)/i.test(t)
  const hasSecurityOps = /(audit\s*log|logging|siem|alert|monitoring|vulnerability|patch|incident|ir\b|forensic)/i.test(t)
  const hasPayments = /(payment|payments|invoice|billing|credit\s*card|debit\s*card|cardholder|pci)/i.test(t)
  const hasCasework = /(case\s*management|case\s*work|claims|benefits|intake|tickets?|service\s*request)/i.test(t)
  const hasExports = /(export|exports|download|extract|data\s*export)/i.test(t)

  const mentionsComplianceArtifacts = /(fips\s*199|fips\s*200|nist\s*800-53|fedramp|ato|ssp|sar|poa&m|poam|risk assessment|controls? evidence)/i.test(t)

  // Payroll / HR implies PII and account data, but not necessarily public-facing.
  const hasPayrollHr = /(payroll|salary|compensation|w-2|w2|withholding|tax|timesheet|hr|human\s*resources|employee)/i.test(t)

  const relevant = new Set<string>()

  if (isPublicFacing) relevant.add("Public Facing Content")
  if (hasUsers) {
    relevant.add("User Account Data")
    relevant.add("Authentication Credentials")
    relevant.add("Access Control Lists")
  }

  // Data sensitivity
  if (triggers.pii || /\bhome\s*address(es)?\b/i.test(t) || hasPayrollHr) relevant.add("PII")
  if (triggers.phi) relevant.add("PHI")
  if (triggers.pci || hasPayments) relevant.add("Payment Card Data")
  if (hasPayments) relevant.add("Financial Transactions")

  // Audit logs are commonly present for repos/SSO systems, even if the user doesn't mention "logging".
  if (hasUsers) relevant.add("Audit Logs")

  // The rest require explicit security-ops language.
  if (hasSecurityOps) {
    relevant.add("Security Monitoring Alerts")
    relevant.add("Vulnerability and Patch Data")
    relevant.add("Incident Response Records")
  }

  if (hasConfigOps) {
    relevant.add("System Configuration Data")
    relevant.add("Software Inventory")
    relevant.add("External Interfaces")
  }

  if (hasCasework) {
    relevant.add("Case Management Records")
    relevant.add("Service Requests and Tickets")
  }

  if (hasExports) relevant.add("Data Exports")

  // Include governance artifacts only when the user mentions compliance/ATO context.
  if (mentionsComplianceArtifacts) {
    relevant.add("Risk Assessments")
    relevant.add("Control Implementation Evidence")
    relevant.add("System Security Plan Data")
    relevant.add("Security Assessment Results")
    relevant.add("Plan of Action and Milestones")
  }

  // Pick the first 10 relevant in catalog order; then fill from the top to reach 10.
  const picked: string[] = []
  for (const entry of INFO_TYPE_CATALOG) {
    if (picked.length >= 10) break
    if (relevant.has(entry.infoType)) picked.push(entry.infoType)
  }

  if (picked.length < 10) {
    for (const entry of INFO_TYPE_CATALOG) {
      if (picked.length >= 10) break

      const label = entry.infoType
      const lower = label.toLowerCase()

      // Don’t pad in "Public Facing Content" unless explicitly indicated.
      if (!isPublicFacing && lower === "public facing content") continue

      // Don’t assume identity/user auth data unless explicitly indicated.
      if (!hasUsers && (lower === "user account data" || lower === "authentication credentials")) continue

      // Don’t over-assert security operations artifacts unless explicitly mentioned.
      if (!hasSecurityOps && (lower === "security monitoring alerts" || lower === "vulnerability and patch data" || lower === "incident response records")) continue

      // Don’t include governance artifacts unless compliance/ATO context is mentioned.
      if (!mentionsComplianceArtifacts && (lower === "risk assessments" || lower === "control implementation evidence" || lower === "system security plan data" || lower === "security assessment results" || lower === "plan of action and milestones")) continue

      // Prefer safe padding types for generic descriptions.
      const safeFill = new Set<string>([
        "audit logs",
        "system configuration data",
        "software inventory",
        "external interfaces",
        "operational reports",
        "data exports",
        "service requests and tickets",
      ])

      // If we have very little context, only pad with safe-fill items.
      // If the label isn't safe and wasn't explicitly relevant, skip it.
      if (!safeFill.has(lower) && !relevant.has(label)) continue

      const exists = picked.some((x) => x.toLowerCase() === lower)
      if (exists) continue

      picked.push(label)
    }
  }

  return picked.slice(0, 10)
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

    const model = process.env.OPENAI_FIPS199_MODEL || "gpt-5-mini" // used only for cache key stability

    const key = cacheKeyFor(model, combined)
    const cached = demoCache.get(key)
    if (cached && Date.now() - cached.at < DEMO_CACHE_TTL_MS) {
      return Response.json(cached.payload)
    }

    const triggers = detectTriggers(combined)
    const picked = pickDemoInfoTypesDeterministic(combined)

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