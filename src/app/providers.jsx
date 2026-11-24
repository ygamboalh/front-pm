import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30 * 1000,
    },
    mutations: {
      retry: 0,
    },
  },
});

export default function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '10px',
            background: '#0D1526',
            border: '1px solid #1F2B45',
            color: '#E8EEF9',
            fontSize: '13px',
          },
          success: { iconTheme: { primary: '#34D399', secondary: '#0D1526' } },
          error: { iconTheme: { primary: '#FB7185', secondary: '#0D1526' } },
        }}
      />
    </QueryClientProvider>
  );
}
