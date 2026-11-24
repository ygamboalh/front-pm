import { useEffect, useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TbUpload, TbX } from 'react-icons/tb';
import toast from 'react-hot-toast';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import Textarea from '@/shared/components/ui/Textarea';
import { resolveMediaThumbnail } from '@/shared/api/media';
import { getApiErrorMessage } from '@/shared/api/strapiClient';
import { cn } from '@/shared/lib/cn';
import { getTaxDefaults, taxSchema } from '../schema';
import { useSaveTax } from '../hooks';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

export default function TaxFormModal({ open, onClose, tax }) {
  const isEditing = Boolean(tax);
  const formId = useId();
  const saveTax = useSaveTax();

  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [imageError, setImageError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(taxSchema),
    defaultValues: getTaxDefaults(tax),
  });

  useEffect(() => {
    if (open) {
      reset(getTaxDefaults(tax));
      setImageFile(null);
      setImageError('');
    }
  }, [open, tax, reset]);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }

    setPreview(resolveMediaThumbnail(tax?.screenShotImage, 'medium'));
    return undefined;
  }, [imageFile, tax]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = '';
    setImageError('');

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageError('El comprobante debe ser una imagen');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setImageError('La imagen no puede superar los 10 MB');
      return;
    }

    setImageFile(file);
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!isEditing && !imageFile) {
      setImageError('Añade una captura del comprobante');
      return;
    }

    try {
      await saveTax.mutateAsync({
        documentId: tax?.documentId,
        values,
        imageFile,
        currentImageId: tax?.screenShotImage?.id,
      });
      toast.success(isEditing ? 'Impuesto actualizado' : 'Impuesto registrado');
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo guardar el impuesto'));
    }
  });

  const saving = isSubmitting || saveTax.isPending;

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title={isEditing ? 'Editar impuesto' : 'Nuevo impuesto'}
      description={
        isEditing
          ? tax?.month || 'Registro de impuestos'
          : 'Registra el pago y adjunta el comprobante.'
      }
      size="xl"
      closeOnBackdrop={!saving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} loading={saving}>
            {isEditing ? 'Guardar cambios' : 'Registrar impuesto'}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        onSubmit={onSubmit}
        className="grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)] lg:items-start"
        noValidate
      >
        <div>
          <span className="block text-sm font-medium text-ink-soft">Comprobante</span>
          <div className="mt-2 space-y-2">
            {imageFile ? (
              <div className="relative w-[180px]">
                <img
                  src={preview}
                  alt="Vista previa del comprobante"
                  className="h-[240px] w-[180px] rounded-xl bg-surface-hover object-contain ring-1 ring-brand-500/40"
                />
                <button
                  type="button"
                  onClick={() => setImageFile(null)}
                  className="absolute -right-1.5 -top-1.5 rounded-full bg-canvas-deep p-1 text-white shadow transition hover:bg-rose-600"
                  aria-label="Quitar comprobante seleccionado"
                >
                  <TbX size={12} />
                </button>
              </div>
            ) : preview ? (
              <a
                href={preview}
                target="_blank"
                rel="noreferrer"
                className="block h-[240px] w-[180px] overflow-hidden rounded-xl bg-surface-hover ring-1 ring-line"
              >
                <img
                  src={preview}
                  alt="Comprobante actual del impuesto"
                  className="h-full w-full object-contain"
                />
              </a>
            ) : null}

            {!imageFile ? (
              <label
                className={cn(
                  'flex w-[180px] cursor-pointer items-center justify-center gap-1 rounded-xl border border-dashed border-line bg-surface-raised text-ink-faint transition hover:border-brand-500/50 hover:text-brand-200',
                  preview ? 'h-9 flex-row' : 'h-[240px] flex-col',
                )}
              >
                <TbUpload size={preview ? 15 : 20} aria-hidden="true" />
                <span className="text-[11px] font-medium">
                  {preview ? 'Cambiar' : 'Añadir'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </label>
            ) : null}
          </div>
          <p className="mt-1 w-[180px] text-[10px] leading-snug text-ink-muted">
            {isEditing ? 'Opcional si no quieres cambiarlo.' : 'Obligatorio al registrar.'}{' '}
            Máx. 10 MB.
          </p>
          {imageError ? (
            <p className="mt-1 w-[180px] text-xs font-medium text-danger">{imageError}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Input
            label="Mes"
            placeholder="Noviembre 2026"
            error={errors.month?.message}
            {...register('month')}
          />
          <Input
            label="Código / referencia"
            placeholder="Aduana, licencia…"
            error={errors.code?.message}
            {...register('code')}
          />
          <Input
            label="Fecha de pago"
            type="date"
            error={errors.paymentDate?.message}
            {...register('paymentDate')}
          />

          <Input
            label="Importe (cup)"
            type="number"
            inputMode="numeric"
            step="1"
            min="0"
            suffix="cup"
            error={errors.amount?.message}
            {...register('amount', { valueAsNumber: true })}
          />
          <Input
            label="Pagado real (cup)"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            suffix="cup"
            error={errors.realPaid?.message}
            {...register('realPaid', { valueAsNumber: true })}
          />
          <Input
            label="Ganancia (cup)"
            type="number"
            inputMode="numeric"
            step="1"
            min="0"
            suffix="cup"
            error={errors.gain?.message}
            {...register('gain', { valueAsNumber: true })}
          />

          <div className="col-span-2">
            <Textarea
              label="Descripción"
              placeholder="Detalle del impuesto (opcional)"
              rows={2}
              error={errors.description?.message}
              {...register('description')}
            />
          </div>
          <Input
            label="Fecha de registro"
            type="date"
            error={errors.taxCreatedAt?.message}
            {...register('taxCreatedAt')}
          />
        </div>
      </form>
    </Modal>
  );
}
