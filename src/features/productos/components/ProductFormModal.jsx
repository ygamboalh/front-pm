import { useEffect, useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TbChevronDown, TbPhoto, TbUpload, TbX } from 'react-icons/tb';
import toast from 'react-hot-toast';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import Select from '@/shared/components/ui/Select';
import { resolveMediaThumbnail } from '@/shared/api/media';
import { getApiErrorMessage } from '@/shared/api/strapiClient';
import { formatCup } from '@/shared/lib/formatters';
import { cn } from '@/shared/lib/cn';
import { SENT_BY_LABELS, SENT_BY_OPTIONS, SHOP_OPTIONS } from '@/shared/lib/constants';
import { GAIN_PERCENT_OPTIONS, PRODUCT_CATEGORY_OPTIONS, toSelectOptions } from '../constants';
import {
  computeProductCosts,
  getProductDefaults,
  productSchema,
} from '../schema';
import { useSaveProduct, useProductTypes } from '../hooks';

const SHOP_SELECT_OPTIONS = toSelectOptions(SHOP_OPTIONS);
const SENT_OPTIONS = SENT_BY_OPTIONS.map((value) => ({
  value,
  label: SENT_BY_LABELS[value] || value,
}));

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_IMAGES = 3;
const percentFormatter = new Intl.NumberFormat('es-ES', {
  maximumFractionDigits: 1,
});

export default function ProductFormModal({ open, onClose, product, configuration }) {
  const isEditing = Boolean(product);
  const formId = useId();
  const saveProduct = useSaveProduct();
  const typesQuery = useProductTypes();
  const baseCategories = typesQuery.data?.length
    ? typesQuery.data
    : PRODUCT_CATEGORY_OPTIONS;
  const categoryValues =
    product?.category && !baseCategories.includes(product.category)
      ? [product.category, ...baseCategories]
      : baseCategories;
  const categoryOptions = toSelectOptions(categoryValues);

  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);
  const [imageError, setImageError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    getValues,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: getProductDefaults(product, configuration),
  });

  const watchedValues = watch();
  const shopSelect = watchedValues.shopSelect;
  const received = Boolean(watchedValues.received);
  const canMarkReceived = (product?.deliveredStatus || 'Comprado') === 'Comprado';
  const showArrivalDate = (canMarkReceived && received) || Boolean(watchedValues.arrivedAt);
  const { totalCost, gainPlanned, gainPercent } = computeProductCosts(watchedValues);
  const hasCost = totalCost > 0;

  useEffect(() => {
    if (open) {
      reset(getProductDefaults(product, configuration));
      const images = Array.isArray(product?.productImage)
        ? product.productImage
        : product?.productImage
          ? [product.productImage]
          : [];
      setExistingImages(images);
      setNewFiles([]);
      setImageError('');
    }
  }, [open, product, configuration, reset]);

  useEffect(() => {
    const urls = newFiles.map((file) => URL.createObjectURL(file));
    setNewPreviews(urls);

    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, [newFiles]);

  const totalImages = existingImages.length + newFiles.length;

  const handleFilesChange = (event) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = '';
    setImageError('');

    if (files.length === 0) return;

    const invalid = files.find((file) => !file.type.startsWith('image/'));
    if (invalid) {
      setImageError('Solo se permiten archivos de imagen');
      return;
    }

    const tooLarge = files.find((file) => file.size > MAX_IMAGE_SIZE);
    if (tooLarge) {
      setImageError('Cada imagen debe pesar menos de 10 MB');
      return;
    }

    setNewFiles((current) => {
      const next = [...current, ...files];
      if (existingImages.length + next.length > MAX_IMAGES) {
        setImageError(`Máximo ${MAX_IMAGES} imágenes por producto`);
        return current;
      }
      return next;
    });
  };

  const removeExisting = (id) => {
    setExistingImages((current) => current.filter((image) => image.id !== id));
  };

  const removeNew = (index) => {
    setNewFiles((current) => current.filter((_, position) => position !== index));
  };

  const onSubmit = handleSubmit(async (values) => {
    if (totalImages === 0) {
      setImageError('Añade al menos una imagen del producto');
      return;
    }

    try {
      await saveProduct.mutateAsync({
        documentId: product?.documentId,
        values,
        files: newFiles,
        keepImageIds: existingImages.map((image) => image.id),
        current: product,
      });
      toast.success(isEditing ? 'Producto actualizado' : 'Producto creado');
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo guardar el producto'));
    }
  });

  const saving = isSubmitting || saveProduct.isPending;

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title={isEditing ? 'Editar producto' : 'Nuevo producto'}
      description={
        isEditing
          ? product?.productDescription
          : 'Registra un artículo del inventario y sus imágenes.'
      }
      size="xl"
      closeOnBackdrop={!saving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} loading={saving}>
            {isEditing ? 'Guardar cambios' : 'Crear producto'}
          </Button>
        </>
      }
    >
      <form
        id={formId}
        onSubmit={onSubmit}
        className="grid grid-cols-2 gap-2 sm:grid-cols-4"
        noValidate
      >
        <Select
          label="Categoría"
          placeholder="Selecciona una categoría"
          options={categoryOptions}
          error={errors.category?.message}
          {...register('category')}
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
        <Input
          label="Fecha de compra"
          type="date"
          error={errors.buyDate?.message}
          {...register('buyDate')}
        />

        <div className="col-span-2">
          <Input
            label="Descripción"
            placeholder="Ej. Tenis deportivos talla 42"
            error={errors.productDescription?.message}
            {...register('productDescription')}
          />
        </div>
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
          label="Fecha de alta"
          type="date"
          error={errors.productCreatedAt?.message}
          {...register('productCreatedAt')}
        />

        <Input
          label="Precio del Zelle (cup)"
          type="number"
          inputMode="numeric"
          step="1"
          min="0"
          tone="percent"
          suffix="cup"
          error={errors.usdPrice?.message}
          {...register('usdPrice', { valueAsNumber: true })}
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
        <Input
          label="Peso (lb)"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          error={errors.weight?.message}
          {...register('weight', { valueAsNumber: true })}
        />
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="sellPrice" className="text-sm font-medium text-ink-soft">
              Precio de venta
            </label>
            <span className="relative inline-flex items-center">
              <select
                aria-label="Porcentaje de ganancia"
                title="Porcentaje de ganancia"
                className="h-6 appearance-none rounded-md border border-percent/30 bg-percent/10 pl-2 pr-6 text-[11px] font-semibold text-percent outline-none transition focus:border-percent/60"
                {...register('gainPercent', {
                  valueAsNumber: true,
                  onChange: (event) => {
                    const percent = Number(event.target.value);
                    const { totalCost: cost } = computeProductCosts(getValues());
                    setValue(
                      'sellPrice',
                      Math.round(cost * (1 + percent / 100)),
                      { shouldDirty: true, shouldValidate: true },
                    );
                  },
                })}
              >
                {GAIN_PERCENT_OPTIONS.map((percent) => (
                  <option key={percent} value={percent} className="bg-surface text-ink">
                    {percent}%
                  </option>
                ))}
              </select>
              <TbChevronDown
                size={12}
                aria-hidden="true"
                className="pointer-events-none absolute right-1.5 text-percent"
              />
            </span>
          </div>
          <Input
            id="sellPrice"
            type="number"
            inputMode="numeric"
            step="1"
            min="0"
            tone="price"
            placeholder="0"
            suffix="cup"
            error={errors.sellPrice?.message}
            {...register('sellPrice', { valueAsNumber: true })}
          />
        </div>

        <div className="col-span-2 sm:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="block text-sm font-medium text-ink-soft">Imágenes</span>
            {canMarkReceived ? (
              <label className="flex cursor-pointer items-center gap-2">
                <span
                  className={cn(
                    'text-[11px] font-medium',
                    received ? 'text-gain' : 'text-ink-muted',
                  )}
                >
                  {received ? 'Producto recibido' : '¿Ya llegó a tus manos?'}
                </span>
                <span className="relative inline-flex h-5 w-9 items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    {...register('received', {
                      onChange: (event) => {
                        if (event.target.checked) {
                          if (!getValues('arrivedAt')) {
                            setValue('arrivedAt', new Date().toISOString().slice(0, 10), {
                              shouldDirty: true,
                            });
                          }
                        } else {
                          setValue('arrivedAt', '', { shouldDirty: true });
                        }
                      },
                    })}
                  />
                  <span className="h-5 w-9 rounded-full bg-surface-hover ring-1 ring-inset ring-line transition peer-checked:bg-gain/25 peer-checked:ring-gain/40" />
                  <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-ink-faint transition peer-checked:translate-x-4 peer-checked:bg-gain" />
                </span>
              </label>
            ) : null}
            {showArrivalDate ? (
              <label className="flex items-center gap-1.5">
                <span className="text-[11px] text-ink-muted">Llegada</span>
                <input
                  type="date"
                  aria-label="Fecha de llegada"
                  className="h-6 rounded-md border border-line bg-surface-raised px-1.5 text-[11px] text-ink outline-none transition focus:border-brand-500"
                  {...register('arrivedAt')}
                />
              </label>
            ) : null}
          </div>
          {errors.arrivedAt ? (
            <p className="mt-0.5 text-[10px] font-medium text-danger">
              {errors.arrivedAt.message}
            </p>
          ) : null}
          <div className="mt-1 flex gap-2 overflow-x-auto pb-1">
            {existingImages.map((image) => (
              <div key={image.id} className="relative shrink-0">
                <img
                  src={resolveMediaThumbnail(image, 'thumbnail')}
                  alt={image.name || 'Imagen del producto'}
                  className="h-40 w-40 rounded-xl object-cover ring-1 ring-line"
                />
                <button
                  type="button"
                  onClick={() => removeExisting(image.id)}
                  className="absolute -right-1.5 -top-1.5 rounded-full bg-canvas-deep p-1 text-white shadow transition hover:bg-rose-600"
                  aria-label={`Quitar imagen ${image.name || image.id}`}
                >
                  <TbX size={12} />
                </button>
              </div>
            ))}

            {newFiles.map((file, index) => (
              <div key={`${file.name}-${index}`} className="relative shrink-0">
                <img
                  src={newPreviews[index]}
                  alt={file.name}
                  className="h-40 w-40 rounded-xl object-cover ring-1 ring-brand-500/40"
                />
                <button
                  type="button"
                  onClick={() => removeNew(index)}
                  className="absolute -right-1.5 -top-1.5 rounded-full bg-canvas-deep p-1 text-white shadow transition hover:bg-rose-600"
                  aria-label={`Quitar imagen ${file.name}`}
                >
                  <TbX size={12} />
                </button>
              </div>
            ))}

            {totalImages < MAX_IMAGES ? (
              <label className="flex h-40 w-40 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line bg-surface-raised text-ink-faint transition hover:border-brand-500/50 hover:text-brand-200">
                <TbUpload size={20} />
                <span className="text-[11px] font-medium">Añadir</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={handleFilesChange}
                />
              </label>
            ) : null}
          </div>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-[11px] text-ink-muted">
              <TbPhoto size={13} aria-hidden="true" />
              {totalImages} de {MAX_IMAGES} imágenes · máx. 10 MB
            </p>
            {imageError ? (
              <p className="text-xs font-medium text-danger">{imageError}</p>
            ) : null}
          </div>
        </div>

        <div className="col-span-2 flex flex-col justify-center gap-1.5 sm:col-span-1">
          <div className="rounded-lg bg-price/10 px-3 py-1.5 ring-1 ring-inset ring-price/20">
            <p className="text-[10px] font-medium uppercase tracking-wide text-price/80">
              Coste total
            </p>
            <p className="text-lg font-semibold tabular-nums text-price">
              {formatCup(totalCost)}
            </p>
          </div>
          <div
            className={cn(
              'rounded-lg px-3 py-1.5 ring-1 ring-inset',
              gainPlanned >= 0 ? 'bg-gain/10 ring-gain/20' : 'bg-danger/10 ring-danger/20',
            )}
          >
            <p
              className={cn(
                'text-[10px] font-medium uppercase tracking-wide',
                gainPlanned >= 0 ? 'text-gain/80' : 'text-danger/80',
              )}
            >
              Ganancia
            </p>
            <p
              className={cn(
                'text-lg font-semibold tabular-nums',
                gainPlanned >= 0 ? 'text-gain' : 'text-danger',
              )}
            >
              {formatCup(gainPlanned)}
            </p>
          </div>
          <div className="rounded-lg bg-percent/10 px-3 py-1.5 ring-1 ring-inset ring-percent/20">
            <p className="text-[10px] font-medium uppercase tracking-wide text-percent/80">
              % de ganancia
            </p>
            <p className="text-lg font-semibold tabular-nums text-percent">
              {hasCost ? `${percentFormatter.format(gainPercent)} %` : '—'}
            </p>
          </div>
        </div>
      </form>
    </Modal>
  );
}
