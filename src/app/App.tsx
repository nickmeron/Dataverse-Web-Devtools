import { useEffect } from 'react';
import { AppLayout } from '@/shared/components/Layout';
import { Toaster } from 'react-hot-toast';
import { useUiStore } from '@/shared/stores/uiStore';
import { Dialogs } from '@/shared/components/Dialogs';

export function App() {
  const theme = useUiStore((s) => s.theme);

  // Sync theme class to <html> so CSS custom properties update
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(theme);
  }, [theme]);

  const isDark = theme === 'dark';

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: isDark ? '#1e293b' : '#ffffff',
            color: isDark ? '#e2e8f0' : '#1e293b',
            border: isDark
              ? '1px solid rgba(51, 65, 85, 0.5)'
              : '1px solid rgba(226, 232, 240, 0.8)',
            fontSize: '0.875rem',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: isDark ? '#1e293b' : '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: isDark ? '#1e293b' : '#ffffff',
            },
          },
        }}
      />
      <AppLayout />
      <Dialogs />
    </>
  );
}
