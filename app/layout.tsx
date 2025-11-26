import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { NavBar } from '@/components/NavBar'
import { Footer } from '@/components/Footer'
import { ThemeProvider } from '@/components/ThemeProvider'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { GoogleAnalytics } from '@/components/GoogleAnalytics'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://prompt-library.vercel.app'),
  title: {
    default: 'AI Prompt Library',
    template: '%s | AI Prompt Library',
  },
  description: 'A curated collection of high-quality AI prompts for the community. Browse, discover, and share prompts for ChatGPT, Claude, and other AI assistants. All content is CC0 public domain.',
  keywords: ['AI prompts', 'ChatGPT prompts', 'Claude prompts', 'prompt engineering', 'AI assistant', 'prompt library', 'public domain prompts'],
  authors: [{ name: 'AI Prompt Library' }],
  creator: 'AI Prompt Library',
  publisher: 'AI Prompt Library',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://prompt-library.vercel.app',
    siteName: 'AI Prompt Library',
    title: 'AI Prompt Library',
    description: 'A curated collection of high-quality AI prompts for the community',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AI Prompt Library',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Prompt Library',
    description: 'A curated collection of high-quality AI prompts for the community',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex min-h-screen flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100`}>
        <ThemeProvider>
          <NavBar />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
        <GoogleAnalytics />
      </body>
    </html>
  )
}
