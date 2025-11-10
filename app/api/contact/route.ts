import { NextResponse } from "next/server"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const { name, email, organization, message } = await req.json()

    if (!email || !message) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    const toEmail = process.env.CONTACT_TO_EMAIL
    const fromEmail = process.env.CONTACT_FROM_EMAIL

    if (!toEmail || !fromEmail) {
      console.error("CONTACT_TO_EMAIL or CONTACT_FROM_EMAIL not set")
      return NextResponse.json(
        { error: "Email not configured" },
        { status: 500 },
      )
    }

    await resend.emails.send({
      from: `GovSecurity360 Contact <${fromEmail}>`,
      to: [toEmail],
      replyTo: email,
      subject: `New contact from ${name || "GovSecurity360 website"}`,
      text: `
        Name: ${name || "(not provided)"}
        Email: ${email}
        Organization: ${organization || "(not provided)"}

        Message:
        ${message}
            `.trim(),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Contact form error:", err)
    return NextResponse.json({ error: "Failed to send" }, { status: 500 })
  }
}