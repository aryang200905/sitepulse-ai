import type { Metadata } from 'next';
import { AuthProvider } from '@/components/AuthProvider';
import { ThemeProvider, THEME_INIT_SCRIPT } from '@/components/ThemeProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'SitePulse AI — Instant SEO & AEO Intelligence',
  description:
    'Analyze any URL and get prioritised, copy-ready recommendations to rank higher in search and get cited by AI engines.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply the saved theme before paint to avoid a flash. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
