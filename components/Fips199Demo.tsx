"use client"

import React, { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion"

type Tone = "dark" | "light"

export default function Fips199DemoSection({ tone = "light" }: { tone?: Tone }) {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null)
  // SSR and the first browser render must have the same tree. Mount overlays
  // outside the sticky stage only after hydration commits.
  useEffect(() => { setPortalTarget(document.body) }, [])
  const reducedMotion = useReducedMotion()
  const [description, setDescription] = useState("")
  const [selectedExample, setSelectedExample] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const [filePreflight, setFilePreflight] = useState<
    | { status: "idle"; message?: string }
    | { status: "ok"; message: string }
    | { status: "warn"; message: string }
    | { status: "bad"; message: string }
  >({ status: "idle" })

  const [warningOpen, setWarningOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<"upload" | "submit" | null>(null)

  const [isRunning, setIsRunning] = useState(false)
  const [showResults, setShowResults] = useState(false)
  useEffect(() => {
    if (!warningOpen && !isRunning) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = previous }
  }, [warningOpen, isRunning])

  type FipsRow = {
    infoType: string
    c: string
    i: string
    a: string
    justification?: string
  }

  const [aiRows, setAiRows] = useState<FipsRow[] | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const isProbablyText = (buf: Uint8Array) => {
    const n = Math.min(buf.length, 4096)
    let bad = 0
    for (let i = 0; i < n; i++) {
      const b = buf[i]
      if (b === 0) bad++
      else if (b < 9) bad++
      else if (b > 13 && b < 32) bad++
    }
    return bad / Math.max(1, n) < 0.02
  }

  const startsWithBytes = (buf: Uint8Array, bytes: number[]) => {
    if (buf.length < bytes.length) return false
    for (let i = 0; i < bytes.length; i++) if (buf[i] !== bytes[i]) return false
    return true
  }

  const preflightFile = async (
    f: File,
  ): Promise<{ ok: boolean; level: "ok" | "warn" | "bad"; message: string }> => {
    const name = (f?.name ?? "").toLowerCase()
    const ext = name.includes(".") ? name.split(".").pop() : ""

    // allowlist
    const allowedExts = ["txt", "md", "csv", "json", "yaml", "yml", "xml", "log", "docx", "pdf"]
    if (!(typeof ext === "string" && allowedExts.includes(ext))) {
      return {
        ok: false,
        level: "bad",
        message: "Unsupported file type. Please upload .txt/.md/.json (or .docx/.pdf).",
      }
    }

    // size cap (demo)
    const MAX_BYTES = 3_500_000
    if (f.size > MAX_BYTES) {
      return {
        ok: false,
        level: "bad",
        message: "File too large for demo. Please upload a small sanitized file.",
      }
    }

    try {
      const head = new Uint8Array(await f.slice(0, 16).arrayBuffer())

      if (ext === "pdf") {
        // %PDF-
        const ok = startsWithBytes(head, [0x25, 0x50, 0x44, 0x46, 0x2d])
        if (!ok) {
          return { ok: false, level: "bad", message: "This file does not look like a valid PDF (signature mismatch)." }
        }
        return {
          ok: true,
          level: "ok",
          message: "Preflight OK: PDF signature verified. Text will be extracted locally (no file upload).",
        }
      }

      if (ext === "docx") {
        // DOCX is a ZIP container: PK\x03\x04
        const ok = startsWithBytes(head, [0x50, 0x4b, 0x03, 0x04])
        if (!ok) {
          return { ok: false, level: "bad", message: "This .docx does not look valid (ZIP signature mismatch)." }
        }
        return {
          ok: true,
          level: "ok",
          message: "Preflight OK: DOCX signature verified. Text will be extracted locally (no file upload).",
        }
      }

      // text-ish files
      const okText = isProbablyText(head)
      if (!okText) {
        return { ok: false, level: "bad", message: "This file does not look like readable text. Please upload a text-based file." }
      }

      return { ok: true, level: "ok", message: "Preflight OK: text file verified. Only extracted text will be sent." }
    } catch {
      return {
        ok: true,
        level: "warn",
        message: "Preflight warning: could not fully verify signature. Proceeding with local text extraction.",
      }
    }
  }

  const sanitizeExtractedText = (t: string) => {
    const cleaned = (t ?? "")
      .replace(/\u0000/g, "")
      .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
    return cleaned.length > 40000 ? cleaned.slice(0, 40000) : cleaned
  }
  const acceptDroppedFile = async (f: File) => {
    const pre = await preflightFile(f)

    if (!pre.ok) {
      setFile(null)
      setFilePreflight({ status: "bad", message: pre.message })
      setApiError(pre.message)
      setAiRows(null)
      setShowResults(false)
      return
    }

    setFile(f)
    setFilePreflight({ status: pre.level, message: pre.message })
    setApiError(null)
    setAiRows(null)
    setShowResults(false)
  }

  const readFileAsText = async (f: File): Promise<string> => {
    // Demo guardrails: keep it small.
    const MAX_BYTES = 3_500_000
    if (f.size > MAX_BYTES) {
      throw new Error("File too large for demo. Please upload a small sanitized file.")
    }

    const name = (f?.name ?? "").toLowerCase()
    const ext = name.includes(".") ? name.split(".").pop() : ""

    // Plain text-like files
    const textExts = ["txt", "md", "csv", "json", "yaml", "yml", "xml", "log"]
    if (f.type?.startsWith("text/") || (typeof ext === "string" && textExts.includes(ext))) {
      const t = await f.text()
      return String(t ?? "").trim()
    }

    // .docx: extract raw text client-side
    if (ext === "docx") {
      const buf = await f.arrayBuffer()
      // Mammoth doesn't always ship TS types; import the main module and treat as `any`.
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const mammoth: any = await import("mammoth")
      const result = await mammoth.extractRawText({ arrayBuffer: buf })
      const text = String(result?.value ?? "").trim()
      if (!text) throw new Error("Could not extract text from .docx. Please try a small sanitized .txt file instead.")
      return text
    }

    // .pdf: extract text client-side using pdf.js
    if (ext === "pdf") {
      const buf = await f.arrayBuffer()

      // Use the main pdfjs-dist entry (TypeScript can resolve it more reliably than deep legacy paths).
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const pdfjs: any = await import("pdfjs-dist")

      // Ensure the worker is set (bundled with pdfjs-dist). If this fails, pdfjs may still work in "fake worker" mode.
      try {
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString()
      } catch {
        // ignore
      }

      const loadingTask = pdfjs.getDocument({ data: buf })
      try {
        const pdf = await loadingTask.promise

      // Limit pages/size so we don't create huge prompts.
      const maxPages = Math.min(pdf.numPages || 0, 25)
      let out = ""

      for (let p = 1; p <= maxPages; p++) {
        // eslint-disable-next-line no-await-in-loop
        const page = await pdf.getPage(p)
        // eslint-disable-next-line no-await-in-loop
        const content = await page.getTextContent()
        const pageText = (content?.items || [])
          .map((it: any) => (typeof it?.str === "string" ? it.str : ""))
          .join(" ")
          .replace(/\s+/g, " ")
          .trim()

        if (pageText) out += pageText + "\n"

        // Prevent runaway text
        if (out.length > 40_000) break
      }

      const text = out.trim()
      if (!text) {
        throw new Error(
          "Could not extract text from this PDF (it may be scanned). Please upload a text-based PDF or a small sanitized .txt file.",
        )
      }

        return text
      } finally {
        // Release the document and its worker after every extraction attempt.
        await loadingTask.destroy()
      }
    }

    throw new Error("Unsupported file type for this demo. Please upload a small sanitized .txt/.md/.json (or .docx/.pdf) file.")
  }

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Helper to reliably extract a file from DataTransfer (handles Safari)
  const getDroppedFile = (dt: DataTransfer | null | undefined): File | null => {
    if (!dt) return null
    const f = dt.files && dt.files.length > 0 ? dt.files[0] : null
    if (f) return f

    // Safari sometimes prefers items
    const items = dt.items ? Array.from(dt.items) : []
    const fileItem = items.find((it) => it.kind === "file")
    return fileItem ? fileItem.getAsFile() : null
  }

  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: "-100px" })

  const examples = [
    {
      key: "Federal Grants Management System",
      title: "Federal Grants Management System",
      text:
        "This system manages the full lifecycle of federal grant and financial assistance programs, including application intake, eligibility review, award creation, fund disbursement tracking, and post-award monitoring. It supports the agency mission by improving compliance and audit readiness, reducing manual processing, and ensuring timely, transparent delivery of funds to eligible recipients.",
    },
    {
      key: "Public Health Surveillance System",
      title: "Public Health Surveillance System",
      text:
        "This system supports public health operations by collecting case reports and laboratory results, managing investigations, and providing dashboards for trend analysis and outbreak response. It supports the agency mission by improving detection and response timelines, enabling coordinated case management, and producing accurate reporting for leadership and partner organizations.",
    },
    {
      key: "Mission Planning & C2 System",
      title: "Mission Planning & C2 System",
      text:
        "This system supports operational planning and command-and-control coordination by managing mission plans, tasking, situational reporting, and collaboration across mission partners. It supports the mission by increasing situational awareness, accelerating decision-making, and ensuring mission activities and approvals are tracked and available to authorized users.",
    },
  ]

  const surface = tone === "light" ? "bg-white border border-slate-200/80" : "bg-white/5 border border-white/10"
  const textStrong = tone === "light" ? "text-slate-950" : "text-slate-50"
  const textMuted = tone === "light" ? "text-slate-600" : "text-slate-300"

  const openWarning = (action: "upload" | "submit") => {
    setPendingAction(action)
    setWarningOpen(true)
  }

  const continueWarning = () => {
    const action = pendingAction
    setWarningOpen(false)
    setPendingAction(null)

    if (action === "upload") {
      fileInputRef.current?.click()
      return
    }

    if (action === "submit") {
      void runDemo()
    }
  }

  const cancelWarning = () => {
    setWarningOpen(false)
    setPendingAction(null)
  }

  const runDemo = async () => {
    const hasText = description.trim().length > 0
    const hasFile = !!file
    if (!hasText && !hasFile) {
      setApiError("Please enter a brief system description or upload a small sanitized file.")
      return
    }

    // Live demo: call a small API endpoint, but *always* play the full status sequence.
    setShowResults(false)
    setIsRunning(true)
    setApiError(null)
    setAiRows(null)

    // Read file text (best-effort) before kicking off the request.
    let fileText = ""
    if (file) {
      try {
        fileText = sanitizeExtractedText(await readFileAsText(file))
      } catch (e: any) {
        // Non-fatal: keep going with the description only.
        setApiError(e?.message ? String(e.message) : "File could not be read. Continuing with text input only.")
        fileText = ""
      }
    }

    // Keep the processing state visible until the actual request settles.
    const result = await fetch("/api/fips199-demo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description,
        exampleKey: selectedExample,
        fileName: file?.name ?? null,
        fileText: fileText || null,
      }),
    })
      .then(async (res) => {
        const text = await res.text()
        const json = text ? JSON.parse(text) : null
        if (!res.ok) {
          const msg =
            json && (json.error || json.message)
              ? String(json.error || json.message)
              : text || "Request failed."
          const err: any = new Error(msg)
          err.status = res.status
          throw err
        }
        return json
      })
      .catch((err: any) => {
        return { error: err?.message ? String(err.message) : "Request failed." }
      })

    // If the API returned an error (e.g., 400 from nonsense guardrails),
    // stay on the prompt view and surface the message.
    if (result?.error) {
      setApiError(String(result.error))
      setAiRows(null)
      setIsRunning(false)
      setShowResults(false)
      return
    }

    if (result && Array.isArray(result.rows) && result.rows.length > 0) {
      // Normalize shape defensively
      const normalized = result.rows
        .map((r: any) => ({
          infoType: String(r.infoType ?? r.information_type ?? ""),
          c: String(r.c ?? r.confidentiality ?? ""),
          i: String(r.i ?? r.integrity ?? ""),
          a: String(r.a ?? r.availability ?? ""),
          justification: r.justification ? String(r.justification) : undefined,
        }))
        .filter((r: any) => r.infoType)

      setAiRows(normalized)
    } else {
      // No rows returned — keep the user on the prompt view with a clear message.
      setApiError("No results were returned. Please provide a clearer system description (or upload a small sanitized text file).")
      setAiRows(null)
      setIsRunning(false)
      setShowResults(false)
      return
    }

    setIsRunning(false)
    setShowResults(true)
  }

  const onPickExample = (ex: (typeof examples)[number]) => {
    setSelectedExample(ex.key)
    setDescription(ex.text)
  }

  const demoRows = [
    { infoType: "Grants Management", c: "Moderate", i: "Moderate", a: "Moderate" },
    { infoType: "Financial Transactions", c: "Moderate", i: "High", a: "Moderate" },
    { infoType: "Personally Identifiable Information", c: "High", i: "Moderate", a: "Low" },
    { infoType: "Audit & Compliance Records", c: "Low", i: "High", a: "Moderate" },
    { infoType: "Operational Reporting", c: "Low", i: "Moderate", a: "Moderate" },
  ]

  const rowsForTable: Array<{ infoType: string; c: string; i: string; a: string; justification?: string }> =
    aiRows && aiRows.length > 0 ? aiRows : demoRows

  // Cap the demo table length so the UI doesn’t look overly long.
  // Includes both visible and blurred rows.
  const cappedRowsForTable = rowsForTable.slice(0, 10)

  // Extracted Clear handler
  const handleClear = () => {
    setFile(null)
    setFilePreflight({ status: "idle" })
    setSelectedExample(null)
    setDescription("")
    setAiRows(null)
    setApiError(null)
    setIsRunning(false)
    setShowResults(false)
  }
  return (
    <section
      id="fips199-demo"
      ref={ref}
      className="relative min-h-screen pt-28 pb-44 md:pb-60 px-6 scroll-mt-24 bg-white text-slate-950"
    >
      <div className="max-w-7xl mx-auto">
        <div className="demo-intro">
          <div><span className={`section-label mb-4 block ${tone === "light" ? "!text-slate-500" : ""}`}>02 / Try GS360</span>
          <h2 className={`font-syne text-4xl sm:text-5xl md:text-6xl font-bold ${textStrong}`}>Your system.<br />Its information.<br /><span>A clearer starting point.</span></h2></div>
          <div className="demo-intro-copy">
          <span className="demo-method">INFORMATION CATEGORIZATION / FIPS 199</span>
          <p className={`${textMuted} mt-5 text-lg leading-relaxed`}>
            Describe what your system does. Explore suggested information types and confidentiality, integrity, and availability impact levels.
          </p>
          <p className="demo-review-note">AI-assisted output. Your team reviews the result.<br />Use fictional or sanitized information only.</p>
          </div>
        </div>

        <div className="mt-14 flex justify-center">
          {!showResults ? (
            /* Prompting card (first view) */
            <motion.div
              className={`demo-workspace w-full max-w-5xl rounded-3xl p-6 sm:p-8 shadow-[0_18px_60px_rgba(2,6,23,0.08)] ${surface}`}
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              animate={inView || reducedMotion ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: reducedMotion ? 0 : 0.48 }}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="min-w-0">
                  <h3 className={`font-syne text-xl font-bold ${textStrong}`}>
                    Describe your system
                    <span className="inline-flex items-baseline ml-3 gap-2">
                      <button
                        type="button"
                        onClick={() => openWarning("upload")}
                        className="inline-flex items-center justify-center rounded-full px-4 py-px text-sm font-medium bg-[#2C58A8] text-white ring-1 ring-[#2C58A8]/35 hover:bg-[#3563B7] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2C58A8]/45 focus-visible:ring-offset-2"
                      >
                        Upload file
                      </button>
                      <button
                        type="button"
                        onClick={handleClear}
                        className="inline-flex items-center justify-center rounded-full px-4 py-px text-sm font-medium bg-white text-slate-950 ring-1 ring-slate-200 hover:bg-slate-50"
                      >
                        Clear
                      </button>
                    </span>
                  </h3>

                  <label htmlFor="fips199-demo-file" className="sr-only">
                    Upload file
                  </label>
                  <input
                    id="fips199-demo-file"
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    aria-label="Upload file"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null
                      if (f) void acceptDroppedFile(f)
                      else {
                        setFile(null)
                        setFilePreflight({ status: "idle" })
                      }
                    }}
                  />
                </div>

                {/* Clear button moved above, so remove this right-side Clear button */}
              </div>

              <div className="mt-3 grid lg:grid-cols-[1fr_280px] gap-4">
                <div
                  className={
                    "relative rounded-2xl " +
                    (isDragOver
                      ? "ring-2 ring-[#2C58A8]/50 bg-[#2C58A8]/[0.04]"
                      : "")
                  }
                  onDragEnter={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsDragOver(true)
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsDragOver(true)
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsDragOver(false)
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsDragOver(false)
                    const f = getDroppedFile(e.dataTransfer)
                    if (f) void acceptDroppedFile(f)
                  }}
                >
                  <label htmlFor="fips199-demo-description" className="sr-only">
                    System description
                  </label>
                  <textarea
                    id="fips199-demo-description"
                    aria-describedby={file ? undefined : "fips199-demo-tip"}
                    value={description}
                    onChange={(e) => {
                      setSelectedExample(null)
                      setDescription(e.target.value)
                      setApiError(null)
                      setAiRows(null)
                      setShowResults(false)
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsDragOver(true)
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsDragOver(true)
                      try {
                        // nicer UX indicator
                        e.dataTransfer.dropEffect = "copy"
                      } catch {
                        // ignore
                      }
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsDragOver(false)
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsDragOver(false)
                      const f = getDroppedFile(e.dataTransfer)
                      if (f) void acceptDroppedFile(f)
                    }}
                    placeholder="What does the system do? Who uses it, what information does it handle, and which mission does it support?"
                    className="w-full min-h-[260px] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-950/20"
                  />

                  {/* Drop hint overlay */}
                  {isDragOver ? (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl">
                      <div className="rounded-xl bg-white/90 border border-slate-200 px-4 py-2 text-xs text-slate-700 shadow-[0_10px_30px_rgba(2,6,23,0.10)]">
                        Drop file to upload
                      </div>
                    </div>
                  ) : null}

                  {file ? (
                    <div className="mt-2 space-y-1">
                      <div className="text-xs text-slate-600">
                        Selected file: <span className="font-medium text-slate-900">{file.name}</span>
                      </div>
                      {filePreflight.status !== "idle" ? (
                        <div
                          className={
                            "text-[11px] " +
                            (filePreflight.status === "ok"
                              ? "text-emerald-700"
                              : filePreflight.status === "warn"
                                ? "text-amber-700"
                                : "text-red-700")
                          }
                        >
                          {filePreflight.message}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-2 text-[11px] text-slate-500" id="fips199-demo-tip">
                      Tip: you can also drag &amp; drop a file into this box (.txt, .docx, .pdf).
                    </div>
                  )}
                </div>

                <div className="demo-examples rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-semibold text-slate-700">Start with a sample system</p>
                  <div className="mt-3 space-y-2">
                    {examples.map((ex) => {
                      const active = selectedExample === ex.key
                      return (
                        <button
                          key={ex.key}
                          type="button"
                          onClick={() => onPickExample(ex)}
                          aria-pressed={active}
                          className={`w-full text-left rounded-xl px-3 py-2 text-xs font-medium transition-colors border ${
                            active
                              ? "bg-slate-950 text-white border-slate-950"
                              : "bg-white text-slate-900 border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          {ex.title}
                        </button>
                      )
                    })}
                  </div>

                  <div className="mt-4 text-[11px] text-slate-600 leading-relaxed">
                    Tip: use fictional or sanitized examples only.
                  </div>
                </div>
              </div>

              {apiError ? (
                <div role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {apiError}
                </div>
              ) : null}

              <div className="mt-6 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => {
                    const hasText = description.trim().length > 0
                    const hasFile = !!file
                    if (!hasText && !hasFile) {
                      setApiError("Please enter a brief system description or upload a small sanitized file.")
                      return
                    }
                    openWarning("submit")
                  }}
                  disabled={isRunning || (description.trim().length === 0 && !file)}
                  className="site-button"
                >
                  Categorize system →
                </button>
              </div>
            </motion.div>
          ) : (
            /* Categorization card (second view) */
            <motion.div
              className={`demo-workspace w-full max-w-5xl rounded-3xl p-6 sm:p-8 shadow-[0_18px_60px_rgba(2,6,23,0.08)] ${surface}`}
              initial={reducedMotion ? false : { opacity: 0, y: 12 }}
              animate={inView || reducedMotion ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: reducedMotion ? 0 : 0.48 }}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h3 className={`font-syne text-2xl font-bold ${textStrong}`}>Suggested information types</h3>
                  <p role="status" className={`${textMuted} mt-2 text-sm leading-relaxed`}>Analysis ready. Review the suggested impact levels with your team; this is not a final categorization.</p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResults(false)
                      setIsRunning(false)
                      setApiError(null)
                    }}
                    className="inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium bg-white text-slate-950 ring-1 ring-slate-200 hover:bg-slate-50"
                  >
                    Back
                  </button>
                  <div className="hidden sm:block w-2 h-12 rounded-full bg-slate-200" aria-hidden />
                </div>
              </div>

              <div className="results-scroll mt-6 rounded-2xl border border-slate-200">
                <div className="results-table">
                <div className="grid grid-cols-4 gap-x-10 bg-slate-50 px-4 py-3 text-[11px] font-semibold text-slate-700">
                  <div>Information Type</div>
                  <div>Confidentiality (NIST)</div>
                  <div>Integrity (NIST)</div>
                  <div>Availability (NIST)</div>
                </div>

                <div className="relative">
                  {cappedRowsForTable.map((r, idx) => {
                    const blurred = idx >= 4
                    return (
                      <div
                        key={r.infoType}
                        className={`grid grid-cols-4 gap-x-10 px-4 py-3 text-sm border-t border-slate-100 ${
                          blurred ? "filter blur-[6px] opacity-65 select-none" : ""
                        }`}
                      >
                        <div className="font-medium text-slate-900">{r.infoType}</div>
                        <div className="text-slate-700">{r.c}</div>
                        <div className="text-slate-700">{r.i}</div>
                        <div className="text-slate-700">{r.a}</div>
                      </div>
                    )
                  })}

                  {/* Paywall / CTA overlay */}
                  <div className="pointer-events-none absolute inset-0 flex flex-col justify-end">
                    <div className="h-28 bg-gradient-to-t from-white via-white/95 to-transparent" />
                    <div className="pointer-events-auto px-4 pb-5">
                      <div className="rounded-2xl border border-slate-200 bg-white/90 backdrop-blur-md p-4 flex items-center justify-between gap-4">
                        <p className="text-sm text-slate-700">
                          Want to see more?
                          <span className="block text-[12px] text-slate-500">Get a tailored walkthrough and full output.</span>
                        </p>
                        <a
                          href="#contact"
                          className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium bg-slate-950 text-white hover:opacity-95"
                        >
                          Contact
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Warning modal */}
      {portalTarget && createPortal(<div className="editorial">
      <AnimatePresence>
        {warningOpen && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/35 px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-xl rounded-2xl bg-white border border-slate-200 shadow-[0_30px_80px_rgba(0,0,0,0.25)]"
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              role="dialog"
              aria-modal="true"
            >
              <div className="p-6">
                <p className="text-sm font-semibold text-slate-900">
                  By continuing, you affirm that you have not entered or uploaded any sensitive information.
                </p>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                  Do not include PII, PHI, CUI, classified information, or other non-public government data. Use fictional or sanitized examples only.
                </p>

                <div className="mt-6 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={continueWarning}
                    className="inline-flex items-center justify-center rounded-md px-5 py-2 text-sm font-medium bg-green-600 text-white hover:bg-green-600/95"
                  >
                    Continue
                  </button>
                  <button
                    type="button"
                    onClick={cancelWarning}
                    className="inline-flex items-center justify-center rounded-md px-5 py-2 text-sm font-medium bg-red-600 text-white hover:bg-red-600/95"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading overlay */}
      <AnimatePresence>
        {isRunning && (
          <motion.div
            className="demo-processing-overlay fixed inset-0 z-[190] flex items-end sm:items-center justify-center bg-black/30 px-6 pb-6 sm:pb-0"
            initial={reducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="demo-processing w-full max-w-2xl rounded-2xl bg-slate-950 text-white border border-white/10 shadow-[0_30px_90px_rgba(0,0,0,0.35)]"
              initial={reducedMotion ? false : { opacity: 0, y: 8, scale: 1 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.18 }}
              role="status"
              aria-live="polite"
            >
              <div className="p-6 sm:p-7">
                <span className="processing-label">GS360 / Information categorization</span>
                <p className="processing-title">Analyzing your system</p>
                <p className="processing-copy">We’re waiting for the analysis to return. Suggested information types and impact levels will appear when it’s ready.</p>
                <div className="processing-track" aria-hidden="true"><span /></div>
                <span className="processing-note">Keep this page open. Results still need your team’s review.</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>, portalTarget)}
    </section>
  )
}
