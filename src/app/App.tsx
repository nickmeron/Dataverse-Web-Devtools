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
            background: isDark ? '#1d1d1f' : '#ffffff',
            color: isDark ? '#f5f5f7' : '#1d1d1f',
            border: isDark
              ? '1px solid rgba(66, 66, 69, 0.6)'
              : '1px solid rgba(210, 210, 215, 0.6)',
            borderRadius: '14px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            fontSize: '0.875rem',
          },
          success: {
            iconTheme: {
              primary: isDark ? '#30d158' : '#03a10e',
              secondary: isDark ? '#1d1d1f' : '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: isDark ? '#ff453a' : '#e30000',
              secondary: isDark ? '#1d1d1f' : '#ffffff',
            },
          },
        }}
      />
      <AppLayout />
      <Dialogs />
    </>
  );
}
