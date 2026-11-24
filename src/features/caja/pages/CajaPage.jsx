import { useEffect, useMemo, useState } from 'react';
import {
  TbCash,
  TbFilterOff,
  TbListDetails,
  TbPlus,
  TbSearch,
  TbTrash,
  TbTrendingDown,
  TbTrendingUp,
} from 'react-icons/tb';
import toast from 'react-hot-toast';
import PageHeader from '@/shared/components/ui/PageHeader';
import Card from '@/shared/components/ui/Card';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import Select from '@/shared/components/ui/Select';
import Badge from '@/shared/components/ui/Badge';
import Metric from '@/shared/components/ui/Metric';
import Pagination from '@/shared/components/ui/Pagination';
import ErrorState from '@/shared/components/ui/ErrorState';
import ConfirmDialog from '@/shared/components/ui/ConfirmDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeaderCell,
  TableRow,
  TableSkeleton,
} from '@/shared/components/ui/Table';
import { getApiErrorMessage } from '@/shared/api/strapiClient';
import { formatCup, formatDate, formatNumber } from '@/shared/lib/formatters';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useDisclosure } from '@/shared/hooks/useDisclosure';
import { CASH_TYPE_OPTIONS } from '../constants';
import { summarizeCash } from '../api';
import {
  useCashMovements,
  useClearCashMovements,
  useCreateCashMovement,
  useDeleteCashMovement,
} from '../hooks';
import CashMovementModal from '../components/CashMovementModal';

const PAGE_SIZE = 15;
const COLUMNS = 6;

function isIncome(movement) {
  return Number(movement.ganancia) > 0;
}

function movementAmount(movement) {
  return isIncome(movement)
    ? Number(movement.ganancia) || 0
    : Number(movement.gasto) || 0;
}

function movementMotive(movement) {
  return movement.motivoGanancia || movement.motivoGasto || '—';
}

export default function CajaPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const formModal = useDisclosure();
  const deleteDialog = useDisclosure();
  const clearDialog = useDisclosure();

  const movementsQuery = useCashMovements();
  const createMovement = useCreateCashMovement();
  const deleteMovement = useDeleteCashMovement();
  const clearMovements = useClearCashMovements();

  const movements = useMemo(() => movementsQuery.data ?? [], [movementsQuery.data]);
  const summary = useMemo(() => summarizeCash(movements), [movements]);

  const filtered = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();

    return movements.filter((movement) => {
      if (type === 'ganancia' && !isIncome(movement)) return false;
      if (type === 'gasto' && isIncome(movement)) return false;
      if (term && !movementMotive(movement).toLowerCase().includes(term)) return false;
      return true;
    });
  }, [movements, type, debouncedSearch]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const items = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilters = Boolean(debouncedSearch || type);

  useEffect(() => {
    setPage(1);
  }, [type, debouncedSearch]);

  const handleCreate = async (values) => {
    try {
      await createMovement.mutateAsync({
        ...values,
        previousBalance: summary.balance,
      });
      toast.success('Movimiento registrado');
      formModal.close();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo registrar el movimiento'));
    }
  };

  const requestDelete = (movement) => {
    setDeleteTarget(movement);
    deleteDialog.open();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteMovement.mutateAsync(deleteTarget.documentId);
      toast.success('Movimiento eliminado');
      deleteDialog.close();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo eliminar el movimiento'));
    }
  };

  const confirmClear = async () => {
    try {
      await clearMovements.mutateAsync(movements.map((movement) => movement.documentId));
      toast.success('Registro de caja limpiado');
      clearDialog.close();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo limpiar el registro'));
    }
  };

  const clearFilters = () => {
    setSearch('');
    setType('');
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Operaciones"
        title="Caja"
        description="Movimiento de efectivo: ingresos, gastos y saldo disponible."
        actions={
          <>
            <Button
              variant="ghost"
              className="text-danger hover:bg-danger/10 hover:text-danger"
              onClick={clearDialog.open}
              disabled={movements.length === 0}
            >
              <TbTrash size={16} /> Limpiar registro
            </Button>
            <Button onClick={formModal.open}>
              <TbPlus size={17} /> Registrar movimiento
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Efectivo disponible"
          value={formatCup(summary.balance)}
          hint="Saldo del último movimiento"
          icon={TbCash}
          tone="price"
        />
        <Metric
          label="Ganancias acumuladas"
          value={formatCup(summary.income)}
          hint="Total de ingresos registrados"
          icon={TbTrendingUp}
          tone="gain"
        />
        <Metric
          label="Gastos acumulados"
          value={formatCup(summary.expenses)}
          hint="Total de gastos registrados"
          icon={TbTrendingDown}
          tone="danger"
        />
        <Metric
          label="Movimientos"
          value={formatNumber(summary.count)}
          hint="Registros de efectivo"
          icon={TbListDetails}
          tone="neutral"
        />
      </div>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_220px_auto]">
          <Input
            icon={TbSearch}
            placeholder="Buscar por motivo"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Buscar movimientos de caja"
          />
          <Select
            aria-label="Filtrar por tipo de movimiento"
            options={CASH_TYPE_OPTIONS}
            value={type}
            onChange={(event) => setType(event.target.value)}
          />
          <Button variant="secondary" onClick={clearFilters} disabled={!hasFilters}>
            <TbFilterOff size={16} /> Limpiar
          </Button>
        </div>
      </Card>

      <Card>
        {movementsQuery.isError ? (
          <ErrorState
            title="No se pudieron cargar los movimientos"
            error={movementsQuery.error}
            onRetry={movementsQuery.refetch}
          />
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Tipo</TableHeaderCell>
                <TableHeaderCell>Fecha</TableHeaderCell>
                <TableHeaderCell>Motivo</TableHeaderCell>
                <TableHeaderCell align="right">Cantidad</TableHeaderCell>
                <TableHeaderCell align="right">Resto</TableHeaderCell>
                <TableHeaderCell align="right">Acciones</TableHeaderCell>
              </TableRow>
            </TableHead>

            {movementsQuery.isLoading ? (
              <TableSkeleton rows={6} columns={COLUMNS} />
            ) : (
              <TableBody>
                {items.length === 0 ? (
                  <TableEmpty
                    colSpan={COLUMNS}
                    icon={hasFilters ? TbSearch : TbCash}
                    title={hasFilters ? 'Sin resultados' : 'No hay movimientos'}
                    description={
                      hasFilters
                        ? 'Prueba con otro término o cambia el filtro.'
                        : 'Registra el primer ingreso o gasto para controlar el efectivo.'
                    }
                  >
                    {hasFilters ? (
                      <Button size="sm" variant="secondary" onClick={clearFilters}>
                        Quitar filtros
                      </Button>
                    ) : (
                      <Button size="sm" onClick={formModal.open}>
                        <TbPlus size={16} /> Registrar movimiento
                      </Button>
                    )}
                  </TableEmpty>
                ) : (
                  items.map((movement) => {
                    const income = isIncome(movement);

                    return (
                      <TableRow key={movement.documentId || movement.id}>
                        <TableCell>
                          <Badge variant={income ? 'success' : 'danger'}>
                            {income ? 'Ganancia' : 'Gasto'}
                          </Badge>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-ink-muted">
                          {formatDate(movement.movementDate || movement.createdAt)}
                        </TableCell>
                        <TableCell className="text-ink">{movementMotive(movement)}</TableCell>
                        <TableCell
                          align="right"
                          className={
                            income
                              ? 'whitespace-nowrap font-semibold tabular-nums !text-gain'
                              : 'whitespace-nowrap font-semibold tabular-nums !text-danger'
                          }
                        >
                          {income ? '+' : '−'} {formatCup(movementAmount(movement))}
                        </TableCell>
                        <TableCell
                          align="right"
                          className="whitespace-nowrap font-semibold tabular-nums text-ink"
                        >
                          {formatCup(movement.resto)}
                        </TableCell>
                        <TableCell align="right">
                          <button
                            type="button"
                            onClick={() => requestDelete(movement)}
                            aria-label={`Eliminar movimiento ${movementMotive(movement)}`}
                            title="Eliminar movimiento"
                            className="rounded-md p-1.5 text-ink-faint transition hover:bg-danger/10 hover:text-danger"
                          >
                            <TbTrash size={17} />
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            )}
          </Table>
        )}

        {!movementsQuery.isError ? (
          <Pagination
            page={page}
            pageCount={pageCount}
            onChange={setPage}
            total={filtered.length}
            pageSize={PAGE_SIZE}
            itemLabel="movimientos"
          />
        ) : null}
      </Card>

      <CashMovementModal
        open={formModal.isOpen}
        onClose={formModal.close}
        balance={summary.balance}
        onSubmit={handleCreate}
        saving={createMovement.isPending}
      />

      <ConfirmDialog
        open={deleteDialog.isOpen}
        onClose={deleteDialog.close}
        onConfirm={confirmDelete}
        title="Eliminar movimiento"
        description={`Vas a eliminar el movimiento "${deleteTarget ? movementMotive(deleteTarget) : ''}". Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar"
        loading={deleteMovement.isPending}
      />

      <ConfirmDialog
        open={clearDialog.isOpen}
        onClose={clearDialog.close}
        onConfirm={confirmClear}
        title="Limpiar registro"
        description={`Vas a eliminar los ${formatNumber(movements.length)} movimientos de caja. El saldo volverá a 0 y esta acción no se puede deshacer.`}
        confirmLabel="Sí, limpiar"
        loading={clearMovements.isPending}
      />
    </div>
  );
}
