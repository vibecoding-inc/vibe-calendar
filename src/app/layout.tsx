import type { Metadata } from 'next';
import './globals.css';

import { Providers } from '@/components/Providers';

import { Header } from '@/components/Header';

export const metadata: Metadata = {
  title: 'Vibe Calendar',
  description: 'AI-powered time-boxing productivity tool',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body
        className="bg-background text-text-primary antialiased font-sans"
      >
        <Providers>
          <Header />
          <main className="p-8 max-w-7xl mx-auto">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
