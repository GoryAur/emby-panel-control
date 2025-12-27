import './globals.css';

export const metadata = {
  title: 'Panel de Control - Emby',
  description: 'Panel de administración para gestionar usuarios de Emby',
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning className="dark-mode">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const savedMode = localStorage.getItem('darkMode');
                if (savedMode === 'false') {
                  document.documentElement.classList.remove('dark-mode');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
