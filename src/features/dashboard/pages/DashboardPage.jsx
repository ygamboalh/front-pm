import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  TbArrowRight,
  TbCircleCheck,
  TbCurrencyDollar,
  TbInfoCircle,
  TbPackage,
  TbScale,
  TbShoppingCart,
} from 'react-icons/tb';
import Card, { CardHeader } from '@/shared/components/ui/Card';
import Metric from '@/shared/components/ui/Metric';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import EmptyState from '@/shared/components/ui/EmptyState';
import ErrorState from '@/shared/components/ui/ErrorState';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableSkeleton,
} from '@/shared/components/ui/Table';
import { queryKeys } from '@/shared/api/queryKeys';
import { useAuthStore } from '@/features/auth/store/authStore';
import { formatDate, formatCup, formatNumber, formatUsd } from '@/shared/lib/formatters';
import { payStatusVariant } from '@/shared/lib/status';
import { cn } from '@/shared/lib/cn';
import { fetchDashboardOverview } from '../api';

const PENDING_COLUMNS = 5;

function OpenShoppingCard({ shopping }) {
  if (!shopping) {
    return (
      <Card>
        <CardHeader title="Compra abierta" description="Compra actualmente en curso" />
        <EmptyState
          icon={TbShoppingCart}
          title="No hay compra abierta"
          description="Abre una compra para empezar a registrar encargos y gastos."
          action={
            <Link
              to="/compras"
              className="inline-flex h-9 items-center rounded-lg bg-brand-600 px-3 text-sm font-medium text-white transition hover:bg-brand-500"
            >
              Ir a compras
            </Link>
          }
        />
      </Card>
    );
  }

  const rows = [
    { label: 'Peso total', value: `${formatNumber(shopping.totalWeight)} lb`, tone: 'text-ink-soft' },
    { label: 'Gasto en compra', value: formatCup(shopping.buySpent), tone: 'text-price' },
    { label: 'Gasto en envío', value: formatCup(shopping.shippingSpent), tone: 'text-price' },
    { label: 'Ganancia', value: formatCup(shopping.gain), tone: 'text-gain' },
    { label: 'Encargos', value: formatNumber(shopping.totalEncargos ?? 0), tone: 'text-ink' },
  ];

  return (
    <Card>
      <CardHeader
        title="Compra abierta"
        description="Compra actualmente en curso"
        actions={
          <Badge variant="brand">
            <TbCircleCheck size={13} aria-hidden="true" /> Abierta
          </Badge>
        }
      />
      <dl className="divide-y divide-line">
        {rows.map(({ label, value, tone }) => (
          <div key={label} className="flex items-center justify-between gap-3 px-5 py-3">
            <dt className="text-xs text-ink-muted">{label}</dt>
            <dd className={cn('text-sm font-semibold tabular-nums', tone)}>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="border-t border-line px-5 py-3">
        <Link
          to="/compras"
          className="inline-flex items-center gap-1 text-xs font-medium text-brand-300 hover:text-brand-200"
        >
          Ver compra <TbArrowRight size={13} aria-hidden="true" />
        </Link>
      </div>
    </Card>
  );
}

function EncargosSummaryCard({ counts }) {
  const total = counts?.total ?? 0;
  const pending = counts?.pending ?? 0;
  const delivered = counts?.delivered ?? 0;
  const progress = total > 0 ? Math.round((delivered / total) * 100) : 0;

  return (
    <Card>
      <CardHeader title="Resumen de encargos" description="Estado general de los encargos" />
      <div className="space-y-3 px-5 py-4">
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink-muted">Total</span>
          <span className="text-sm font-semibold text-ink">{formatNumber(total)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink-muted">Pendientes</span>
          <Badge variant={pending > 0 ? 'warning' : 'neutral'}>{formatNumber(pending)}</Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-ink-muted">Entregados</span>
          <Badge variant={delivered > 0 ? 'success' : 'neutral'}>
            {formatNumber(delivered)}
          </Badge>
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between text-[11px] text-ink-muted">
            <span>Progreso de entregas</span>
            <span className="font-semibold tabular-nums text-percent">{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-hover">
            <div
              className="h-full rounded-full bg-gain transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
      <div className="border-t border-line px-5 py-3">
        <Link
          to="/encargos"
          className="inline-flex items-center gap-1 text-xs font-medium text-brand-300 hover:text-brand-200"
        >
          Gestionar encargos <TbArrowRight size={13} aria-hidden="true" />
        </Link>
      </div>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-64" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={`stat-skeleton-${index}`} className="space-y-3 p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-3 w-32" />
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Encargos pendientes" description="Cargando…" />
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Cliente</TableHeaderCell>
                <TableHeaderCell>Producto</TableHeaderCell>
                <TableHeaderCell>Pago</TableHeaderCell>
                <TableHeaderCell>Tienda</TableHeaderCell>
                <TableHeaderCell>Fecha</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableSkeleton rows={4} columns={5} />
          </Table>
        </Card>
        <div className="space-y-4">
          <Card className="space-y-3 p-5">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </Card>
          <Card className="space-y-3 p-5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const overviewQuery = useQuery({
    queryKey: queryKeys.dashboard.overview,
    queryFn: fetchDashboardOverview,
    retry: 1,
    staleTime: 60 * 1000,
  });

  const displayName = user?.username || user?.email?.split('@')[0] || 'equipo';
  const data = overviewQuery.data;
  const configuration = data?.configuration ?? null;
  const counts = data?.counts ?? { total: 0, pending: 0, delivered: 0 };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm text-ink-muted">Panel de administración</p>
          <h2 className="mt-1 text-2xl font-semibold capitalize text-ink">
            Hola, {displayName} 👋
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Resumen de tu negocio conectado a Strapi en tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success">
            <span className="h-1.5 w-1.5 rounded-full bg-gain" /> Datos en vivo
          </Badge>
          <Button variant="secondary" size="sm" onClick={() => navigate('/configuracion')}>
            Configuración
          </Button>
        </div>
      </header>

      {overviewQuery.isError ? (
        <Card>
          <ErrorState
            title="No se pudo cargar el panel"
            error={overviewQuery.error}
            onRetry={overviewQuery.refetch}
          />
        </Card>
      ) : overviewQuery.isLoading ? (
        <DashboardSkeleton />
      ) : (
        <>
          {!configuration ? (
            <Card className="border-price/25 bg-price/10">
              <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                <div className="flex items-start gap-3">
                  <TbInfoCircle
                    size={18}
                    className="mt-0.5 shrink-0 text-price"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm font-medium text-price">
                      Configura los precios del negocio
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-price/85">
                      Aún no hay una configuración publicada. Define el precio del Zelle y de
                      la libra para empezar a calcular ganancias.
                    </p>
                  </div>
                </div>
                <Button size="sm" onClick={() => navigate('/configuracion')}>
                  Configurar ahora
                </Button>
              </div>
            </Card>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              label="Precio del Zelle"
              value={configuration ? formatCup(configuration.usdPrice) : '—'}
              hint={configuration ? 'Moneda local por USD' : 'Sin configurar'}
              icon={TbCurrencyDollar}
              tone="price"
              footer={
                <Link
                  to="/configuracion"
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand-300 hover:text-brand-200"
                >
                  Editar <TbArrowRight size={13} aria-hidden="true" />
                </Link>
              }
            />
            <Metric
              label="Precio de la libra"
              value={configuration ? formatUsd(configuration.poundPrice) : '—'}
              hint={configuration ? 'Coste por libra de envío' : 'Sin configurar'}
              icon={TbScale}
              tone="price"
              footer={
                <Link
                  to="/configuracion"
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand-300 hover:text-brand-200"
                >
                  Editar <TbArrowRight size={13} aria-hidden="true" />
                </Link>
              }
            />
            <Metric
              label="Encargos pendientes"
              value={formatNumber(counts.pending)}
              hint={`${formatNumber(counts.total)} encargos en total`}
              icon={TbPackage}
              tone="warning"
            />
            <Metric
              label="Encargos entregados"
              value={formatNumber(counts.delivered)}
              hint={
                counts.total > 0
                  ? `${Math.round((counts.delivered / counts.total) * 100)}% del total`
                  : 'Todavía sin encargos'
              }
              icon={TbCircleCheck}
              tone="gain"
            />
          </div>

          <div className="grid items-start gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader
                title="Encargos pendientes"
                description="Últimos encargos sin entregar"
                actions={
                  <Link
                    to="/encargos"
                    className="inline-flex items-center gap-1 text-xs font-medium text-brand-300 hover:text-brand-200"
                  >
                    Ver todos <TbArrowRight size={13} aria-hidden="true" />
                  </Link>
                }
              />
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Cliente</TableHeaderCell>
                    <TableHeaderCell>Producto</TableHeaderCell>
                    <TableHeaderCell>Pago</TableHeaderCell>
                    <TableHeaderCell>Tienda</TableHeaderCell>
                    <TableHeaderCell>Fecha</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.pendingEncargos.length === 0 ? (
                    <TableEmpty
                      colSpan={PENDING_COLUMNS}
                      icon={TbCircleCheck}
                      title="Todo al día"
                      description="No hay encargos pendientes de entrega."
                    />
                  ) : (
                    data.pendingEncargos.map((encargo) => (
                      <TableRow key={encargo.documentId || encargo.id}>
                        <TableCell className="font-medium text-ink">
                          {encargo.ownerName || '—'}
                        </TableCell>
                        <TableCell className="max-w-[220px] truncate">
                          {encargo.productDescription || '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={payStatusVariant(encargo.payStatus)}>
                            {encargo.payStatus || 'Sin estado'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-ink-muted">{encargo.shopName || '—'}</TableCell>
                        <TableCell className="whitespace-nowrap text-ink-muted">
                          {formatDate(encargo.encargoCreatedAt)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>

            <div className="space-y-4">
              <OpenShoppingCard shopping={data.openShopping} />
              <EncargosSummaryCard counts={counts} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
