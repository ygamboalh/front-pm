import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import Providers from '@/app/providers';
import { router } from '@/app/router';
import Spinner from '@/shared/components/ui/Spinner';
import '@/index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Providers>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-canvas">
            <Spinner size="lg" className="text-brand-300" label="Cargando aplicación" />
          </div>
        }
      >
        <RouterProvider router={router} />
      </Suspense>
    </Providers>
  </StrictMode>,
);
