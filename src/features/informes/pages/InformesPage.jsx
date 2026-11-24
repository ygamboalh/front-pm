import {
  TbArchive,
  TbBuildingStore,
  TbCash,
  TbChartBar,
  TbPackage,
  TbShoppingCart,
  TbTruckDelivery,
  TbWeight,
} from 'react-icons/tb';
import PageHeader from '@/shared/components/ui/PageHeader';
import Card, { CardHeader } from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
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
} from '@/shared/components/ui/Table';
import { formatCup, formatNumber, formatUsd } from '@/shared/lib/formatters';
import { cn } from '@/shared/lib/cn';
import { useReports } from '../hooks';

const percentFormatter = new Intl.NumberFormat('es-ES', {
  maximumFractionDigits: 1,
});

function formatPercent(value) {
  return `${percentFormatter.format(Number(value) || 0)} %`;
}

function valueTone(value) {
  return (Number(value) || 0) >= 0 ? 'text-gain' : 'text-danger';
}

function percentTone(value) {
  return (Number(value) || 0) >= 0 ? 'text-percent' : 'text-danger';
}

function capitalize(value) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function ReportStat({ label, value, hint, tone = 'text-ink', icon: Icon }) {
  return (
    <div className="rounded-lg border border-line bg-canvas/40 px-4 py-3">
      <div className="flex items-center gap-1.5">
        {Icon ? <Icon size={14} className="text-ink-faint" aria-hidden="true" /> : null}
        <p className="text-[10px] font-medium uppercase tracking-wide text-ink-faint">
          {label}
        </p>
      </div>
      <p className={cn('mt-1 text-lg font-semibold tabular-nums', tone)}>{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-ink-muted">{hint}</p> : null}
    </div>
  );
}

function ReportsSkeleton() {
  return (
    <div className="space-y-5">
      {[0, 1].map((section) => (
        <Card key={section} className="p-5">
          <Skeleton className="h-4 w-44" />
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-20" />
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

function TotalRow({ children }) {
  return (
    <tfoot className="bg-surface-raised/60 text-xs">
      <TableRow className="hover:bg-transparent">{children}</TableRow>
    </tfoot>
  );
}

export default function InformesPage() {
  const reportQuery = useReports();
  const data = reportQuery.data;

  const monthLabel = capitalize(
    new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(new Date()),
  );

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="General"
        title="Informes"
        description="Resumen general del negocio, inventario y ventas por categoría."
        actions={<Badge variant="brand">{monthLabel}</Badge>}
      />

      {reportQuery.isError ? (
        <ErrorState
          title="No se pudieron cargar los informes"
          error={reportQuery.error}
          onRetry={reportQuery.refetch}
        />
      ) : reportQuery.isLoading || !data ? (
        <ReportsSkeleton />
      ) : (
        <>
          <Card>
            <CardHeader
              title="Resumen general"
              description="Compras, envíos y encargos acumulados."
            />
            <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <ReportStat
                icon={TbCash}
                label="Precio USD"
                value={formatCup(data.general.usdPrice)}
                hint="Precio de compra del Zelle"
                tone="text-price"
              />
              <ReportStat
                icon={TbWeight}
                label="Precio de la libra"
                value={formatUsd(data.general.poundPrice)}
                hint="Costo por libra enviada"
                tone="text-price"
              />
              <ReportStat
                icon={TbShoppingCart}
                label="Compras"
                value={formatNumber(data.general.shoppingCount)}
                hint={`${formatNumber(data.general.closedShoppingCount)} cerradas`}
              />
              <ReportStat
                icon={TbTruckDelivery}
                label="Gasto total"
                value={formatCup(data.general.totalSpent)}
                hint="Compras cerradas"
                tone="text-price"
              />
              <ReportStat
                icon={TbTruckDelivery}
                label="Total en envíos"
                value={formatCup(data.general.totalShippingSpent)}
                hint="Gasto acumulado en envío"
                tone="text-price"
              />
              <ReportStat
                icon={TbWeight}
                label="Total peso"
                value={`${formatNumber(data.general.totalWeight)} lb`}
                hint="Libras enviadas"
              />
              <ReportStat
                icon={TbPackage}
                label="Total encargos"
                value={formatNumber(data.general.totalEncargos)}
                hint="Encargos registrados"
              />
              <ReportStat
                icon={TbArchive}
                label="Encargos pendientes"
                value={formatNumber(data.general.pendingEncargos)}
                hint="Pendientes de entregar"
              />
              <ReportStat
                icon={TbTruckDelivery}
                label="Encargos entregados"
                value={formatNumber(data.general.deliveredEncargos)}
                hint="Completados"
                tone="text-gain"
              />
              <ReportStat
                icon={TbCash}
                label="Ganancias reales"
                value={formatCup(data.general.realGain)}
                hint="Ventas concretadas"
                tone={valueTone(data.general.realGain)}
              />
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Estado del negocio"
              description="Inversión, mercancía disponible y resultado de las ventas."
            />
            <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <ReportStat
                icon={TbBuildingStore}
                label="Productos en stock"
                value={formatNumber(data.business.stockCount)}
                hint={`${formatCup(data.business.stockInvestment)} invertidos`}
                tone="text-gain"
              />
              <ReportStat
                icon={TbPackage}
                label="En gestor"
                value={formatNumber(data.business.vendorCount)}
                hint="Asignados a vendedores"
                tone="text-percent"
              />
              <ReportStat
                icon={TbTruckDelivery}
                label="Productos comprados"
                value={formatNumber(data.business.purchasedCount)}
                hint={`${formatCup(data.business.purchaseInvestment)} en camino`}
                tone="text-price"
              />
              <ReportStat
                icon={TbArchive}
                label="Productos vendidos"
                value={formatNumber(data.business.soldCount)}
                hint={`${formatCup(data.business.soldAmount)} recuperados`}
                tone="text-brand-300"
              />
              <ReportStat
                icon={TbCash}
                label="Ganancia virtual"
                value={formatCup(data.business.virtualGain)}
                hint="Según el precio de venta del stock"
                tone={valueTone(data.business.virtualGain)}
              />
              <ReportStat
                icon={TbCash}
                label="Ganancia real"
                value={formatCup(data.business.realGain)}
                hint="Ventas concretadas"
                tone={valueTone(data.business.realGain)}
              />
              <ReportStat
                icon={TbWeight}
                label="Libras de compras"
                value={`${formatNumber(data.business.purchasePounds)} lb`}
                hint="Pendientes de enviar"
              />
              <ReportStat
                icon={TbWeight}
                label="Libras de encargos"
                value={`${formatNumber(data.business.encargoPounds)} lb`}
                hint="Pendientes de entregar"
              />
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Ventas del mes por categoría"
              description="Costo, recuperación y ganancia real de los productos vendidos."
              actions={<Badge variant="brand">{monthLabel}</Badge>}
            />
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Categoría</TableHeaderCell>
                  <TableHeaderCell align="right">Artículos</TableHeaderCell>
                  <TableHeaderCell align="right">Costo</TableHeaderCell>
                  <TableHeaderCell align="right">Recuperado</TableHeaderCell>
                  <TableHeaderCell align="right">Ganancia</TableHeaderCell>
                  <TableHeaderCell align="right">% ganancia</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.sold.totals.count === 0 ? (
                  <TableEmpty
                    colSpan={6}
                    icon={TbChartBar}
                    title="Sin ventas este mes"
                    description="Las ventas del mes aparecerán aquí agrupadas por categoría."
                  />
                ) : (
                  data.sold.rows.map((row) => (
                    <TableRow key={row.category}>
                      <TableCell className="font-medium text-ink">{row.category}</TableCell>
                      <TableCell align="right" className="tabular-nums">
                        {formatNumber(row.count)}
                      </TableCell>
                      <TableCell align="right" className="tabular-nums">
                        {formatCup(row.cost)}
                      </TableCell>
                      <TableCell
                        align="right"
                        className="whitespace-nowrap font-semibold tabular-nums !text-price"
                      >
                        {formatCup(row.amount)}
                      </TableCell>
                      <TableCell
                        align="right"
                        className={cn(
                          'whitespace-nowrap font-semibold tabular-nums',
                          valueTone(row.gain),
                        )}
                      >
                        {formatCup(row.gain)}
                      </TableCell>
                      <TableCell
                        align="right"
                        className={cn(
                          'whitespace-nowrap font-semibold tabular-nums',
                          percentTone(row.percent),
                        )}
                      >
                        {formatPercent(row.percent)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              <TotalRow>
                <TableCell className="font-semibold text-ink">Total</TableCell>
                <TableCell align="right" className="font-semibold tabular-nums text-ink">
                  {formatNumber(data.sold.totals.count)}
                </TableCell>
                <TableCell align="right" className="font-semibold tabular-nums text-ink">
                  {formatCup(data.sold.totals.cost)}
                </TableCell>
                <TableCell
                  align="right"
                  className="font-semibold tabular-nums !text-price"
                >
                  {formatCup(data.sold.totals.amount)}
                </TableCell>
                <TableCell
                  align="right"
                  className={cn(
                    'font-semibold tabular-nums',
                    valueTone(data.sold.totals.gain),
                  )}
                >
                  {formatCup(data.sold.totals.gain)}
                </TableCell>
                <TableCell
                  align="right"
                  className={cn(
                    'font-semibold tabular-nums',
                    percentTone(data.sold.totals.percent),
                  )}
                >
                  {formatPercent(data.sold.totals.percent)}
                </TableCell>
              </TotalRow>
            </Table>
          </Card>

          <Card>
            <CardHeader
              title="Inventario comprado por categoría"
              description="Mercancía comprada pendiente de recibir, su inversión y ganancia planificada."
            />
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Categoría</TableHeaderCell>
                  <TableHeaderCell align="right">Artículos</TableHeaderCell>
                  <TableHeaderCell align="right">Inversión</TableHeaderCell>
                  <TableHeaderCell align="right">Ganancia plan.</TableHeaderCell>
                  <TableHeaderCell align="right">% ganancia</TableHeaderCell>
                  <TableHeaderCell align="right">% inversión</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.inventory.totals.count === 0 ? (
                  <TableEmpty
                    colSpan={6}
                    icon={TbPackage}
                    title="Sin mercancía en camino"
                    description="Los productos comprados aparecerán aquí agrupados por categoría."
                  />
                ) : (
                  data.inventory.rows.map((row) => (
                    <TableRow key={row.category}>
                      <TableCell className="font-medium text-ink">{row.category}</TableCell>
                      <TableCell align="right" className="tabular-nums">
                        {formatNumber(row.count)}
                      </TableCell>
                      <TableCell
                        align="right"
                        className="whitespace-nowrap font-semibold tabular-nums !text-price"
                      >
                        {formatCup(row.investment)}
                      </TableCell>
                      <TableCell
                        align="right"
                        className={cn(
                          'whitespace-nowrap font-semibold tabular-nums',
                          valueTone(row.gain),
                        )}
                      >
                        {formatCup(row.gain)}
                      </TableCell>
                      <TableCell
                        align="right"
                        className={cn(
                          'whitespace-nowrap font-semibold tabular-nums',
                          percentTone(row.percent),
                        )}
                      >
                        {formatPercent(row.percent)}
                      </TableCell>
                      <TableCell
                        align="right"
                        className="whitespace-nowrap font-semibold tabular-nums text-percent"
                      >
                        {formatPercent(row.share)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              <TotalRow>
                <TableCell className="font-semibold text-ink">Total</TableCell>
                <TableCell align="right" className="font-semibold tabular-nums text-ink">
                  {formatNumber(data.inventory.totals.count)}
                </TableCell>
                <TableCell
                  align="right"
                  className="font-semibold tabular-nums !text-price"
                >
                  {formatCup(data.inventory.totals.investment)}
                </TableCell>
                <TableCell
                  align="right"
                  className={cn(
                    'font-semibold tabular-nums',
                    valueTone(data.inventory.totals.gain),
                  )}
                >
                  {formatCup(data.inventory.totals.gain)}
                </TableCell>
                <TableCell
                  align="right"
                  className={cn(
                    'font-semibold tabular-nums',
                    percentTone(data.inventory.totals.percent),
                  )}
                >
                  {formatPercent(data.inventory.totals.percent)}
                </TableCell>
                <TableCell align="right" className="font-semibold tabular-nums text-percent">
                  {formatPercent(100)}
                </TableCell>
              </TotalRow>
            </Table>
          </Card>
        </>
      )}
    </div>
  );
}
