import { useEffect, useMemo, useState } from 'react';
import {
  TbBrandWhatsapp,
  TbFilterOff,
  TbPackage,
  TbSearch,
  TbShoppingBag,
  TbTruckDelivery,
  TbWorld,
} from 'react-icons/tb';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Card from '@/shared/components/ui/Card';
import Input from '@/shared/components/ui/Input';
import Select from '@/shared/components/ui/Select';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { APP_NAME } from '@/shared/lib/constants';
import { formatNumber } from '@/shared/lib/formatters';
import StoreProductCard from '../components/StoreProductCard';
import { useStorefront } from '../hooks';
import { normalizeWhatsAppNumber } from '../api';

const INITIAL_VISIBLE = 12;

function StoreSection({
  title,
  description,
  tone,
  products,
  whatsappNumber,
  visible,
  onShowMore,
  emptyText,
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-ink">{title}</h2>
          <p className="text-xs text-ink-muted">{description}</p>
        </div>
        <Badge variant={tone}>{formatNumber(products.length)}</Badge>
      </div>

      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-surface/60 px-4 py-10 text-center text-xs text-ink-muted">
          {emptyText}
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.slice(0, visible).map((product) => (
              <StoreProductCard
                key={product.id}
                product={product}
                whatsappNumber={whatsappNumber}
              />
            ))}
          </div>

          {products.length > visible ? (
            <div className="flex justify-center pt-1">
              <Button variant="secondary" onClick={onShowMore}>
                Ver más ({formatNumber(products.length - visible)} restantes)
              </Button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

function StoreSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-2xl border border-line bg-surface"
        >
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="mt-3 h-8 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TiendaOnlinePage() {
  const storefrontQuery = useStorefront();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [visibleAvailable, setVisibleAvailable] = useState(INITIAL_VISIBLE);
  const [visibleComing, setVisibleComing] = useState(INITIAL_VISIBLE);

  useEffect(() => {
    document.title = `Tienda online · ${APP_NAME}`;
  }, []);

  useEffect(() => {
    setVisibleAvailable(INITIAL_VISIBLE);
    setVisibleComing(INITIAL_VISIBLE);
  }, [search, category]);

  const data = storefrontQuery.data;
  const whatsappNumber = data?.whatsappNumber ?? '';
  const waDigits = normalizeWhatsAppNumber(whatsappNumber);

  const categories = useMemo(() => {
    const productCategories = new Set(
      [...(data?.available ?? []), ...(data?.coming ?? [])]
        .map((product) => product.category)
        .filter(Boolean),
    );

    const typeCategories = (data?.categories ?? []).filter(
      (item) => item && item !== 'Conjunto',
    );
    const base =
      typeCategories.length > 0 ? typeCategories : [...productCategories];

    const extras = [...productCategories]
      .filter((item) => item !== 'Conjunto' && !base.includes(item))
      .sort((a, b) => a.localeCompare(b, 'es'));

    return [...base, ...extras];
  }, [data]);

  const categoryOptions = useMemo(
    () => categories.map((item) => ({ value: item, label: item })),
    [categories],
  );

  const filterProduct = (product) => {
    if (product.category === 'Conjunto') return false;

    const term = search.trim().toLowerCase();
    const matchesTerm =
      !term ||
      product.description.toLowerCase().includes(term) ||
      product.category.toLowerCase().includes(term);
    const matchesCategory = !category || product.category === category;
    return matchesTerm && matchesCategory;
  };

  const available = (data?.available ?? []).filter(filterProduct);
  const coming = (data?.coming ?? []).filter(filterProduct);
  const hasFilters = Boolean(search.trim() || category);

  const clearFilters = () => {
    setSearch('');
    setCategory('');
  };

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="sticky top-0 z-30 border-b border-line/80 bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <a href="/tienda-online" className="flex min-w-0 items-center gap-3">
            <img
              src="/pm.png"
              alt={APP_NAME}
              className="h-9 w-9 shrink-0 rounded-lg object-cover"
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-ink">{APP_NAME}</span>
              <span className="block truncate text-[11px] text-ink-faint">
                Tienda online
              </span>
            </span>
          </a>

          {waDigits ? (
            <a
              href={`https://wa.me/${waDigits}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface-raised px-3 py-2 text-xs font-medium text-ink-soft transition hover:text-ink"
            >
              <TbBrandWhatsapp size={16} aria-hidden="true" /> WhatsApp
            </a>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <section className="relative overflow-hidden rounded-2xl border border-line bg-surface px-6 py-10 sm:px-10">
          <div
            aria-hidden="true"
            className="absolute -left-20 top-0 h-64 w-64 rounded-full bg-brand-600/25 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute -right-10 bottom-0 h-56 w-56 rounded-full bg-price/10 blur-3xl"
          />

          <div className="relative max-w-2xl space-y-3">
            <Badge variant="brand">
              <TbWorld size={13} aria-hidden="true" /> {APP_NAME} · Tienda online
            </Badge>
            <h1 className="text-2xl font-semibold leading-tight text-ink sm:text-3xl">
              Productos listos para ti
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-ink-muted">
              Compra por WhatsApp los artículos disponibles y descubre lo que está por
              llegar a la tienda.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge variant="success">
                <TbShoppingBag size={13} aria-hidden="true" />
                {formatNumber(available.length)} disponibles
              </Badge>
              <Badge variant="warning">
                <TbTruckDelivery size={13} aria-hidden="true" />
                {formatNumber(coming.length)} próximamente
              </Badge>
            </div>
          </div>
        </section>

        <Card className="p-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_240px]">
            <Input
              icon={TbSearch}
              placeholder="Buscar producto o categoría"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Buscar productos en la tienda"
            />
            <Select
              aria-label="Filtrar por categoría"
              placeholder="Todas las categorías"
              options={categoryOptions}
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-ink-muted">
              {hasFilters
                ? `${formatNumber(available.length + coming.length)} resultados`
                : `${formatNumber(available.length + coming.length)} productos en total`}
            </p>
            {hasFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-300 transition hover:text-brand-200"
              >
                <TbFilterOff size={14} aria-hidden="true" /> Limpiar filtros
              </button>
            ) : null}
          </div>
        </Card>

        {storefrontQuery.isLoading ? (
          <StoreSkeleton />
        ) : storefrontQuery.isError ? (
          <Card className="px-6 py-12 text-center">
            <TbPackage size={32} className="mx-auto text-ink-faint" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium text-ink">No se pudo cargar la tienda</p>
            <p className="mt-1 text-xs text-ink-muted">
              {storefrontQuery.error?.message || 'Inténtalo de nuevo en unos segundos.'}
            </p>
            <Button className="mt-4" variant="secondary" onClick={storefrontQuery.refetch}>
              Reintentar
            </Button>
          </Card>
        ) : (
          <>
            {!waDigits ? (
              <div className="rounded-xl border border-price/25 bg-price/10 px-4 py-3 text-xs text-price">
                La compra por WhatsApp estará disponible muy pronto.
              </div>
            ) : null}

            <StoreSection
              title="Disponibles ahora"
              description="Artículos en tienda listos para comprar."
              tone="success"
              products={available}
              whatsappNumber={whatsappNumber}
              visible={visibleAvailable}
              onShowMore={() => setVisibleAvailable((current) => current + INITIAL_VISIBLE)}
              emptyText={
                hasFilters
                  ? 'No hay productos disponibles con este filtro.'
                  : 'No hay productos disponibles en este momento.'
              }
            />

            <StoreSection
              title="Próximamente"
              description="Productos comprados que estarán a la venta cuando lleguen."
              tone="warning"
              products={coming}
              whatsappNumber={whatsappNumber}
              visible={visibleComing}
              onShowMore={() => setVisibleComing((current) => current + INITIAL_VISIBLE)}
              emptyText={
                hasFilters
                  ? 'No hay próximos lanzamientos con este filtro.'
                  : 'No hay productos próximos por ahora.'
              }
            />
          </>
        )}
      </main>

      <footer className="border-t border-line px-4 py-6 text-center text-[11px] text-ink-faint">
        {APP_NAME} · Tienda online
      </footer>
    </div>
  );
}
