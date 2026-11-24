import { useEffect, useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TbInfoCircle } from 'react-icons/tb';
import toast from 'react-hot-toast';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import Select from '@/shared/components/ui/Select';
import { getApiErrorMessage } from '@/shared/api/strapiClient';
import { formatCup, formatUsd } from '@/shared/lib/formatters';
import { SENT_BY_LABELS, SENT_BY_OPTIONS } from '@/shared/lib/constants';
import { getShoppingCode } from '../api';
import { getShoppingDefaults, shoppingSchema } from '../schema';
import { useSaveShopping } from '../hooks';

const SENT_OPTIONS = SENT_BY_OPTIONS.map((value) => ({
  value,
  label: SENT_BY_LABELS[value] || value,
}));

export default function ShoppingFormModal({ open, onClose, shopping, configuration }) {
  const isEditing = Boolean(shopping);
  const formId = useId();
  const saveShopping = useSaveShopping();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(shoppingSchema),
    defaultValues: getShoppingDefaults(shopping),
  });

  useEffect(() => {
    if (open) {
      reset(getShoppingDefaults(shopping));
    }
  }, [open, shopping, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await saveShopping.mutateAsync({
        documentId: shopping?.documentId,
        oldId: shopping?.id,
        values,
        configuration,
      });
      toast.success(isEditing ? 'Compra actualizada' : 'Compra abierta');
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo guardar la compra'));
    }
  });

  const saving = isSubmitting || saveShopping.isPending;
  const hasPrices = Number(configuration?.usdPrice) > 0 || Number(configuration?.poundPrice) > 0;

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title={isEditing ? 'Editar compra' : 'Abrir compra'}
      description={
        isEditing
          ? `Compra ${getShoppingCode(shopping)}`
          : 'La compra se abre con los totales en cero y se calculan al cerrarla.'
      }
      size="sm"
      closeOnBackdrop={!saving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} loading={saving}>
            {isEditing ? 'Guardar cambios' : 'Abrir compra'}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={onSubmit} className="space-y-4" noValidate>
        <Input
          label="Fecha de la compra"
          type="date"
          error={errors.shoppingCreatedAt?.message}
          {...register('shoppingCreatedAt')}
        />
        <Select
          label="Enviado por"
          options={SENT_OPTIONS}
          error={errors.sentBy?.message}
          {...register('sentBy')}
        />

        <div className="rounded-lg border border-line bg-canvas/40 px-4 py-3">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            <TbInfoCircle size={13} aria-hidden="true" />
            Precios desde Configuración
          </p>
          {hasPrices ? (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <p className="text-[11px] text-ink-muted">Precio del Zelle</p>
                <p className="text-sm font-semibold tabular-nums text-price">
                  {formatCup(configuration?.usdPrice ?? 0)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-ink-muted">Precio de la libra</p>
                <p className="text-sm font-semibold tabular-nums text-price">
                  {formatUsd(configuration?.poundPrice ?? 0)}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-1 text-xs text-price">
              No hay precios configurados. Revísalos en Configuración antes de cerrar la compra.
            </p>
          )}
        </div>
      </form>
    </Modal>
  );
}
