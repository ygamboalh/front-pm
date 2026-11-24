import { useEffect, useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TbUserCheck } from 'react-icons/tb';
import toast from 'react-hot-toast';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import Badge from '@/shared/components/ui/Badge';
import { resolveMediaThumbnail } from '@/shared/api/media';
import { getApiErrorMessage } from '@/shared/api/strapiClient';
import { formatCup, formatDate } from '@/shared/lib/formatters';
import { deliveredStatusVariant } from '@/shared/lib/status';
import { useAssignProductToVendor } from '../hooks';

const schema = z.object({
  sellPrice: z
    .number({ invalid_type_error: 'Introduce un precio' })
    .int('Debe ser un número entero')
    .min(0, 'No puede ser negativo'),
  takenByVendor: z.string().trim().min(2, 'Indica el nombre del gestor'),
  dateTakenByVendor: z.string().min(1, 'Indica la fecha de entrega'),
});

function toDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

export default function ProductVendorModal({ open, onClose, product }) {
  const formId = useId();
  const assignProduct = useAssignProductToVendor();
  const currentVendor =
    product?.takenByVendor &&
    product.takenByVendor !== 'En stock' &&
    product.takenByVendor !== 'No asignado'
      ? product.takenByVendor
      : '';

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      sellPrice: Number(product?.sellPrice) || 0,
      takenByVendor: currentVendor,
      dateTakenByVendor: toDateInput(product?.dateTakenByVendor) || toDateInput(new Date()),
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        sellPrice: Number(product?.sellPrice) || 0,
        takenByVendor: currentVendor,
        dateTakenByVendor:
          toDateInput(product?.dateTakenByVendor) || toDateInput(new Date()),
      });
    }
  }, [open, product, currentVendor, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await assignProduct.mutateAsync({
        documentId: product.documentId,
        values,
        current: product,
      });
      toast.success(`Producto asignado a ${values.takenByVendor.trim()}`);
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo asignar el producto'));
    }
  });

  if (!product) return null;

  const saving = isSubmitting || assignProduct.isPending;
  const thumbnail = resolveMediaThumbnail(product.productImage, 'thumbnail');

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title="Entregar a gestor de venta"
      description="El producto saldrá de tu stock y quedará en manos del gestor."
      size="md"
      closeOnBackdrop={!saving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} loading={saving}>
            <TbUserCheck size={16} /> Asignar gestor
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-line bg-canvas/40 p-3">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={product.productDescription || 'Producto'}
              className="h-16 w-16 shrink-0 rounded-lg object-cover ring-1 ring-line"
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">
              {product.productDescription || 'Producto'}
            </p>
            <p className="text-xs text-ink-muted">
              {product.category || 'Sin categoría'} · {product.shopName || 'Sin tienda'}
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Badge variant={deliveredStatusVariant(product.deliveredStatus)}>
                {product.deliveredStatus || 'Sin estado'}
              </Badge>
              <Badge variant="price">Precio {formatCup(product.sellPrice)}</Badge>
              <Badge variant="neutral">Alta {formatDate(product.productCreatedAt)}</Badge>
            </div>
          </div>
        </div>

        <form id={formId} onSubmit={onSubmit} className="space-y-3" noValidate>
          <Input
            label="Precio del producto (cup)"
            type="number"
            inputMode="numeric"
            step="1"
            min="0"
            tone="price"
            suffix="cup"
            hint="Precio que recibirá el gestor"
            error={errors.sellPrice?.message}
            {...register('sellPrice', { valueAsNumber: true })}
          />
          <Input
            label="Nombre del gestor"
            placeholder="Ej. María López"
            error={errors.takenByVendor?.message}
            {...register('takenByVendor')}
          />
          <Input
            label="Fecha de entrega al gestor"
            type="date"
            error={errors.dateTakenByVendor?.message}
            {...register('dateTakenByVendor')}
          />
        </form>
      </div>
    </Modal>
  );
}
