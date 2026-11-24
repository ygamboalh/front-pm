import { TbCircleCheck, TbExternalLink, TbPencil, TbTrash } from 'react-icons/tb';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import Badge from '@/shared/components/ui/Badge';
import { resolveMediaUrl } from '@/shared/api/media';
import { formatCup, formatDate, formatNumber, formatUsd } from '@/shared/lib/formatters';
import { deliveredStatusVariant, payStatusVariant } from '@/shared/lib/status';
import { cn } from '@/shared/lib/cn';
import { SENT_BY_LABELS } from '../constants';

function Field({ label, value, className, tone }) {
  return (
    <div className={className}>
      <dt className="text-[11px] uppercase tracking-wide text-ink-faint">{label}</dt>
      <dd
        className={
          tone
            ? `mt-0.5 text-sm font-semibold tabular-nums ${tone}`
            : 'mt-0.5 text-sm text-ink'
        }
      >
        {value || '—'}
      </dd>
    </div>
  );
}

export default function EncargoDetailModal({
  open,
  encargo,
  onClose,
  onEdit,
  onDelete,
  onMarkDelivered,
  marking = false,
}) {
  if (!encargo) return null;

  const imageUrl = resolveMediaUrl(encargo.productImage);
  const isDelivered = encargo.deliveredStatus === 'Entregado';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detalle del encargo"
      description={`${encargo.ownerName || 'Cliente'} · ${encargo.shopName || 'Tienda'}`}
      size="xl"
      footer={
        <>
          <Button
            variant="ghost"
            className="mr-auto text-danger hover:bg-danger/10 hover:text-danger"
            onClick={onDelete}
          >
            <TbTrash size={16} /> Eliminar
          </Button>
          <Button variant="secondary" onClick={onEdit}>
            <TbPencil size={16} /> Editar
          </Button>
          {!isDelivered && onMarkDelivered ? (
            <Button onClick={onMarkDelivered} loading={marking}>
              <TbCircleCheck size={16} /> Marcar entregado
            </Button>
          ) : null}
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div
          className={cn(
            'grid gap-4',
            imageUrl && 'sm:grid-cols-[minmax(0,240px)_minmax(0,1fr)]',
          )}
        >
          {imageUrl ? (
            <div className="h-64 overflow-hidden rounded-xl bg-surface-hover ring-1 ring-line">
              <img
                src={imageUrl}
                alt={encargo.productDescription || 'Imagen del producto'}
                className="h-full w-full object-cover"
              />
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant={deliveredStatusVariant(encargo.deliveredStatus)}>
                {encargo.deliveredStatus || 'Sin estado'}
              </Badge>
              <Badge variant={payStatusVariant(encargo.payStatus)}>
                {encargo.payStatus || 'Sin pago'}
              </Badge>
              <Badge variant="neutral">Compra #{encargo.shoppingId ?? '—'}</Badge>
            </div>

            <dl className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-xl border border-line bg-canvas/40 p-3 sm:grid-cols-3">
              <Field label="Cliente" value={encargo.ownerName} />
              <Field label="Teléfono" value={encargo.ownerPhoneNumber} />
              <Field label="Tienda" value={encargo.shopName} />
              <Field
                label="Producto"
                value={encargo.productDescription}
                className="col-span-2"
              />
              <Field
                label="Precio de venta"
                value={formatCup(encargo.productPrice)}
                tone="text-price"
              />
              <Field
                label="Precio en tienda"
                value={formatUsd(encargo.shopPrice)}
                tone="text-price"
              />
              <Field label="Peso" value={`${formatNumber(encargo.productWeight)} lb`} />
              <Field
                label="Precio de la libra"
                value={formatUsd(encargo.poundPrice)}
                tone="text-price"
              />
              <Field
                label="Enviado por"
                value={SENT_BY_LABELS[encargo.sentBy] || encargo.sentBy}
              />
              <Field
                label="Fecha del encargo"
                value={formatDate(encargo.encargoCreatedAt)}
              />
              <Field label="Último pago" value={formatDate(encargo.lastPaid)} />
              <Field label="Llegada" value={formatDate(encargo.arrivedAt)} />
              <Field label="Entrega" value={formatDate(encargo.deliveredAt)} />
            </dl>
          </div>
        </div>

        {encargo.productLink || encargo.observation ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {encargo.productLink ? (
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wide text-ink-faint">
                  Enlace del producto
                </p>
                <a
                  href={encargo.productLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-0.5 inline-flex max-w-full items-center gap-1.5 text-xs text-brand-300 hover:text-brand-200"
                >
                  <TbExternalLink size={14} className="shrink-0" aria-hidden="true" />
                  <span className="truncate">{encargo.productLink}</span>
                </a>
              </div>
            ) : null}

            {encargo.observation ? (
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wide text-ink-faint">
                  Observaciones
                </p>
                <p
                  className="mt-0.5 line-clamp-2 text-xs text-ink-soft"
                  title={encargo.observation}
                >
                  {encargo.observation}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
