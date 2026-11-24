import { useEffect, useMemo, useState } from 'react';
import {
  TbEye,
  TbFilterOff,
  TbPackage,
  TbPencil,
  TbPhoto,
  TbPlus,
  TbSearch,
  TbTrash,
} from 'react-icons/tb';
import toast from 'react-hot-toast';
import PageHeader from '@/shared/components/ui/PageHeader';
import Card, { CardHeader } from '@/shared/components/ui/Card';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import Select from '@/shared/components/ui/Select';
import Badge from '@/shared/components/ui/Badge';
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
import { resolveMediaThumbnail } from '@/shared/api/media';
import { formatCup, formatDate, formatNumber, formatUsd } from '@/shared/lib/formatters';
import { deliveredStatusVariant, payStatusVariant } from '@/shared/lib/status';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useDisclosure } from '@/shared/hooks/useDisclosure';
import {
  DELIVERED_STATUS_OPTIONS,
  PAY_STATUS_OPTIONS,
  toSelectOptions,
} from '../constants';
import { useDeleteEncargo, useEncargos, useMarkEncargoDelivered } from '../hooks';
import EncargoFormModal from '../components/EncargoFormModal';
import EncargoDetailModal from '../components/EncargoDetailModal';

const PAGE_SIZE = 10;
const COLUMNS = 10;
const DELIVERED_OPTIONS = toSelectOptions(DELIVERED_STATUS_OPTIONS);
const PAY_OPTIONS = toSelectOptions(PAY_STATUS_OPTIONS);

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

export default function EncargosPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [deliveredStatus, setDeliveredStatus] = useState('');
  const [payStatus, setPayStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);

  const formModal = useDisclosure();
  const detailModal = useDisclosure();
  const deleteDialog = useDisclosure();

  const filters = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      search: debouncedSearch,
      deliveredStatus,
      payStatus,
    }),
    [page, debouncedSearch, deliveredStatus, payStatus],
  );

  const encargosQuery = useEncargos(filters);
  const deleteEncargo = useDeleteEncargo();
  const markDelivered = useMarkEncargoDelivered();

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, deliveredStatus, payStatus]);

  const items = encargosQuery.data?.items ?? [];
  const meta = encargosQuery.data?.meta ?? { page: 1, pageCount: 1, total: 0 };
  const hasFilters = Boolean(debouncedSearch || deliveredStatus || payStatus);

  const clearFilters = () => {
    setSearch('');
    setDeliveredStatus('');
    setPayStatus('');
  };

  const openCreate = () => {
    setEditing(null);
    formModal.open();
  };

  const openEdit = (encargo) => {
    detailModal.close();
    setEditing(encargo);
    formModal.open();
  };

  const openDetail = (encargo) => {
    setSelected(encargo);
    detailModal.open();
  };

  const requestDelete = (encargo) => {
    setSelected(encargo);
    detailModal.close();
    deleteDialog.open();
  };

  const confirmDelete = async () => {
    if (!selected) return;
    try {
      await deleteEncargo.mutateAsync(selected.documentId);
      toast.success('Encargo eliminado');
      deleteDialog.close();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo eliminar el encargo'));
    }
  };

  const handleMarkDelivered = async () => {
    if (!selected) return;
    try {
      await markDelivered.mutateAsync(selected.documentId);
      toast.success('Encargo marcado como entregado');
      detailModal.close();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo actualizar el encargo'));
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Operaciones"
        title="Encargos"
        description="Pedidos de clientes, pagos y estado de entrega."
        actions={
          <Button onClick={openCreate}>
            <TbPlus size={17} /> Nuevo encargo
          </Button>
        }
      />

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
          <Input
            icon={TbSearch}
            placeholder="Buscar por cliente, producto, tienda o teléfono"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Buscar encargos"
          />
          <Select
            aria-label="Filtrar por estado de entrega"
            placeholder="Todos los estados"
            options={DELIVERED_OPTIONS}
            value={deliveredStatus}
            onChange={(event) => setDeliveredStatus(event.target.value)}
          />
          <Select
            aria-label="Filtrar por estado de pago"
            placeholder="Todos los pagos"
            options={PAY_OPTIONS}
            value={payStatus}
            onChange={(event) => setPayStatus(event.target.value)}
          />
          <Button
            variant="secondary"
            onClick={clearFilters}
            disabled={!hasFilters}
            className="xl:w-auto"
          >
            <TbFilterOff size={16} /> Limpiar
          </Button>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Listado de encargos"
          description={`${formatNumber(meta.total)} encargos registrados`}
          actions={
            encargosQuery.isFetching && !encargosQuery.isLoading ? (
              <Spinner size="sm" className="text-brand-500" label="Actualizando" />
            ) : null
          }
        />

        {encargosQuery.isError ? (
          <ErrorState
            title="No se pudieron cargar los encargos"
            error={encargosQuery.error}
            onRetry={encargosQuery.refetch}
          />
        ) : (
          <Table className="[&_th]:px-2 [&_td]:px-2 [&_th]:py-2.5 [&_td]:py-2.5">
            <TableHead>
              <TableRow>
                <TableHeaderCell>Imagen</TableHeaderCell>
                <TableHeaderCell>Cliente</TableHeaderCell>
                <TableHeaderCell>Producto</TableHeaderCell>
                <TableHeaderCell>Estado</TableHeaderCell>
                <TableHeaderCell>Pago</TableHeaderCell>
                <TableHeaderCell align="right">Precio</TableHeaderCell>
                <TableHeaderCell align="right">Precio tienda</TableHeaderCell>
                <TableHeaderCell align="right">Peso</TableHeaderCell>
                <TableHeaderCell>Fecha</TableHeaderCell>
                <TableHeaderCell align="right">Acciones</TableHeaderCell>
              </TableRow>
            </TableHead>

            {encargosQuery.isLoading ? (
              <TableSkeleton rows={5} columns={COLUMNS} />
            ) : (
              <TableBody>
                {items.length === 0 ? (
                  <TableEmpty
                    colSpan={COLUMNS}
                    icon={hasFilters ? TbSearch : TbPackage}
                    title={hasFilters ? 'Sin resultados' : 'Todavía no hay encargos'}
                    description={
                      hasFilters
                        ? 'Prueba con otro término de búsqueda o cambia los filtros.'
                        : 'Registra el primer encargo para empezar a controlar pedidos y pagos.'
                    }
                  >
                    {!hasFilters ? (
                      <Button size="sm" onClick={openCreate}>
                        <TbPlus size={16} /> Crear encargo
                      </Button>
                    ) : (
                      <Button size="sm" variant="secondary" onClick={clearFilters}>
                        Quitar filtros
                      </Button>
                    )}
                  </TableEmpty>
                ) : (
                  items.map((encargo) => {
                    const thumbnail = resolveMediaThumbnail(
                      encargo.productImage,
                      'thumbnail',
                    );

                    return (
                      <TableRow key={encargo.documentId || encargo.id}>
                        <TableCell>
                          {thumbnail ? (
                            <img
                              src={thumbnail}
                              alt={encargo.productDescription || 'Encargo'}
                              className="h-10 w-10 rounded-lg object-cover ring-1 ring-line"
                            />
                          ) : (
                            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-raised text-ink-faint">
                              <TbPhoto size={16} aria-hidden="true" />
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <p className="font-medium text-ink">{encargo.ownerName || '—'}</p>
                          <p className="text-xs text-ink-muted">
                            {encargo.ownerPhoneNumber || '—'}
                          </p>
                        </TableCell>
                      <TableCell>
                        <p className="max-w-[280px] truncate text-ink">
                          {encargo.productDescription || '—'}
                        </p>
                        <p className="text-xs text-ink-muted">{encargo.shopName || '—'}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={deliveredStatusVariant(encargo.deliveredStatus)}>
                          {encargo.deliveredStatus || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={payStatusVariant(encargo.payStatus)}>
                          {encargo.payStatus || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell
                        align="right"
                        className="whitespace-nowrap font-semibold tabular-nums !text-price"
                      >
                        {formatCup(encargo.productPrice)}
                      </TableCell>
                      <TableCell
                        align="right"
                        className="whitespace-nowrap text-xs font-medium tabular-nums text-price"
                      >
                        {formatUsd(encargo.shopPrice)}
                      </TableCell>
                      <TableCell
                        align="right"
                        className="whitespace-nowrap text-xs tabular-nums text-ink-muted"
                      >
                        {formatNumber(encargo.productWeight)} lb
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-ink-muted">
                        {formatDate(encargo.encargoCreatedAt)}
                      </TableCell>
                      <TableCell align="right">
                        <div className="flex justify-end gap-1">
                          <ActionIcon
                            label={`Ver detalle de ${encargo.ownerName || 'encargo'}`}
                            onClick={() => openDetail(encargo)}
                          >
                            <TbEye size={17} />
                          </ActionIcon>
                          <ActionIcon
                            label={`Editar encargo de ${encargo.ownerName || 'cliente'}`}
                            onClick={() => openEdit(encargo)}
                          >
                            <TbPencil size={17} />
                          </ActionIcon>
                          <ActionIcon
                            label={`Eliminar encargo de ${encargo.ownerName || 'cliente'}`}
                            onClick={() => requestDelete(encargo)}
                            danger
                          >
                            <TbTrash size={17} />
                          </ActionIcon>
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            )}
          </Table>
        )}

        {!encargosQuery.isError ? (
          <Pagination
            page={meta.page ?? page}
            pageCount={meta.pageCount ?? 1}
            onChange={setPage}
            total={meta.total ?? 0}
            pageSize={meta.pageSize ?? PAGE_SIZE}
            itemLabel="encargos"
          />
        ) : null}
      </Card>

      <EncargoFormModal open={formModal.isOpen} onClose={formModal.close} encargo={editing} />

      <EncargoDetailModal
        open={detailModal.isOpen}
        encargo={selected}
        onClose={detailModal.close}
        onEdit={() => selected && openEdit(selected)}
        onDelete={() => selected && requestDelete(selected)}
        onMarkDelivered={
          selected && selected.deliveredStatus !== 'Entregado'
            ? handleMarkDelivered
            : undefined
        }
        marking={markDelivered.isPending}
      />

      <ConfirmDialog
        open={deleteDialog.isOpen}
        onClose={deleteDialog.close}
        onConfirm={confirmDelete}
        title="Eliminar encargo"
        description={`Vas a eliminar el encargo de ${
          selected?.ownerName || 'este cliente'
        } (${selected?.productDescription || 'sin descripción'}). Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar"
        loading={deleteEncargo.isPending}
      />
    </div>
  );
}
