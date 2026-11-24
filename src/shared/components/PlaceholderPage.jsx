import { TbRocket } from 'react-icons/tb';
import Card from './ui/Card';
import Badge from './ui/Badge';

export default function PlaceholderPage({ title, description, phase, icon: Icon = TbRocket }) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-ink">{title}</h1>
        <p className="mt-1 text-sm text-ink-muted">{description}</p>
      </header>

      <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-300">
          <Icon size={26} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-ink">Módulo en construcción</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">
            La base, la capa de conexión con Strapi y la autenticación ya están listas. Esta
            pantalla se implementa en la siguiente fase del plan.
          </p>
        </div>
        <Badge variant="brand">{phase}</Badge>
      </Card>
    </div>
  );
}
