import type { Metadata } from 'next'
import '../styles/globals.css'
import '../styles/editorial.css'
import '../styles/briefing.css'
import '../styles/opening-scenes.css'
import '../styles/shared-background.css'
import '../styles/daylight.css'

export const metadata: Metadata = {
  title: 'GovSecurity360',
  description: 'Security Intelligence',
  generator: 'v0.dev',
  icons: {
    icon: '/brand-icon.webp',
  }
}
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
