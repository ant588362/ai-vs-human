import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/ThemeProvider';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://aivshuman.vercel.app';

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export const metadata: Metadata = {
  title: 'AI vs Human — Daily Puzzle',
  description: 'Can you tell AI-generated content from human-made? Play the daily puzzle — 5 items, guess which is which.',
  metadataBase: new URL(APP_URL),
  openGraph: {
    title: 'AI vs Human — Daily Puzzle',
    description: 'Can you tell AI-generated content from human-made? Play the daily 5-round puzzle.',
    url: APP_URL,
    siteName: 'AI vs Human',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'AI vs Human Daily Puzzle' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI vs Human — Daily Puzzle',
    description: 'Can you tell AI-generated content from human-made?',
    images: ['/og.png'],
  },
  icons: {
    icon: [
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
