import type {Metadata} from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import { InitProvider } from '@/components/InitProvider';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Siroi Forex Dashboard',
  description: 'Financial dashboard for Siroi Forex',
  robots: {
    index: false,
    follow: false,
  }
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="font-sans antialiased min-h-screen flex flex-col" suppressHydrationWarning>
        <ThemeProvider>
          <InitProvider>
             {children}
          </InitProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
