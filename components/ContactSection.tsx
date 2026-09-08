"use client"

import React, { useRef, useState } from "react"
import { motion, useInView } from "framer-motion"
import { ArrowUpRight } from "lucide-react"

type Tone = "dark" | "light"
const APPLE_PRIMARY_BTN = "contact-submit"
const APPLE_PRIMARY_BTN_DARK = "contact-submit"

export default function ContactSection({ tone = "dark" }: { tone?: Tone }) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [organization, setOrganization] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")

  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref, { once: true, margin: "-100px" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setStatus("idle")

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, organization, message }),
      })

      if (res.ok) {
        setStatus("success")
        setName("")
        setEmail("")
        setOrganization("")
        setMessage("")
      } else {
        setStatus("error")
      }
    } catch (err) {
      console.error(err)
      setStatus("error")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="contact" ref={ref} className="relative py-32 px-6 scroll-mt-24">
      <div className="max-w-4xl mx-auto">
        <motion.div
          className={`card rounded-3xl p-8 sm:p-12 ${tone === "light" ? "!bg-white !border-slate-200/70" : ""}`}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <span className={`section-label mb-4 block ${tone === "light" ? "!text-slate-500" : ""}`}>04 / Let's talk</span>
              <h2 className={`font-syne text-4xl sm:text-5xl font-bold mb-6 ${tone === "light" ? "text-slate-950" : "text-slate-50"}`}>
                Bring us your
                <br />
                <span className="text-slate-950">mission.</span>
              </h2>
              <p className={`${tone === "light" ? "text-slate-600" : "text-slate-300"} mb-8`}>
                Tell us what needs to work better. We&apos;ll walk through how GovSecurity360 could fit your systems, your team, and the way you manage risk.
              </p>
              <ul className={`space-y-2 text-sm ${tone === "light" ? "text-slate-600" : "text-slate-400"}`}>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-slate-500" />
                  <span>Ideal for CISOs, CIOs, CAIOs, and GRC leaders</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-slate-500" />
                  <span>Designed for federal, state, and integrator teams</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-slate-500" />
                  <span>No marketing spam, just focused follow-up</span>
                </li>
              </ul>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-name" className="section-label mb-2 block !text-slate-500">
                    Name <span aria-hidden="true">*</span>
                  </label>
                  <input
                    required
                    className={`input-field w-full rounded-xl px-4 py-3 text-sm ${
                      tone === "light" ? "!bg-white !border-slate-300 !text-slate-900 placeholder:!text-slate-400" : ""
                    }`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    id="contact-name"
                    name="name"
                    autoComplete="name"
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="section-label mb-2 block !text-slate-500">
                    Email <span aria-hidden="true">*</span>
                  </label>
                  <input
                    required
                    type="email"
                    className={`input-field w-full rounded-xl px-4 py-3 text-sm ${
                      tone === "light" ? "!bg-white !border-slate-300 !text-slate-900 placeholder:!text-slate-400" : ""
                    }`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    id="contact-email"
                    name="email"
                    autoComplete="email"
                    placeholder="you@agency.gov"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact-organization" className="section-label mb-2 block !text-slate-500">
                  Organization
                </label>
                <input
                  className={`input-field w-full rounded-xl px-4 py-3 text-sm ${
                    tone === "light" ? "!bg-white !border-slate-300 !text-slate-900 placeholder:!text-slate-400" : ""
                  }`}
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  id="contact-organization"
                  name="organization"
                  autoComplete="organization"
                  placeholder="Agency / Office / Integrator"
                />
              </div>

              <div>
                <label htmlFor="contact-message" className="section-label mb-2 block !text-slate-500">
                  Message <span aria-hidden="true">*</span>
                </label>
                <textarea
                  required
                  className={`input-field w-full rounded-xl px-4 py-3 text-sm min-h-[120px] resize-none ${
                    tone === "light" ? "!bg-white !border-slate-300 !text-slate-900 placeholder:!text-slate-400" : ""
                  }`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  id="contact-message"
                  name="message"
                  placeholder="Tell us about your mission..."
                />
              </div>

              <div className="flex items-center gap-4 pt-2">
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  className={`${tone === "light" ? APPLE_PRIMARY_BTN_DARK : APPLE_PRIMARY_BTN} px-8 py-3 text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                  <ArrowUpRight className="w-4 h-4" />
                </motion.button>
                {status === "success" && (
                  <span role="status" className="text-sm text-green-800">Message sent successfully</span>
                )}
                {status === "error" && (
                  <span role="alert" className="text-sm text-red-800">Something went wrong. Try again.</span>
                )}
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
