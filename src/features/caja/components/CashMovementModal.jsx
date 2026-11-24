import { useEffect, useId, useState } from 'react';
import { TbTrendingDown, TbTrendingUp } from 'react-icons/tb';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import Select from '@/shared/components/ui/Select';
import { formatCup } from '@/shared/lib/formatters';
import { cn } from '@/shared/lib/cn';
import { EXPENSE_REASONS, INCOME_REASONS } from '../constants';

function reasonOptions(reasons) {
  return reasons.map((reason) => ({ value: reason, label: reason }));
}

export default function CashMovementModal({
  open,
  onClose,
  balance = 0,
  onSubmit,
  saving = false,
}) {
  const formId = useId();
  const [type, setType] = useState('ganancia');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState(INCOME_REASONS[0]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setType('ganancia');
      setAmount('');
      setReason(INCOME_REASONS[0]);
      setError('');
    }
  }, [open]);

  const isIncome = type === 'ganancia';
  const reasons = isIncome ? INCOME_REASONS : EXPENSE_REASONS;
  const value = Math.max(0, Math.round(Number(amount) || 0));
  const resultingBalance = (Number(balance) || 0) + (isIncome ? value : -value);

  const handleTypeChange = (nextType) => {
    setType(nextType);
    setReason(nextType === 'ganancia' ? INCOME_REASONS[0] : EXPENSE_REASONS[0]);
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (value <= 0) {
      setError('Indica una cantidad mayor que 0');
      return;
    }

    setError('');
    await onSubmit({ type, amount: value, motive: reason });
  };

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      title="Registrar movimiento"
      description="Añade un ingreso o un gasto al efectivo disponible."
      size="sm"
      closeOnBackdrop={!saving}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} loading={saving}>
            Registrar
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit} className="space-y-3" noValidate>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleTypeChange('ganancia')}
            aria-pressed={isIncome}
            className={cn(
              'flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition',
              isIncome
                ? 'border-gain/40 bg-gain/10 text-gain'
                : 'border-line bg-surface-raised text-ink-muted hover:text-ink',
            )}
          >
            <TbTrendingUp size={16} aria-hidden="true" /> Ingreso
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('gasto')}
            aria-pressed={!isIncome}
            className={cn(
              'flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition',
              !isIncome
                ? 'border-danger/40 bg-danger/10 text-danger'
                : 'border-line bg-surface-raised text-ink-muted hover:text-ink',
            )}
          >
            <TbTrendingDown size={16} aria-hidden="true" /> Gasto
          </button>
        </div>

        <Input
          label="Cantidad (cup)"
          type="number"
          inputMode="numeric"
          min="1"
          step="1"
          tone={isIncome ? 'price' : undefined}
          placeholder="0"
          suffix="cup"
          value={amount}
          error={error || undefined}
          onChange={(event) => {
            setAmount(event.target.value);
            setError('');
          }}
        />

        <Select
          label="Motivo"
          options={reasonOptions(reasons)}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />

        <div className="grid grid-cols-2 gap-2 rounded-lg border border-line bg-canvas/40 px-3 py-2">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-ink-faint">Saldo actual</p>
            <p className="text-sm font-semibold tabular-nums text-ink">
              {formatCup(balance)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wide text-ink-faint">
              Saldo resultante
            </p>
            <p
              className={cn(
                'text-sm font-semibold tabular-nums',
                resultingBalance >= 0 ? 'text-gain' : 'text-danger',
              )}
            >
              {formatCup(resultingBalance)}
            </p>
          </div>
        </div>
      </form>
    </Modal>
  );
}
