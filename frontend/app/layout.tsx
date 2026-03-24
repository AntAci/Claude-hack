import type { CSSProperties, ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style>{`html, body { margin: 0; padding: 0; }`}</style>
      </head>
      <body
        style={
          {
            '--font-display': '"Avenir Next Condensed", "Segoe UI", sans-serif',
            '--font-body': '"Avenir Next", "Segoe UI", sans-serif',
            margin: 0,
            minHeight: '100vh',
          } as CSSProperties
        }
      >
        {children}
      </body>
    </html>
  );
}
