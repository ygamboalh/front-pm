import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-sm font-semibold text-brand-300">404</p>
      <h1 className="text-2xl font-semibold text-ink">Página no encontrada</h1>
      <p className="max-w-sm text-sm text-ink-muted">
        La ruta que buscas no existe o fue movida. Vuelve al panel para continuar.
      </p>
      <Link
        to="/"
        className="mt-2 inline-flex h-10 items-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white transition hover:bg-brand-500"
      >
        Volver al panel
      </Link>
    </div>
  );
}
