import { TbPencil, TbTrash } from 'react-icons/tb';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import Badge from '@/shared/components/ui/Badge';
import { resolveMediaUrl } from '@/shared/api/media';
import { formatCup, formatDate } from '@/shared/lib/formatters';
import { cn } from '@/shared/lib/cn';

function Field({ label, value, className, tone }) {
  return (
    <div className={className}>
      <dt className="text-[10px] uppercase tracking-wide text-ink-faint">{label}</dt>
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

export default function TaxDetailModal({ open, tax, onClose, onEdit, onDelete }) {
  if (!tax) return null;

  const imageUrl = resolveMediaUrl(tax.screenShotImage);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Detalle del impuesto"
      description={tax.month || 'Registro de impuestos'}
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
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </>
      }
    >
      <div
        className={cn(
          'grid gap-4',
          imageUrl && 'sm:grid-cols-[minmax(0,260px)_minmax(0,1fr)]',
        )}
      >
        {imageUrl ? (
          <div className="space-y-1">
            <a
              href={imageUrl}
              target="_blank"
              rel="noreferrer"
              className="flex h-[340px] w-full max-w-[260px] items-center justify-center overflow-hidden rounded-xl bg-surface-hover ring-1 ring-line"
            >
              <img
                src={imageUrl}
                alt={tax.description || 'Comprobante del impuesto'}
                className="h-full w-full object-contain"
              />
            </a>
            <p className="max-w-[260px] text-[10px] text-ink-faint">
              Clic en el comprobante para ampliarlo.
            </p>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="brand">{tax.month || 'Sin mes'}</Badge>
            <Badge variant="neutral">{tax.code || 'Sin código'}</Badge>
          </div>

          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-xl border border-line bg-canvas/40 p-3">
            <Field label="Importe" value={formatCup(tax.amount)} tone="text-price" />
            <Field label="Pagado real" value={formatCup(tax.realPaid)} tone="text-price" />
            <Field label="Ganancia" value={formatCup(tax.gain)} tone="text-gain" />
            <Field label="Fecha de pago" value={formatDate(tax.paymentDate)} />
            <Field label="Fecha de registro" value={formatDate(tax.taxCreatedAt)} />
          </dl>

          {tax.description ? (
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-ink-faint">
                Descripción
              </p>
              <p
                className="mt-0.5 line-clamp-2 text-xs text-ink-soft"
                title={tax.description}
              >
                {tax.description}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
