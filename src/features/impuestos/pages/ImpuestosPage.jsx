import { useEffect, useMemo, useState } from 'react';
import {
  TbEye,
  TbFilterOff,
  TbPencil,
  TbPlus,
  TbReceipt,
  TbSearch,
  TbTrash,
} from 'react-icons/tb';
import toast from 'react-hot-toast';
import PageHeader from '@/shared/components/ui/PageHeader';
import Card, { CardHeader } from '@/shared/components/ui/Card';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import Pagination from '@/shared/components/ui/Pagination';
import Spinner from '@/shared/components/ui/Spinner';
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
import { useDeleteTax, useTaxes } from '../hooks';
import TaxFormModal from '../components/TaxFormModal';
import TaxDetailModal from '../components/TaxDetailModal';

const PAGE_SIZE = 10;
const COLUMNS = 8;

function ActionIcon({ label, onClick, children, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={
        danger
          ? 'rounded-md p-1.5 text-ink-faint transition hover:bg-danger/10 hover:text-danger'
          : 'rounded-md p-1.5 text-ink-faint transition hover:bg-surface-hover hover:text-ink-soft'
      }
    >
      {children}
    </button>
  );
}

export default function ImpuestosPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const formModal = useDisclosure();
  const detailModal = useDisclosure();
  const deleteDialog = useDisclosure();

  const filters = useMemo(
    () => ({ page, pageSize: PAGE_SIZE, search: debouncedSearch }),
    [page, debouncedSearch],
  );

  const taxesQuery = useTaxes(filters);
  const deleteTax = useDeleteTax();

  const items = taxesQuery.data?.items ?? [];
  const meta = taxesQuery.data?.meta ?? { page: 1, pageCount: 1, total: 0 };
  const hasFilters = Boolean(debouncedSearch);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const openCreate = () => {
    setEditing(null);
    formModal.open();
  };

  const openDetail = (tax) => {
    setSelected(tax);
    detailModal.open();
  };

  const openEdit = (tax) => {
    detailModal.close();
    setEditing(tax);
    formModal.open();
  };

  const requestDelete = (tax) => {
    detailModal.close();
    setDeleteTarget(tax);
    deleteDialog.open();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteTax.mutateAsync(deleteTarget.documentId);
      toast.success('Impuesto eliminado');
      deleteDialog.close();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo eliminar el impuesto'));
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Finanzas"
        title="Impuestos"
        description="Pagos, comprobantes y ganancias por impuesto."
        actions={
          <Button onClick={openCreate}>
            <TbPlus size={17} /> Nuevo impuesto
          </Button>
        }
      />

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
          <Input
            icon={TbSearch}
            placeholder="Buscar por mes, código o descripción"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Buscar impuestos"
          />
          <Button
            variant="secondary"
            onClick={() => setSearch('')}
            disabled={!hasFilters}
          >
            <TbFilterOff size={16} /> Limpiar
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Listado de impuestos"
          description={`${formatNumber(meta.total)} impuestos registrados`}
          actions={
            taxesQuery.isFetching && !taxesQuery.isLoading ? (
              <Spinner size="sm" className="text-brand-500" label="Actualizando" />
            ) : null
          }
        />

        {taxesQuery.isError ? (
          <ErrorState
            title="No se pudieron cargar los impuestos"
            error={taxesQuery.error}
            onRetry={taxesQuery.refetch}
          />
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Mes</TableHeaderCell>
                <TableHeaderCell>Código</TableHeaderCell>
                <TableHeaderCell>Descripción</TableHeaderCell>
                <TableHeaderCell align="right">Importe</TableHeaderCell>
                <TableHeaderCell align="right">Pagado</TableHeaderCell>
                <TableHeaderCell align="right">Ganancia</TableHeaderCell>
                <TableHeaderCell>Pago</TableHeaderCell>
                <TableHeaderCell align="right">Acciones</TableHeaderCell>
              </TableRow>
            </TableHead>

            {taxesQuery.isLoading ? (
              <TableSkeleton rows={5} columns={COLUMNS} />
            ) : (
              <TableBody>
                {items.length === 0 ? (
                  <TableEmpty
                    colSpan={COLUMNS}
                    icon={hasFilters ? TbSearch : TbReceipt}
                    title={hasFilters ? 'Sin resultados' : 'Todavía no hay impuestos'}
                    description={
                      hasFilters
                        ? 'Prueba con otro término de búsqueda.'
                        : 'Registra el primer impuesto con su comprobante para llevar el control.'
                    }
                  >
                    {!hasFilters ? (
                      <Button size="sm" onClick={openCreate}>
                        <TbPlus size={16} /> Registrar impuesto
                      </Button>
                    ) : (
                      <Button size="sm" variant="secondary" onClick={() => setSearch('')}>
                        Quitar búsqueda
                      </Button>
                    )}
                  </TableEmpty>
                ) : (
                  items.map((tax) => (
                    <TableRow key={tax.documentId || tax.id}>
                      <TableCell className="font-medium text-ink">
                        {tax.month || '—'}
                      </TableCell>
                      <TableCell className="text-ink-soft">{tax.code || '—'}</TableCell>
                      <TableCell>
                        <span className="block max-w-[220px] truncate text-ink-soft">
                          {tax.description || '—'}
                        </span>
                      </TableCell>
                      <TableCell align="right" className="font-semibold tabular-nums !text-price">
                        {formatCup(tax.amount)}
                      </TableCell>
                      <TableCell align="right" className="font-semibold tabular-nums !text-price/80">
                        {formatCup(tax.realPaid)}
                      </TableCell>
                      <TableCell align="right" className="font-semibold tabular-nums !text-gain">
                        {formatCup(tax.gain)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-ink-muted">
                        {formatDate(tax.paymentDate)}
                      </TableCell>
                      <TableCell align="right">
                        <div className="flex justify-end gap-1">
                          <ActionIcon
                            label={`Ver impuesto ${tax.month || ''}`.trim()}
                            onClick={() => openDetail(tax)}
                          >
                            <TbEye size={17} />
                          </ActionIcon>
                          <ActionIcon
                            label={`Editar impuesto ${tax.month || ''}`.trim()}
                            onClick={() => openEdit(tax)}
                          >
                            <TbPencil size={17} />
                          </ActionIcon>
                          <ActionIcon
                            label={`Eliminar impuesto ${tax.month || ''}`.trim()}
                            onClick={() => requestDelete(tax)}
                            danger
                          >
                            <TbTrash size={17} />
                          </ActionIcon>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            )}
          </Table>
        )}

        {!taxesQuery.isError ? (
          <Pagination
            page={meta.page ?? page}
            pageCount={meta.pageCount ?? 1}
            onChange={setPage}
            total={meta.total ?? 0}
            pageSize={meta.pageSize ?? PAGE_SIZE}
            itemLabel="impuestos"
          />
        ) : null}
      </Card>

      <TaxFormModal open={formModal.isOpen} onClose={formModal.close} tax={editing} />

      <TaxDetailModal
        open={detailModal.isOpen}
        tax={selected}
        onClose={detailModal.close}
        onEdit={() => selected && openEdit(selected)}
        onDelete={() => selected && requestDelete(selected)}
      />

      <ConfirmDialog
        open={deleteDialog.isOpen}
        onClose={deleteDialog.close}
        onConfirm={confirmDelete}
        title="Eliminar impuesto"
        description={`Vas a eliminar el impuesto de "${
          deleteTarget?.month || 'este mes'
        }". El comprobante no se borra de la biblioteca de medios. Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar"
        loading={deleteTax.isPending}
      />
    </div>
  );
}
