import { useEffect, useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { TbShoppingCart, TbUpload, TbX } from 'react-icons/tb';
import toast from 'react-hot-toast';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import Select from '@/shared/components/ui/Select';
import { resolveMediaThumbnail } from '@/shared/api/media';
import { getApiErrorMessage } from '@/shared/api/strapiClient';
import { cn } from '@/shared/lib/cn';
import { useOpenShopping } from '@/features/compras/hooks';
import { getShoppingCode } from '@/features/compras/api';
import {
  PAY_STATUS_OPTIONS,
  SENT_BY_LABELS,
  SENT_BY_OPTIONS,
  SHOP_OPTIONS,
  toSelectOptions,
} from '../constants';
import { getEncargoDefaults, encargoSchema } from '../schema';
import { useSaveEncargo } from '../hooks';

const PAY_OPTIONS = toSelectOptions(PAY_STATUS_OPTIONS);
const SHOP_SELECT_OPTIONS = toSelectOptions(SHOP_OPTIONS);
const SENT_OPTIONS = SENT_BY_OPTIONS.map((value) => ({
  value,
  label: SENT_BY_LABELS[value] || value,
}));

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

function ShoppingNotice({ shopping, loading }) {
  if (loading) {
    return (
      <div className="rounded-lg border border-line bg-canvas/40 px-3 py-2 text-xs text-ink-muted">
        Buscando la compra abierta…
      </div>
    );
  }

  if (!shopping) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-price/25 bg-price/10 px-3 py-2">
        <p className="text-xs leading-relaxed text-price">
          No hay una compra abierta. Ábrela antes de registrar encargos.
        </p>
        <Link
          to="/compras"
          className="text-xs font-semibold text-price underline-offset-2 hover:underline"
        >
          Ir a compras
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-brand-500/25 bg-brand-500/10 px-3 py-2">
      <TbShoppingCart size={15} className="shrink-0 text-brand-300" aria-hidden="true" />
      <p className="text-xs text-brand-200">
        Se asignará a la compra abierta{' '}
        <span className="font-semibold text-brand-300">{getShoppingCode(shopping)}</span>.
      </p>
    </div>
  );
}

export default function EncargoFormModal({ open, onClose, encargo }) {
  const isEditing = Boolean(encargo);
  const formId = useId();
  const saveEncargo = useSaveEncargo();
  const openShoppingQuery = useOpenShopping();
  const openShopping = openShoppingQuery.data ?? null;
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState('');

  const canCreate = isEditing || Boolean(openShopping);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(encargoSchema),
    defaultValues: getEncargoDefaults(encargo),
  });

  const shopSelect = watch('shopSelect');

  useEffect(() => {
    if (open) {
      reset(getEncargoDefaults(encargo));
      setImageFile(null);
      setImageError('');
    }
  }, [open, encargo, reset]);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    }

    setImagePreview(resolveMediaThumbnail(encargo?.productImage, 'small'));
    return undefined;
  }, [imageFile, encargo]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = '';
    setImageError('');

    if (!file) {
      setImageFile(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setImageError('Debe ser una imagen');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setImageError('Máximo 10 MB');
      return;
    }

    setImageFile(file);
  };

  const onSubmit = handleSubmit(async (values) => {
    if (!isEditing && !imageFile) {
      setImageError('La imagen es obligatoria');
      return;
    }

    if (!isEditing && !openShopping) {
      toast.error('Abre una compra antes de registrar encargos');
      return;
    }

    const shopName =
      values.shopSelect === 'Otra' ? values.customShopName.trim() : values.shopSelect;

    try {
      await saveEncargo.mutateAsync({
        documentId: encargo?.documentId,
        values: {
          ...values,
          shopName,
          shoppingId: isEditing ? encargo.shoppingId : openShopping.id,
          deliveredStatus: isEditing ? encargo.deliveredStatus : 'Pendiente',
        },
        imageFile,
        existingDeliveredAt:
          encargo?.deliveredStatus === 'Entregado' ? encargo.deliveredAt : null,
        shoppingDocumentId: isEditing
          ? encargo?.shopping?.documentId
          : openShopping?.documentId,
      });
      toast.success(isEditing ? 'Encargo actualizado' : 'Encargo creado');
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo guardar el encargo'));
    }
  });

  const saving = isSubmitting || saveEncargo.isPending;

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title={isEditing ? 'Editar encargo' : 'Nuevo encargo'}
      description={
        isEditing
          ? `Encargo de ${encargo?.ownerName ?? 'cliente'}`
          : 'Registra los datos del pedido del cliente.'
      }
      size="xl"
      closeOnBackdrop={!saving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form={formId}
            loading={saving}
            disabled={!canCreate || openShoppingQuery.isLoading}
          >
            {isEditing ? 'Guardar cambios' : 'Crear encargo'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {!isEditing ? (
          <ShoppingNotice shopping={openShopping} loading={openShoppingQuery.isLoading} />
        ) : null}

        <form
          id={formId}
          onSubmit={onSubmit}
          className="grid gap-4 lg:grid-cols-[176px_minmax(0,1fr)] lg:items-start"
          noValidate
        >
          <div>
            <span className="block text-sm font-medium text-ink-soft">Imagen del producto</span>
            <div className="mt-2 space-y-2">
              {imageFile ? (
                <div className="relative w-40">
                  <img
                    src={imagePreview}
                    alt="Vista previa del producto"
                    className="h-40 w-40 rounded-xl object-cover ring-1 ring-brand-500/40"
                  />
                  <button
                    type="button"
                    onClick={() => setImageFile(null)}
                    className="absolute -right-1.5 -top-1.5 rounded-full bg-canvas-deep p-1 text-white shadow transition hover:bg-rose-600"
                    aria-label="Quitar imagen seleccionada"
                  >
                    <TbX size={12} />
                  </button>
                </div>
              ) : imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Imagen actual del producto"
                  className="h-40 w-40 rounded-xl object-cover ring-1 ring-line"
                />
              ) : null}

              {!imageFile ? (
                <label
                  className={cn(
                    'flex w-40 cursor-pointer items-center justify-center gap-1 rounded-xl border border-dashed border-line bg-surface-raised text-ink-faint transition hover:border-brand-500/50 hover:text-brand-200',
                    imagePreview ? 'h-9 flex-row' : 'h-40 flex-col',
                  )}
                >
                  <TbUpload size={imagePreview ? 15 : 20} aria-hidden="true" />
                  <span className="text-[11px] font-medium">
                    {imagePreview ? 'Cambiar' : 'Añadir'}
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
            <p className="mt-1 w-40 text-[10px] leading-snug text-ink-muted">
              {isEditing ? 'Opcional si no quieres cambiarla.' : 'Obligatoria al crear.'} Máx.
              10 MB.
            </p>
            {imageError ? (
              <p className="mt-1 w-40 text-xs font-medium text-danger">{imageError}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Input
              label="Nombre del cliente"
              placeholder="Ana Pérez"
              error={errors.ownerName?.message}
              {...register('ownerName')}
            />
            <Input
              label="Teléfono"
              placeholder="54805750"
              inputMode="tel"
              error={errors.ownerPhoneNumber?.message}
              {...register('ownerPhoneNumber')}
            />
            <div className="space-y-2">
              <Select
                label="Tienda"
                options={SHOP_SELECT_OPTIONS}
                error={errors.shopSelect?.message}
                {...register('shopSelect')}
              />
              {shopSelect === 'Otra' ? (
                <Input
                  aria-label="Nombre de la tienda"
                  placeholder="Nombre de la tienda"
                  error={errors.customShopName?.message}
                  {...register('customShopName')}
                />
              ) : null}
            </div>
            <Select
              label="Enviado por"
              options={SENT_OPTIONS}
              error={errors.sentBy?.message}
              {...register('sentBy')}
            />

            <div className="col-span-2">
              <Input
                label="Producto"
                placeholder="Tenis de mujer número 40"
                error={errors.productDescription?.message}
                {...register('productDescription')}
              />
            </div>
            <div className="col-span-2">
              <Input
                label="Enlace del producto"
                placeholder="https://…"
                inputMode="url"
                error={errors.productLink?.message}
                {...register('productLink')}
              />
            </div>

            <Input
              label="Precio de venta (cup)"
              type="number"
              inputMode="numeric"
              step="1"
              min="0"
              tone="price"
              suffix="cup"
              error={errors.productPrice?.message}
              {...register('productPrice', { valueAsNumber: true })}
            />
            <Input
              label="Precio tienda (USD)"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              tone="price"
              prefix="$"
              error={errors.shopPrice?.message}
              {...register('shopPrice', { valueAsNumber: true })}
            />
            <Input
              label="Peso (lb)"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              error={errors.productWeight?.message}
              {...register('productWeight', { valueAsNumber: true })}
            />
            <Input
              label="Precio de la libra"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              tone="price"
              prefix="$"
              error={errors.poundPrice?.message}
              {...register('poundPrice', { valueAsNumber: true })}
            />

            <Select
              label="Estado de pago"
              options={PAY_OPTIONS}
              error={errors.payStatus?.message}
              {...register('payStatus')}
            />
            <Input
              label="Fecha del encargo"
              type="date"
              error={errors.encargoCreatedAt?.message}
              {...register('encargoCreatedAt')}
            />
            <Input
              label="Último pago"
              type="date"
              error={errors.lastPaid?.message}
              {...register('lastPaid')}
            />
            <Input
              label="Observaciones"
              placeholder="Opcional"
              error={errors.observation?.message}
              {...register('observation')}
            />
          </div>
        </form>
      </div>
    </Modal>
  );
}
