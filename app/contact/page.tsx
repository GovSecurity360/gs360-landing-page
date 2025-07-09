"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Send, Shield, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  })
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsSubmitted(true)
    setIsSubmitting(false)

    // Reset form after 3 seconds
    setTimeout(() => {
      setIsSubmitted(false)
      setFormData({ name: "", email: "", message: "" })
    }, 3000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#000511] via-[#001122] to-[#000511] text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-black/20 border-b border-[#00d4ff]/10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xl font-bold italic text-[#00d4ff] cursor-pointer hover:text-white transition-colors"
            >
              GovSecurity360
            </motion.div>
          </Link>
          <Link href="/">
            <Button variant="ghost" className="text-white hover:text-[#00d4ff] hover:bg-[#00d4ff]/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </nav>

      {/* Contact Section */}
      <section className="pt-24 pb-16 px-6">
        <div className="container mx-auto max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-6xl font-bold italic mb-6 bg-gradient-to-r from-white via-[#00d4ff] to-white bg-clip-text text-transparent">
              Secure Contact
            </h1>
            <p className="text-xl text-gray-300 font-light">Classified communications. Authorized inquiries only.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="relative"
          >
            {/* Glassmorphism Card */}
            <div className="bg-black/40 backdrop-blur-xl border border-[#00d4ff]/20 rounded-2xl p-8 shadow-2xl shadow-[#00d4ff]/10">
              <AnimatePresence mode="wait">
                {isSubmitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="text-center py-12"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      className="inline-flex items-center justify-center w-16 h-16 bg-[#00d4ff]/20 rounded-full mb-6"
                    >
                      <CheckCircle className="w-8 h-8 text-[#00d4ff]" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-[#00d4ff] mb-4">Message Secured</h3>
                    <p className="text-gray-300">
                      Your transmission has been encrypted and received.
                      <br />
                      Authorized personnel will respond within 24 hours.
                    </p>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-2 text-[#00d4ff] mb-6">
                      <Shield className="w-5 h-5" />
                      <span className="text-sm font-semibold">End-to-End Encrypted</span>
                    </div>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <label className="block text-sm font-medium text-gray-300 mb-2">Name / Callsign</label>
                      <Input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your identification"
                        className="bg-black/60 border-[#00d4ff]/30 text-white placeholder:text-gray-500 focus:border-[#00d4ff] focus:ring-[#00d4ff]/20 backdrop-blur-sm"
                        required
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <label className="block text-sm font-medium text-gray-300 mb-2">Secure Email</label>
                      <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your.secure@email.gov"
                        className="bg-black/60 border-[#00d4ff]/30 text-white placeholder:text-gray-500 focus:border-[#00d4ff] focus:ring-[#00d4ff]/20 backdrop-blur-sm"
                        required
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <label className="block text-sm font-medium text-gray-300 mb-2">Classified Message</label>
                      <Textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Enter your secure transmission..."
                        rows={6}
                        className="bg-black/60 border-[#00d4ff]/30 text-white placeholder:text-gray-500 focus:border-[#00d4ff] focus:ring-[#00d4ff]/20 backdrop-blur-sm resize-none"
                        required
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-[#00d4ff] to-[#0099cc] hover:from-[#00b8e6] hover:to-[#0088bb] text-black font-semibold py-3 transition-all duration-300 hover:shadow-lg hover:shadow-[#00d4ff]/25 disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                            className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full"
                          />
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            Transmit Secure Message
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>

            {/* Ambient Glow */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#00d4ff]/5 via-transparent to-[#0099cc]/5 rounded-2xl blur-xl" />
          </motion.div>
        </div>
      </section>

      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#00d4ff]/3 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-[#0099cc]/4 rounded-full blur-2xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
      </div>
    </div>
  )
}
