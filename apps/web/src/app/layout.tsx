/**
 * @fileoverview Root layout component for TovoCL restaurant management system
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers/Providers';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TovoCL - Restaurant Management System',
  description: 'Modern restaurant management system built with React + Node.js microservices',
  keywords: ['restaurant', 'management', 'pos', 'kitchen', 'orders', 'inventory'],
  authors: [{ name: 'TovoCL Team' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
