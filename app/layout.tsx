import type {Metadata} from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { SiteShell } from '@/components/site-shell';

export const metadata: Metadata = {
  title: 'DANANA',
  description: 'Shop online with DANANA',
};

export default function RootLayout({children}: {children: ReactNode}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen text-black bg-white" suppressHydrationWarning>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
