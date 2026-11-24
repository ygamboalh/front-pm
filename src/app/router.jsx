import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AuthLayout from './layouts/AuthLayout';
import RootLayout from './layouts/RootLayout';
import ProtectedRoute from './components/ProtectedRoute';
import NotFoundPage from './pages/NotFoundPage';

const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'));
const InformesPage = lazy(() => import('@/features/informes/pages/InformesPage'));
const EncargosPage = lazy(() => import('@/features/encargos/pages/EncargosPage'));
const ComprasPage = lazy(() => import('@/features/compras/pages/ComprasPage'));
const CajaPage = lazy(() => import('@/features/caja/pages/CajaPage'));
const ProductosPage = lazy(() => import('@/features/productos/pages/ProductosPage'));
const ImpuestosPage = lazy(() => import('@/features/impuestos/pages/ImpuestosPage'));
const ConfiguracionPage = lazy(
  () => import('@/features/configuracion/pages/ConfiguracionPage'),
);
const DesignSystemPage = lazy(() => import('./pages/DesignSystemPage'));
const TiendaOnlinePage = lazy(
  () => import('@/features/tienda-online/pages/TiendaOnlinePage'),
);

export const router = createBrowserRouter([
  {
    path: '/tienda-online',
    element: <TiendaOnlinePage />,
  },
  {
    path: '/login',
    element: <AuthLayout />,
    children: [{ index: true, element: <LoginPage /> }],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <RootLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'informes', element: <InformesPage /> },
          { path: 'encargos', element: <EncargosPage /> },
          { path: 'compras', element: <ComprasPage /> },
          { path: 'caja', element: <CajaPage /> },
          { path: 'tienda', element: <ProductosPage mode="tienda" /> },
          { path: 'comprados', element: <ProductosPage mode="comprados" /> },
          { path: 'vendidos', element: <ProductosPage mode="vendidos" /> },
          { path: 'productos', element: <Navigate to="/tienda" replace /> },
          { path: 'impuestos', element: <ImpuestosPage /> },
          { path: 'configuracion', element: <ConfiguracionPage /> },
          ...(import.meta.env.DEV
            ? [{ path: 'dev/ui', element: <DesignSystemPage /> }]
            : []),
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
