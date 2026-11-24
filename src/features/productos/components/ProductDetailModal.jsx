import { useEffect, useMemo, useState } from 'react';
import {
  TbArrowBackUp,
  TbCircleCheck,
  TbPencil,
  TbShoppingCart,
  TbTrash,
} from 'react-icons/tb';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import Badge from '@/shared/components/ui/Badge';
import Input from '@/shared/components/ui/Input';
import { resolveMediaUrl } from '@/shared/api/media';
import { formatCup, formatDate } from '@/shared/lib/formatters';
import { computeProductCosts } from '../schema';
import { deliveredStatusVariant } from '@/shared/lib/status';
import { SENT_BY_LABELS } from '@/shared/lib/constants';
import { cn } from '@/shared/lib/cn';

const percentFormatter = new Intl.NumberFormat('es-ES', {
  maximumFractionDigits: 1,
});

function Field({ label, value, tone }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wide text-ink-faint">{label}</dt>
      <dd
        className={cn(
          'mt-0.5 text-sm',
          tone ? `font-semibold tabular-nums ${tone}` : 'text-ink',
        )}
      >
        {value || '—'}
      </dd>
    </div>
  );
}

function isInStock(product) {
  const vendor = (product?.takenByVendor || '').trim();
  return !vendor || vendor === 'En stock' || vendor === 'No asignado';
}

export default function ProductDetailModal({
  open,
  product,
  mode = 'tienda',
  configuration = null,
  onClose,
  onEdit,
  onDelete,
  onSell,
  selling = false,
  onReturn,
  returning = false,
}) {
  const [activeImage, setActiveImage] = useState(0);
  const [salePrice, setSalePrice] = useState('');
  const [saleError, setSaleError] = useState('');

  const images = useMemo(() => {
    if (!product) return [];
    return Array.isArray(product.productImage)
      ? product.productImage
      : product.productImage
        ? [product.productImage]
        : [];
  }, [product]);

  useEffect(() => {
    if (open && product) {
      setActiveImage(0);
      setSalePrice(String(product.sellPrice ?? 0));
      setSaleError('');
    }
  }, [open, product]);

  if (!product) return null;

  const isSold = product.deliveredStatus === 'Vendido';
  const canSell =
    product.deliveredStatus === 'Recibido' ||
    product.deliveredStatus === 'Disponible';
  const salesEnabled = mode === 'tienda';
  const canReturn = mode === 'vendidos' && isSold;
  const inStock = isInStock(product);
  const totalCost = Number(product.totalCost) || 0;
  const currentUsdPrice = Number(configuration?.usdPrice) || 0;
  const previewCost =
    currentUsdPrice > 0
      ? computeProductCosts(product, currentUsdPrice).totalCost
      : totalCost;
  const priceNumber = Number(salePrice) || 0;
  const saleGain = Math.round(priceNumber - previewCost);
  const salePercent = previewCost > 0 ? (saleGain / previewCost) * 100 : 0;
  const mainImage = images[activeImage] || images[0];
  const mainUrl = resolveMediaUrl(mainImage);

  const handleSell = () => {
    if (priceNumber <= 0) {
      setSaleError('Indica un precio mayor que 0');
      return;
    }

    setSaleError('');
    onSell(priceNumber);
  };

  return (
    <Modal
      open={open}
      onClose={selling ? undefined : onClose}
      title="Producto"
      description={product.productDescription || 'Detalle del producto'}
      size="lg"
      closeOnBackdrop={!selling}
      footer={
        <>
          <Button
            variant="ghost"
            className="mr-auto text-danger hover:bg-danger/10 hover:text-danger"
            onClick={onDelete}
          >
            <TbTrash size={16} /> Eliminar
          </Button>
          {canReturn ? (
            <Button variant="warning" onClick={onReturn} loading={returning}>
              <TbArrowBackUp size={16} /> Reintegrar a la tienda
            </Button>
          ) : null}
          {salesEnabled && !isSold ? (
            <Button onClick={handleSell} loading={selling} disabled={!canSell}>
              <TbShoppingCart size={16} /> Vender producto
            </Button>
          ) : null}
          <Button variant="secondary" onClick={onEdit}>
            <TbPencil size={16} /> Editar
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,230px)_minmax(0,1fr)]">
          <div className="space-y-2">
            {mainUrl ? (
              <div className="flex h-56 items-center justify-center overflow-hidden rounded-xl bg-canvas/40 ring-1 ring-line">
                <img
                  src={mainUrl}
                  alt={product.productDescription || 'Producto'}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-56 items-center justify-center rounded-xl bg-surface-raised text-4xl text-ink-faint">
                —
              </div>
            )}

            {images.length > 1 ? (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((image, index) => {
                  const url = resolveMediaUrl(image);
                  return (
                    <button
                      key={image.id || index}
                      type="button"
                      onClick={() => setActiveImage(index)}
                      className={cn(
                        'h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-1 transition',
                        index === activeImage
                          ? 'ring-brand-500/60'
                          : 'ring-line hover:ring-brand-500/30',
                      )}
                    >
                      <img
                        src={url}
                        alt={image.name || `Imagen ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-1.5">
              <Badge variant={deliveredStatusVariant(product.deliveredStatus)}>
                {product.deliveredStatus || 'Sin estado'}
              </Badge>
              {inStock ? (
                <Badge variant="success">En stock</Badge>
              ) : (
                <Badge variant="percent">En gestor · {product.takenByVendor}</Badge>
              )}
              <Badge variant="neutral">{product.category || 'Sin categoría'}</Badge>
              <Badge variant="neutral">
                {SENT_BY_LABELS[product.sentBy] || product.sentBy || 'Sin envío'}
              </Badge>
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 rounded-xl border border-line bg-canvas/40 p-3">
              <Field label="Tienda" value={product.shopName} />
              <Field label="Compra" value={formatDate(product.buyDate)} />
              <Field
                label="Precio de lista"
                value={formatCup(product.sellPrice)}
                tone="text-price"
              />
              <Field
                label="Coste total"
                value={formatCup(product.totalCost)}
                tone="text-price"
              />
              <Field
                label="Ganancia planificada"
                value={formatCup(product.gainPlanned)}
                tone={
                  Number(product.gainPlanned) >= 0 ? 'text-gain' : 'text-danger'
                }
              />
              <Field
                label="% de ganancia"
                value={product.gainPercent ? `${product.gainPercent} %` : '—'}
                tone="text-percent"
              />
              {!inStock ? (
                <Field
                  label="Fecha de entrega a gestor"
                  value={formatDate(product.dateTakenByVendor)}
                />
              ) : null}
              {product.arrivedAt ? (
                <Field label="Llegada" value={formatDate(product.arrivedAt)} />
              ) : null}
              {isSold ? (
                <>
                  <Field
                    label="Precio vendido"
                    value={formatCup(product.soldPrice)}
                    tone="text-price"
                  />
                  <Field
                    label="Ganancia real"
                    value={formatCup(product.gainReal)}
                    tone={Number(product.gainReal) >= 0 ? 'text-gain' : 'text-danger'}
                  />
                  <Field label="Fecha de venta" value={formatDate(product.soldDate)} />
                </>
              ) : null}
            </dl>
          </div>
        </div>

        {isSold ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gain/25 bg-gain/10 px-4 py-3">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gain">
                <TbCircleCheck size={14} aria-hidden="true" /> Producto vendido
              </p>
              <p className="mt-1 text-sm text-ink-soft">
                Precio final {formatCup(product.soldPrice)} · Ganancia real{' '}
                {formatCup(product.gainReal)}
              </p>
              {canReturn ? (
                <p className="mt-1 text-xs text-price">
                  Puedes reintegrarlo a la tienda para que vuelva a estar disponible.
                </p>
              ) : null}
            </div>
            <Badge variant="success">{formatDate(product.soldDate)}</Badge>
          </div>
        ) : salesEnabled ? (
          canSell ? (
            <div className="rounded-xl border border-price/25 bg-price/10 p-3">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label htmlFor="sale-price" className="text-sm font-medium text-ink-soft">
                    Precio del producto (cup)
                  </label>
                  <div className="flex items-baseline gap-2">
                    <span
                      className="text-[10px] uppercase tracking-wide text-ink-faint"
                      title="Ganancia sobre el coste actual (USD de Configuración y precio de la libra del producto)"
                    >
                      Ganancia
                    </span>
                    <span
                      className={cn(
                        'text-sm font-semibold tabular-nums',
                        saleGain >= 0 ? 'text-gain' : 'text-danger',
                      )}
                    >
                      {formatCup(saleGain)}
                    </span>
                    <span className="text-xs text-ink-faint">·</span>
                    <span
                      className="text-sm font-semibold tabular-nums text-percent"
                      title="Porcentaje de la ganancia sobre el coste actual"
                    >
                      {previewCost > 0 ? `${percentFormatter.format(salePercent)} %` : '—'}
                    </span>
                  </div>
                </div>

                <Input
                  id="sale-price"
                  name="salePrice"
                  type="number"
                  inputMode="numeric"
                  step="1"
                  min="1"
                  tone="price"
                  suffix="cup"
                  error={saleError || undefined}
                  value={salePrice}
                  onChange={(event) => {
                    setSalePrice(event.target.value);
                    setSaleError('');
                  }}
                />

                <p className="text-[10px] text-ink-muted">
                  Cálculo con el coste actual: {formatCup(previewCost)}
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-line bg-canvas/40 px-4 py-3 text-xs text-ink-muted">
              Marca el producto como{' '}
              <span className="font-medium text-ink-soft">Recibido</span> antes de venderlo.
            </div>
          )
        ) : null}
      </div>
    </Modal>
  );
}
