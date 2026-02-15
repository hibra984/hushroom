import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    template: '%s | Hushroom',
    default: 'Hushroom \u2014 Structured Human Presence Platform',
  },
  description:
    'Connect with trained human companions for focused, structured sessions. Set goals, stay accountable, and achieve more with real human presence.',
  keywords: [
    'accountability partner',
    'focused sessions',
    'presence companion',
    'goal achievement',
    'structured sessions',
    'human presence',
    'productivity',
    'study buddy',
  ],
  openGraph: {
    title: 'Hushroom \u2014 Structured Human Presence Platform',
    description:
      'Connect with trained human companions for focused, structured sessions. Set goals, stay accountable, and achieve more.',
    siteName: 'Hushroom',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hushroom \u2014 Structured Human Presence Platform',
    description:
      'Focused accountability sessions with trained human companions.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
