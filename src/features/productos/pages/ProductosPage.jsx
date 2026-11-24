import { useEffect, useMemo, useState } from 'react';
import {
  TbBox,
  TbCalendarMonth,
  TbEye,
  TbFilterOff,
  TbPencil,
  TbPhoto,
  TbPlus,
  TbSearch,
  TbShoppingCart,
  TbSun,
  TbTrash,
  TbUserCheck,
} from 'react-icons/tb';
import toast from 'react-hot-toast';
import PageHeader from '@/shared/components/ui/PageHeader';
import Card, { CardHeader } from '@/shared/components/ui/Card';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import Select from '@/shared/components/ui/Select';
import Badge from '@/shared/components/ui/Badge';
import Pagination from '@/shared/components/ui/Pagination';
import Spinner from '@/shared/components/ui/Spinner';
import ErrorState from '@/shared/components/ui/ErrorState';
import ConfirmDialog from '@/shared/components/ui/ConfirmDialog';
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
import { resolveMediaThumbnail } from '@/shared/api/media';
import { getApiErrorMessage } from '@/shared/api/strapiClient';
import { formatDate, formatCup, formatNumber, formatUsd } from '@/shared/lib/formatters';
import { SENT_BY_LABELS } from '@/shared/lib/constants';
import { deliveredStatusVariant } from '@/shared/lib/status';
import { cn } from '@/shared/lib/cn';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useDisclosure } from '@/shared/hooks/useDisclosure';
import { useConfiguration } from '@/features/configuracion/hooks';
import { computeProductCosts, computeSuggestedPrice } from '../schema';
import {
  PRODUCT_CATEGORY_OPTIONS,
  toSelectOptions,
} from '../constants';
import {
  useDeleteProduct,
  useMarkProductSold,
  useProductStats,
  useProductTypes,
  useProducts,
  useRegisterSaleInCash,
  useReturnProductToStore,
  useSalesSummary,
} from '../hooks';
import ProductFormModal from '../components/ProductFormModal';
import ProductDetailModal from '../components/ProductDetailModal';
import ProductVendorModal from '../components/ProductVendorModal';

const PAGE_SIZE = 10;
const percentFormatter = new Intl.NumberFormat('es-ES', {
  maximumFractionDigits: 1,
});
const STOCK_OPTIONS = [
  { value: '', label: 'Todo el inventario' },
  { value: 'stock', label: 'En stock' },
  { value: 'vendor', label: 'En gestor' },
];

const MODES = {
  tienda: {
    status: 'Recibido',
    title: 'Tienda',
    description: 'Productos recibidos y disponibles para la venta.',
    tableTitle: 'Productos en tienda',
    emptyTitle: 'No hay productos recibidos',
    emptyDescription: 'Los productos aparecerán aquí cuando marques su llegada.',
    showCreate: false,
    showReport: true,
    showVendor: true,
    showStats: true,
    sellAction: 'sell',
    dateFilter: false,
    stockFilter: true,
    soldColumns: false,
    purchaseColumns: false,
    columnCount: 9,
    sort: 'productCreatedAt:desc',
    wideTable: true,
  },
  comprados: {
    status: 'Comprado',
    title: 'Comprados',
    description: 'Productos comprados pendientes de recibir.',
    tableTitle: 'Productos comprados',
    emptyTitle: 'No hay productos comprados',
    emptyDescription: 'Registra un producto para empezar a controlar tus compras.',
    showCreate: true,
    showReport: false,
    showVendor: false,
    showStats: false,
    sellAction: 'detail',
    dateFilter: false,
    stockFilter: false,
    soldColumns: false,
    purchaseColumns: true,
    columnCount: 10,
    sort: 'buyDate:asc',
    wideTable: true,
  },
  vendidos: {
    status: 'Vendido',
    title: 'Vendidos',
    description: 'Productos vendidos y su resultado.',
    tableTitle: 'Productos vendidos',
    emptyTitle: 'Todavía no hay ventas',
    emptyDescription: 'Los productos vendidos aparecerán en esta lista.',
    showCreate: false,
    showReport: false,
    showVendor: false,
    showStats: false,
    sellAction: 'manage',
    dateFilter: true,
    stockFilter: false,
    soldColumns: true,
    purchaseColumns: false,
    columnCount: 7,
    sort: 'productCreatedAt:desc',
    wideTable: false,
  },
};

function isInStock(product) {
  const vendor = (product.takenByVendor || '').trim();
  return !vendor || vendor === 'En stock' || vendor === 'No asignado';
}

function capitalize(value) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function CompactStat({ label, value, tone }) {
  return (
    <div className="flex flex-col leading-tight">
      <span className="text-[10px] font-medium uppercase tracking-wide text-ink-faint">
        {label}
      </span>
      <span className={cn('text-sm font-semibold tabular-nums', tone)}>{value}</span>
    </div>
  );
}

function SalesMiniRow({ title, subtitle, icon: Icon, tone, data, loading }) {
  const isToday = tone === 'today';
  const amount = Number(data.amount) || 0;
  const gain = Number(data.gain) || 0;
  const cost = Math.max(0, amount - gain);
  const percent = cost > 0 ? (gain / cost) * 100 : 0;

  return (
    <div className="flex items-center gap-2 px-2 py-1.5">
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-md ring-1 ring-inset',
          isToday
            ? 'bg-price/10 text-price ring-price/20'
            : 'bg-percent/10 text-percent ring-percent/20',
        )}
      >
        <Icon size={14} aria-hidden="true" />
      </span>

      <div className="min-w-0 w-[110px] shrink-0">
        <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-ink-soft">
          {title}
        </p>
        <p className="truncate text-[9px] text-ink-faint">{subtitle}</p>
      </div>

      <div className="ml-auto flex items-center gap-3 text-right">
        <div>
          <p className="whitespace-nowrap text-[9px] uppercase tracking-wide text-ink-faint">
            Productos
          </p>
          <p className="text-sm font-semibold tabular-nums text-ink">
            {loading ? '—' : formatNumber(data.count)}
          </p>
        </div>
        <div>
          <p className="whitespace-nowrap text-[9px] uppercase tracking-wide text-ink-faint">
            Importe
          </p>
          <p className="text-sm font-semibold tabular-nums text-price">
            {loading ? '—' : formatCup(data.amount)}
          </p>
        </div>
        <div>
          <p className="whitespace-nowrap text-[9px] uppercase tracking-wide text-ink-faint">
            Ganancia
          </p>
          <p
            className={cn(
              'text-sm font-semibold tabular-nums',
              (data.gain || 0) >= 0 ? 'text-gain' : 'text-danger',
            )}
          >
            {loading ? '—' : formatCup(data.gain)}
          </p>
        </div>
        <div title="Porcentaje de ganancia sobre el coste">
          <p className="whitespace-nowrap text-[9px] uppercase tracking-wide text-ink-faint">
            % ganancia
          </p>
          <p
            className={cn(
              'text-sm font-semibold tabular-nums',
              percent >= 0 ? 'text-percent' : 'text-danger',
            )}
          >
            {loading ? '—' : `${percentFormatter.format(percent)} %`}
          </p>
        </div>
      </div>
    </div>
  );
}

function ActionIcon({ label, onClick, children, danger = false, tone = 'default' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'rounded-md p-1.5 transition',
        danger
          ? 'text-ink-faint hover:bg-danger/10 hover:text-danger'
          : tone === 'percent'
            ? 'text-ink-faint hover:bg-percent/10 hover:text-percent'
            : tone === 'warning'
              ? 'text-price/80 hover:bg-price/10 hover:text-price'
              : 'text-ink-faint hover:bg-surface-hover hover:text-ink-soft',
      )}
    >
      {children}
    </button>
  );
}

export default function ProductosPage({ mode = 'tienda' }) {
  const config = MODES[mode] || MODES.tienda;
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const [saleDate, setSaleDate] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [vendorTarget, setVendorTarget] = useState(null);
  const [returnTarget, setReturnTarget] = useState(null);

  const formModal = useDisclosure();
  const detailModal = useDisclosure();
  const deleteDialog = useDisclosure();
  const vendorModal = useDisclosure();
  const returnDialog = useDisclosure();

  const filters = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      search: debouncedSearch,
      status: config.status,
      category,
      stock: config.dateFilter ? '' : stock,
      soldDate: config.dateFilter ? saleDate : '',
      sort: config.sort,
    }),
    [
      page,
      debouncedSearch,
      config.status,
      config.dateFilter,
      config.sort,
      category,
      stock,
      saleDate,
    ],
  );

  const productsQuery = useProducts(filters);
  const typesQuery = useProductTypes();
  const statsQuery = useProductStats(config.status, { enabled: config.showStats });
  const salesQuery = useSalesSummary();
  const configurationQuery = useConfiguration();
  const markProductSold = useMarkProductSold();
  const registerSaleInCash = useRegisterSaleInCash();
  const returnProductToStore = useReturnProductToStore();
  const deleteProduct = useDeleteProduct();

  const items = useMemo(() => productsQuery.data?.items ?? [], [productsQuery.data]);
  const meta = productsQuery.data?.meta ?? { page: 1, pageCount: 1, total: 0 };

  const categoryOptions = useMemo(() => {
    const types = typesQuery.data ?? [];
    const base = types.length > 0 ? types : PRODUCT_CATEGORY_OPTIONS;
    const legacy = PRODUCT_CATEGORY_OPTIONS.filter((value) => !base.includes(value));
    return toSelectOptions([...base, ...legacy]);
  }, [typesQuery.data]);
  const stats = statsQuery.data ?? null;
  const sales = salesQuery.data ?? {
    today: { count: 0, amount: 0, gain: 0 },
    month: { count: 0, amount: 0, gain: 0 },
  };
  const currentUsdPrice = Number(configurationQuery.data?.usdPrice) || 0;
  const hasFilters = config.dateFilter
    ? Boolean(debouncedSearch || category || saleDate)
    : Boolean(debouncedSearch || category || stock);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, stock, saleDate]);

  const openCreate = () => {
    setEditing(null);
    formModal.open();
  };

  const openDetail = (product) => {
    setSelected(product);
    detailModal.open();
  };

  const openEdit = (product) => {
    detailModal.close();
    setEditing(product);
    formModal.open();
  };

  const openVendor = (product) => {
    detailModal.close();
    setVendorTarget(product);
    vendorModal.open();
  };

  const requestDelete = (product) => {
    detailModal.close();
    setDeleteTarget(product);
    deleteDialog.open();
  };

  const requestReturn = (product) => {
    detailModal.close();
    setReturnTarget(product);
    returnDialog.open();
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setStock('');
    setSaleDate('');
  };

  const handleMarkSold = async (soldPrice) => {
    if (!selected) return;

    try {
      const currentUsdPrice = Number(configurationQuery.data?.usdPrice) || 0;
      const saleCost =
        currentUsdPrice > 0
          ? computeProductCosts(selected, currentUsdPrice).totalCost
          : Number(selected.totalCost) || 0;

      await markProductSold.mutateAsync({
        documentId: selected.documentId,
        current: selected,
        soldPrice,
        cost: saleCost,
      });

      let cashRegistered = true;
      try {
        await registerSaleInCash.mutateAsync({ product: selected, soldPrice });
      } catch {
        cashRegistered = false;
      }

      detailModal.close();

      if (cashRegistered) {
        toast.success('Producto vendido');
      } else {
        toast.error(
          'Producto vendido, pero no se pudo registrar el ingreso en Caja. Regístralo manualmente.',
        );
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo vender el producto'));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteProduct.mutateAsync(deleteTarget.documentId);
      toast.success('Producto eliminado');
      deleteDialog.close();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo eliminar el producto'));
    }
  };

  const confirmReturn = async () => {
    if (!returnTarget) return;

    try {
      await returnProductToStore.mutateAsync({
        documentId: returnTarget.documentId,
        current: returnTarget,
      });
      toast.success('Producto reintegrado a la tienda');
      returnDialog.close();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo reintegrar el producto'));
    }
  };

  const now = new Date();
  const todayLabel = capitalize(
    new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(now),
  );
  const monthLabel = capitalize(
    new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(now),
  );

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Catálogo"
        title={config.title}
        description={config.description}
        actions={
          config.showCreate ? (
            <Button onClick={openCreate}>
              <TbPlus size={17} /> Nuevo producto
            </Button>
          ) : config.showReport ? (
            <div className="w-[470px] max-w-full divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface-raised/40">
              <SalesMiniRow
                title="Ventas de hoy"
                subtitle={todayLabel}
                icon={TbSun}
                tone="today"
                data={sales.today}
                loading={salesQuery.isLoading}
              />
              <SalesMiniRow
                title="Ventas del mes"
                subtitle={monthLabel}
                icon={TbCalendarMonth}
                tone="month"
                data={sales.month}
                loading={salesQuery.isLoading}
              />
            </div>
          ) : undefined
        }
      />

      <Card className="p-4">
        <div
          className={cn(
            'grid gap-3 md:grid-cols-2',
            config.dateFilter || config.stockFilter
              ? 'xl:grid-cols-[minmax(0,1fr)_200px_190px_auto]'
              : 'xl:grid-cols-[minmax(0,1fr)_200px_auto]',
          )}
        >
          <Input
            icon={TbSearch}
            placeholder="Buscar por descripción, categoría, tienda o gestor"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Buscar productos"
          />
          <Select
            aria-label="Filtrar por categoría"
            placeholder="Todas las categorías"
            options={categoryOptions}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          />
          {config.dateFilter ? (
            <Input
              type="date"
              aria-label="Filtrar ventas por fecha"
              value={saleDate}
              onChange={(event) => setSaleDate(event.target.value)}
            />
          ) : config.stockFilter ? (
            <Select
              aria-label="Filtrar por ubicación"
              options={STOCK_OPTIONS}
              value={stock}
              onChange={(event) => setStock(event.target.value)}
            />
          ) : null}
          <Button variant="secondary" onClick={clearFilters} disabled={!hasFilters}>
            <TbFilterOff size={16} /> Limpiar
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader
          title={config.tableTitle}
          description={`${formatNumber(meta.total)} productos en este filtro`}
          actions={
            <div className="flex flex-wrap items-center gap-3">
              {config.showStats ? (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-line bg-canvas/40 px-3 py-1.5">
                  <CompactStat
                    label="Total"
                    value={stats ? formatNumber(stats.total) : '—'}
                    tone="text-ink"
                  />
                  <span className="hidden h-6 w-px bg-line sm:block" />
                  <CompactStat
                    label="En stock"
                    value={stats ? formatNumber(stats.inStock) : '—'}
                    tone="text-gain"
                  />
                  <span className="hidden h-6 w-px bg-line sm:block" />
                  <CompactStat
                    label="En gestor"
                    value={stats ? formatNumber(stats.withVendor) : '—'}
                    tone="text-percent"
                  />
                </div>
              ) : null}
              {productsQuery.isFetching && !productsQuery.isLoading ? (
                <Spinner size="sm" className="text-brand-500" label="Actualizando" />
              ) : null}
            </div>
          }
        />

        {productsQuery.isError ? (
          <ErrorState
            title="No se pudieron cargar los productos"
            error={productsQuery.error}
            onRetry={productsQuery.refetch}
          />
        ) : (
          <Table
            className={cn(
              config.wideTable &&
                '[&_th]:px-2 [&_td]:px-2 [&_th]:py-2.5 [&_td]:py-2.5',
            )}
          >
            <TableHead>
              <TableRow>
                <TableHeaderCell>Producto</TableHeaderCell>
                {config.soldColumns ? (
                  <>
                    <TableHeaderCell>Estado</TableHeaderCell>
                    <TableHeaderCell align="right">Precio vendido</TableHeaderCell>
                    <TableHeaderCell align="right">Coste total</TableHeaderCell>
                    <TableHeaderCell align="right">Ganancia real</TableHeaderCell>
                    <TableHeaderCell>Fecha de venta</TableHeaderCell>
                  </>
                ) : config.purchaseColumns ? (
                  <>
                    <TableHeaderCell title="Fecha de compra">Compra</TableHeaderCell>
                    <TableHeaderCell align="right" title="Precio de tienda">
                      P. tienda
                    </TableHeaderCell>
                    <TableHeaderCell align="right">Precio</TableHeaderCell>
                    <TableHeaderCell align="right">Precio USD</TableHeaderCell>
                    <TableHeaderCell align="right">Coste</TableHeaderCell>
                    <TableHeaderCell align="right" title="Ganancia planificada">
                      Ganancia
                    </TableHeaderCell>
                    <TableHeaderCell align="right">Peso</TableHeaderCell>
                    <TableHeaderCell>Envío</TableHeaderCell>
                  </>
                ) : (
                  <>
                    <TableHeaderCell>Ubicación</TableHeaderCell>
                    <TableHeaderCell align="right">Precio</TableHeaderCell>
                    <TableHeaderCell
                      align="right"
                      title="Precio calculado con el USD de Configuración y el % de ganancia del producto"
                    >
                      USD actual
                    </TableHeaderCell>
                    <TableHeaderCell align="right">Coste</TableHeaderCell>
                    <TableHeaderCell align="right">Ganancia</TableHeaderCell>
                    <TableHeaderCell>Llegada</TableHeaderCell>
                    <TableHeaderCell align="right">Peso</TableHeaderCell>
                  </>
                )}
                <TableHeaderCell align="right">Acciones</TableHeaderCell>
              </TableRow>
            </TableHead>

            {productsQuery.isLoading ? (
              <TableSkeleton rows={5} columns={config.columnCount} />
            ) : (
              <TableBody>
                {items.length === 0 ? (
                  <TableEmpty
                    colSpan={config.columnCount}
                    icon={hasFilters ? TbSearch : TbBox}
                    title={hasFilters ? 'Sin resultados' : config.emptyTitle}
                    description={
                      hasFilters
                        ? 'Prueba con otro término o cambia los filtros.'
                        : config.emptyDescription
                    }
                  >
                    {hasFilters ? (
                      <Button size="sm" variant="secondary" onClick={clearFilters}>
                        Quitar filtros
                      </Button>
                    ) : config.showCreate ? (
                      <Button size="sm" onClick={openCreate}>
                        <TbPlus size={16} /> Crear producto
                      </Button>
                    ) : null}
                  </TableEmpty>
                ) : (
                  items.map((product) => {
                    const thumbnail = resolveMediaThumbnail(product.productImage, 'thumbnail');
                    const inStock = isInStock(product);
                    const gain = Number(product.gainPlanned) || 0;
                    const usdPriceToday =
                      currentUsdPrice > 0
                        ? computeSuggestedPrice(product, currentUsdPrice)
                        : null;

                    return (
                      <TableRow key={product.documentId || product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {thumbnail ? (
                              <img
                                src={thumbnail}
                                alt={product.productDescription || 'Producto'}
                                className="h-11 w-11 shrink-0 rounded-lg object-cover ring-1 ring-line"
                              />
                            ) : (
                              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-surface-raised text-ink-faint">
                                <TbPhoto size={18} aria-hidden="true" />
                              </span>
                            )}
                            <div className="min-w-0">
                              <p
                                className={cn(
                                  'truncate font-medium text-ink',
                                  config.purchaseColumns ? 'max-w-[220px]' : 'max-w-[260px]',
                                )}
                              >
                                {product.productDescription || '—'}
                              </p>
                              <p className="text-xs text-ink-muted">
                                {product.category || 'Sin categoría'} ·{' '}
                                {product.shopName || 'Sin tienda'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        {config.soldColumns ? (
                          <>
                            <TableCell>
                              <Badge
                                variant={deliveredStatusVariant(product.deliveredStatus)}
                              >
                                {product.deliveredStatus || '—'}
                              </Badge>
                            </TableCell>
                            <TableCell
                              align="right"
                              className="whitespace-nowrap font-semibold tabular-nums !text-price"
                            >
                              {formatCup(product.soldPrice)}
                            </TableCell>
                            <TableCell
                              align="right"
                              className="whitespace-nowrap tabular-nums"
                            >
                              {formatCup(product.totalCost)}
                            </TableCell>
                            <TableCell
                              align="right"
                              className={cn(
                                'whitespace-nowrap font-semibold tabular-nums',
                                (Number(product.gainReal) || 0) >= 0
                                  ? '!text-gain'
                                  : '!text-danger',
                              )}
                            >
                              {formatCup(product.gainReal)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-ink-soft">
                              {formatDate(product.soldDate)}
                            </TableCell>
                          </>
                        ) : config.purchaseColumns ? (
                          <>
                            <TableCell className="whitespace-nowrap text-ink-soft">
                              {formatDate(product.buyDate)}
                            </TableCell>
                            <TableCell
                              align="right"
                              className="whitespace-nowrap font-semibold tabular-nums !text-price"
                            >
                              {formatUsd(product.shopPrice)}
                            </TableCell>
                            <TableCell
                              align="right"
                              className="whitespace-nowrap font-semibold tabular-nums !text-price"
                            >
                              {formatCup(product.sellPrice)}
                            </TableCell>
                            <TableCell
                              align="right"
                              className="whitespace-nowrap font-semibold tabular-nums !text-price"
                            >
                              {formatCup(product.usdPrice)}
                            </TableCell>
                            <TableCell
                              align="right"
                              className="whitespace-nowrap tabular-nums"
                            >
                              {formatCup(product.totalCost)}
                            </TableCell>
                            <TableCell
                              align="right"
                              className={cn(
                                'whitespace-nowrap font-semibold tabular-nums',
                                (Number(product.gainPlanned) || 0) >= 0
                                  ? '!text-gain'
                                  : '!text-danger',
                              )}
                            >
                              <p>{formatCup(product.gainPlanned)}</p>
                              <p className="text-[10px] font-medium tabular-nums text-percent">
                                {product.gainPercent ? `${product.gainPercent}%` : '—'}
                              </p>
                            </TableCell>
                            <TableCell
                              align="right"
                              className="whitespace-nowrap text-xs tabular-nums text-ink-muted"
                            >
                              {formatNumber(product.weight)} lb
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-xs text-ink-muted">
                              {SENT_BY_LABELS[product.sentBy] || product.sentBy || '—'}
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell>
                              {inStock ? (
                                <Badge variant="success">En stock</Badge>
                              ) : (
                                <div className="max-w-[140px]">
                                  <Badge variant="percent">En gestor</Badge>
                                  <p className="mt-0.5 truncate text-[11px] text-ink-muted">
                                    {product.takenByVendor}
                                  </p>
                                </div>
                              )}
                            </TableCell>
                            <TableCell
                              align="right"
                              className="whitespace-nowrap font-semibold tabular-nums !text-price"
                            >
                              {formatCup(product.sellPrice)}
                            </TableCell>
                            <TableCell align="right" className="whitespace-nowrap">
                              <p className="font-semibold tabular-nums !text-price">
                                {usdPriceToday === null ? '—' : formatCup(usdPriceToday)}
                              </p>
                              <p className="text-[10px] font-medium tabular-nums text-percent">
                                {product.gainPercent ? `${product.gainPercent}%` : '—'}
                              </p>
                            </TableCell>
                            <TableCell
                              align="right"
                              className="whitespace-nowrap tabular-nums"
                            >
                              {formatCup(product.totalCost)}
                            </TableCell>
                            <TableCell
                              align="right"
                              className={cn(
                                'whitespace-nowrap font-semibold tabular-nums',
                                gain >= 0 ? '!text-gain' : '!text-danger',
                              )}
                            >
                              {formatCup(gain)}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-xs text-ink-muted">
                              {formatDate(product.arrivedAt)}
                            </TableCell>
                            <TableCell
                              align="right"
                              className="whitespace-nowrap text-xs tabular-nums text-ink-muted"
                            >
                              {formatNumber(product.weight)} lb
                            </TableCell>
                          </>
                        )}
                        <TableCell align="right">
                          <div className="flex justify-end gap-1">
                            <ActionIcon
                              label={
                                config.sellAction === 'detail'
                                  ? `Ver detalle del producto ${product.productDescription || ''}`.trim()
                                  : config.sellAction === 'manage'
                                    ? `Gestionar venta del producto ${product.productDescription || ''}`.trim()
                                    : `Vender / ver producto ${product.productDescription || ''}`.trim()
                              }
                              onClick={() => openDetail(product)}
                              tone={config.sellAction === 'manage' ? 'warning' : 'default'}
                            >
                              {config.sellAction === 'detail' ? (
                                <TbEye size={17} />
                              ) : (
                                <TbShoppingCart size={17} />
                              )}
                            </ActionIcon>
                            {config.showVendor ? (
                              <ActionIcon
                                label={`Entregar a gestor ${product.productDescription || ''}`.trim()}
                                onClick={() => openVendor(product)}
                                tone="percent"
                              >
                                <TbUserCheck size={17} />
                              </ActionIcon>
                            ) : null}
                            <ActionIcon
                              label={`Editar producto ${product.productDescription || ''}`.trim()}
                              onClick={() => openEdit(product)}
                            >
                              <TbPencil size={17} />
                            </ActionIcon>
                            <ActionIcon
                              label={`Eliminar producto ${product.productDescription || ''}`.trim()}
                              onClick={() => requestDelete(product)}
                              danger
                            >
                              <TbTrash size={17} />
                            </ActionIcon>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            )}
          </Table>
        )}

        {!productsQuery.isError ? (
          <Pagination
            page={meta.page ?? page}
            pageCount={meta.pageCount ?? 1}
            onChange={setPage}
            total={meta.total ?? 0}
            pageSize={meta.pageSize ?? PAGE_SIZE}
            itemLabel="productos"
          />
        ) : null}
      </Card>

      <ProductFormModal
        open={formModal.isOpen}
        onClose={formModal.close}
        product={editing}
        configuration={configurationQuery.data}
      />

      <ProductDetailModal
        open={detailModal.isOpen}
        product={selected}
        mode={mode}
        configuration={configurationQuery.data}
        onClose={detailModal.close}
        onEdit={() => selected && openEdit(selected)}
        onDelete={() => selected && requestDelete(selected)}
        onSell={handleMarkSold}
        selling={markProductSold.isPending}
        onReturn={() => selected && requestReturn(selected)}
        returning={returnProductToStore.isPending}
      />

      <ProductVendorModal
        open={vendorModal.isOpen}
        product={vendorTarget}
        onClose={vendorModal.close}
      />

      <ConfirmDialog
        open={deleteDialog.isOpen}
        onClose={deleteDialog.close}
        onConfirm={confirmDelete}
        title="Eliminar producto"
        description={`Vas a eliminar "${deleteTarget?.productDescription || 'este producto'}". Las imágenes subidas no se borran de la biblioteca de medios. Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar"
        loading={deleteProduct.isPending}
      />

      <ConfirmDialog
        open={returnDialog.isOpen}
        onClose={returnDialog.close}
        onConfirm={confirmReturn}
        title="Reintegrar a la tienda"
        description={`Vas a reintegrar "${returnTarget?.productDescription || 'este producto'}" a la tienda. Se borrarán los datos de la venta y volverá a estar disponible como recibido.`}
        confirmLabel="Reintegrar producto"
        variant="warning"
        loading={returnProductToStore.isPending}
      />
    </div>
  );
}
