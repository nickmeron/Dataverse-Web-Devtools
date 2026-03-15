import { type ReactNode, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: (failureCount, error) => {
              // Don't retry on 4xx errors (except 429)
              if (
                error &&
                'status' in error &&
                typeof error.status === 'number'
              ) {
                if (error.status >= 400 && error.status < 500 && error.status !== 429) {
                  return false;
                }
              }
              return failureCount < 3;
            },
            staleTime: 30 * 1000, // 30 seconds default
            gcTime: 10 * 60 * 1000, // 10 minutes default
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
