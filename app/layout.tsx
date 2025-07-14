import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GovSecurity360',
  description: 'Defense-grade intelligence',
  generator: 'v0.dev',
  icons: {
    icon: '/favicon.png',
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
