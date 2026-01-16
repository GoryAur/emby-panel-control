'use client';

import { Toaster } from 'sonner';

export function Providers({ children }) {
  return (
    <>
      {children}
      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          style: {
            background: '#0a0a0a',
            border: '1px solid #333',
            color: '#fff',
          },
        }}
      />
    </>
  );
}
