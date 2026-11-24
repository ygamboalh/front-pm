import { useEffect, useMemo, useState } from 'react';
import { TbLock } from 'react-icons/tb';
import toast from 'react-hot-toast';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import ErrorState from '@/shared/components/ui/ErrorState';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { getApiErrorMessage } from '@/shared/api/strapiClient';
import { formatCup, formatNumber } from '@/shared/lib/formatters';
import { cn } from '@/shared/lib/cn';
import { useConfiguration } from '@/features/configuracion/hooks';
import { getShoppingCode } from '../api';
import { useAllShoppingEncargos, useCloseShopping } from '../hooks';

const PURCHASE_TAX = 1.12;
const round2 = (value) => Math.round(value * 100) / 100;

function SummaryItem({ label, value, tone }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-ink-faint">{label}</p>
      <p className={cn('mt-0.5 text-sm font-semibold tabular-nums', tone || 'text-ink')}>
        {value}
      </p>
    </div>
  );
}

export default function ShoppingCloseModal({ open, shopping, onClose }) {
  const closeShopping = useCloseShopping();
  const configurationQuery = useConfiguration();
  const configuration = configurationQuery.data ?? null;
  const encargosQuery = useAllShoppingEncargos(shopping?.documentId, open);
  const encargos = encargosQuery.data;

  const [givenMoney, setGivenMoney] = useState('0');
  const [totalSpentUSD, setTotalSpentUSD] = useState('0');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (open && shopping) {
      setGivenMoney(String(shopping.givenMoney ?? 0));
      setTotalSpentUSD(String(shopping.totalSpentUSD ?? 0));
      setFormError('');
    }
  }, [open, shopping]);

  const usdPrice =
    Number(shopping?.usdPrice) > 0
      ? Number(shopping?.usdPrice)
      : Number(configuration?.usdPrice) || 0;

  const totals = useMemo(() => {
    let weight = 0;
    let compra = 0;
    let envio = 0;

    for (const encargo of encargos ?? []) {
      const shopPrice = Number(encargo.shopPrice) || 0;
      const encargoWeight = Number(encargo.productWeight) || 0;
      const poundPrice = Number(encargo.poundPrice) || 0;

      const compraEncargo = shopPrice * usdPrice * PURCHASE_TAX;
      const envioEncargo = encargoWeight * poundPrice * usdPrice;

      weight += encargoWeight;
      compra += compraEncargo;
      envio += envioEncargo;
    }

    const buySpent = Math.round(compra);
    const shippingSpent = round2(envio);
    const totalSpent = Math.round(buySpent + shippingSpent);

    return {
      totalWeight: round2(weight),
      totalEncargos: (encargos ?? []).length,
      buySpent,
      shippingSpent,
      totalSpent,
    };
  }, [encargos, usdPrice]);

  const givenMoneyNumber = Number(givenMoney) || 0;
  const gain = Math.round(givenMoneyNumber - totals.totalSpent);
  const loading = encargosQuery.isLoading || configurationQuery.isLoading;

  const handleClose = async () => {
    if (givenMoneyNumber < 0 || Number(totalSpentUSD) < 0) {
      setFormError('Los importes no pueden ser negativos');
      return;
    }

    try {
      await closeShopping.mutateAsync({
        documentId: shopping.documentId,
        oldId: shopping.id,
        data: {
          ...totals,
          givenMoney: Math.round(givenMoneyNumber),
          totalSpentUSD: Number(totalSpentUSD) || 0,
          gain,
        },
      });
      toast.success('Compra cerrada');
      onClose();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo cerrar la compra'));
    }
  };

  if (!shopping) return null;

  return (
    <Modal
      open={open}
      onClose={closeShopping.isPending ? undefined : onClose}
      title="Cerrar compra"
      description={`Compra ${getShoppingCode(shopping)} · los totales se calculan con sus encargos`}
      size="md"
      closeOnBackdrop={!closeShopping.isPending}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={closeShopping.isPending}>
            Cancelar
          </Button>
          <Button
            onClick={handleClose}
            loading={closeShopping.isPending}
            disabled={loading}
          >
            <TbLock size={16} /> Cerrar compra
          </Button>
        </>
      }
    >
      {encargosQuery.isError ? (
        <ErrorState
          title="No se pudieron cargar los encargos"
          error={encargosQuery.error}
          onRetry={encargosQuery.refetch}
        />
      ) : loading ? (
        <div className="space-y-3">
          <Skeleton className="h-4 w-40" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={`close-skeleton-${index}`} className="h-10 w-full" />
            ))}
          </div>
          <Skeleton className="h-16 w-full" />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 rounded-xl border border-line bg-canvas/40 p-4 sm:grid-cols-3">
            <SummaryItem
              label="Peso total"
              value={`${formatNumber(totals.totalWeight)} lb`}
            />
            <SummaryItem label="Encargos" value={formatNumber(totals.totalEncargos)} />
            <SummaryItem label="Precio Zelle" value={formatCup(usdPrice)} tone="text-price" />
            <SummaryItem
              label="Gasto de compra"
              value={formatCup(totals.buySpent)}
              tone="text-price"
            />
            <SummaryItem
              label="Gasto de envío"
              value={formatCup(totals.shippingSpent)}
              tone="text-price"
            />
            <SummaryItem
              label="Total gastado"
              value={formatCup(totals.totalSpent)}
              tone="text-price"
            />
          </div>

          {totals.totalEncargos === 0 ? (
            <p className="text-xs text-price">
              Esta compra no tiene encargos; los totales se cerrarán en cero.
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="shopping-given-money"
              name="givenMoney"
              label="Dinero entregado"
              type="number"
              inputMode="numeric"
              step="1"
              min="0"
              tone="price"
              suffix="cup"
              value={givenMoney}
              onChange={(event) => setGivenMoney(event.target.value)}
              hint="Importe total recibido"
            />
            <Input
              id="shopping-total-spent-usd"
              name="totalSpentUSD"
              label="Total gastado (USD)"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              tone="price"
              prefix="$"
              value={totalSpentUSD}
              onChange={(event) => setTotalSpentUSD(event.target.value)}
              hint="Gasto real en dólares"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-line bg-canvas/40 px-4 py-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-ink-faint">Ganancia</p>
              <p className="text-[11px] text-ink-muted">
                Dinero entregado − total gastado
              </p>
            </div>
            <p
              className={cn(
                'text-xl font-semibold tabular-nums',
                gain >= 0 ? 'text-gain' : 'text-danger',
              )}
            >
              {formatCup(gain)}
            </p>
          </div>

          {formError ? <p className="text-xs font-medium text-danger">{formError}</p> : null}
        </div>
      )}
    </Modal>
  );
}
