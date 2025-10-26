import Script from "next/script";
import { Inter } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Gráfica Digital Pro',
  description: 'Sistema completo para gestão de gráfica digital',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <Script id="theme-no-flash" strategy="beforeInteractive">{`
          (function() {
            try {
              var t = localStorage.getItem('theme');
              var m = window.matchMedia('(prefers-color-scheme: dark)');
              if (t === 'dark' || (!t && m.matches)) document.documentElement.classList.add('dark');
              else document.documentElement.classList.remove('dark');
            } catch(e) {}
          })();
        `}</Script>
      </head>
      <body className={`${inter.className} min-h-screen antialiased`}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}