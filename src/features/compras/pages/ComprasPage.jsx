import { useEffect, useMemo, useState } from 'react';
import {
  TbEye,
  TbLock,
  TbLockOpen,
  TbPackage,
  TbPencil,
  TbPlus,
  TbShoppingCart,
  TbTrash,
} from 'react-icons/tb';
import toast from 'react-hot-toast';
import PageHeader from '@/shared/components/ui/PageHeader';
import Card, { CardHeader } from '@/shared/components/ui/Card';
import Button from '@/shared/components/ui/Button';
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
import { formatDate, formatCup, formatNumber } from '@/shared/lib/formatters';
import { useDisclosure } from '@/shared/hooks/useDisclosure';
import { useConfiguration } from '@/features/configuracion/hooks';
import { getShoppingCode } from '../api';
import {
  useDeleteShopping,
  useOpenShopping,
  useShoppingEncargoCounts,
  useShoppings,
  useToggleShoppingClosed,
} from '../hooks';
import ShoppingFormModal from '../components/ShoppingFormModal';
import ShoppingDetailModal from '../components/ShoppingDetailModal';
import ShoppingCloseModal from '../components/ShoppingCloseModal';
import EncargoFormModal from '@/features/encargos/components/EncargoFormModal';

const PAGE_SIZE = 10;
const COLUMNS = 9;
const STATUS_OPTIONS = [
  { value: '', label: 'Todas las compras' },
  { value: 'false', label: 'Abiertas' },
  { value: 'true', label: 'Cerradas' },
];

function ActionIcon({ label, onClick, children, danger = false, disabled = false, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={title || label}
      className={
        disabled
          ? 'cursor-not-allowed rounded-md p-1.5 text-ink-faint opacity-40'
          : danger
            ? 'rounded-md p-1.5 text-ink-faint transition hover:bg-danger/10 hover:text-danger'
            : 'rounded-md p-1.5 text-ink-faint transition hover:bg-surface-hover hover:text-ink-soft'
      }
    >
      {children}
    </button>
  );
}

export default function ComprasPage() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [editing, setEditing] = useState(null);
  const [toggleTarget, setToggleTarget] = useState(null);
  const [closeTarget, setCloseTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const formModal = useDisclosure();
  const detailModal = useDisclosure();
  const toggleDialog = useDisclosure();
  const closeModal = useDisclosure();
  const deleteDialog = useDisclosure();
  const encargoModal = useDisclosure();

  const filters = useMemo(
    () => ({ page, pageSize: PAGE_SIZE, isClosed: status }),
    [page, status],
  );

  const shoppingsQuery = useShoppings(filters);
  const openShoppingQuery = useOpenShopping();
  const configurationQuery = useConfiguration();
  const toggleClosed = useToggleShoppingClosed();
  const deleteShopping = useDeleteShopping();

  const openShopping = openShoppingQuery.data ?? null;
  const items = useMemo(() => shoppingsQuery.data?.items ?? [], [shoppingsQuery.data]);
  const meta = shoppingsQuery.data?.meta ?? { page: 1, pageCount: 1, total: 0 };
  const shoppingIds = useMemo(() => items.map((shopping) => Number(shopping.id)), [items]);
  const encargoCountsQuery = useShoppingEncargoCounts(shoppingIds);
  const encargoCounts = encargoCountsQuery.data ?? {};

  const canToggleShopping = (shopping) => {
    if (shopping.isClosed) return true;
    if (encargoCountsQuery.isLoading) return false;
    return (encargoCounts[String(shopping.id)] ?? 0) > 0;
  };

  useEffect(() => {
    setPage(1);
  }, [status]);

  const openCreate = () => {
    if (openShopping) return;
    setEditing(null);
    formModal.open();
  };

  const openDetail = (shopping) => {
    setSelected(shopping);
    detailModal.open();
  };

  const openEdit = (shopping) => {
    detailModal.close();
    setEditing(shopping);
    formModal.open();
  };

  const requestToggle = (shopping) => {
    detailModal.close();

    if (shopping.isClosed) {
      setToggleTarget(shopping);
      toggleDialog.open();
      return;
    }

    setCloseTarget(shopping);
    closeModal.open();
  };

  const requestDelete = (shopping) => {
    detailModal.close();
    setDeleteTarget(shopping);
    deleteDialog.open();
  };

  const confirmToggle = async () => {
    if (!toggleTarget) return;

    try {
      await toggleClosed.mutateAsync({
        documentId: toggleTarget.documentId,
        isClosed: false,
        oldId: toggleTarget.id,
      });
      toast.success('Compra reabierta');
      toggleDialog.close();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo reabrir la compra'));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteShopping.mutateAsync(deleteTarget.documentId);
      toast.success('Compra eliminada');
      deleteDialog.close();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo eliminar la compra'));
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Operaciones"
        title="Compras"
        description="Apertura, seguimiento y cierre de las compras a proveedores."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={encargoModal.open}
              disabled={!openShopping}
              title={
                openShopping
                  ? 'Crear un encargo en la compra abierta'
                  : 'Abre una compra para poder crear encargos'
              }
            >
              <TbPackage size={17} /> Nuevo encargo
            </Button>
            <Button
              onClick={openCreate}
              disabled={Boolean(openShopping)}
              title={
                openShopping
                  ? 'Ya hay una compra abierta. Ciérrala antes de abrir otra.'
                  : undefined
              }
            >
              <TbPlus size={17} /> Abrir compra
            </Button>
          </>
        }
      />

      {openShopping ? (
        <Card className="border-brand-500/30 bg-brand-500/10">
          <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div className="flex items-start gap-3">
              <TbShoppingCart
                size={20}
                className="mt-0.5 shrink-0 text-brand-300"
                aria-hidden="true"
              />
              <div>
                <p className="text-sm font-medium text-brand-200">
                  Compra {getShoppingCode(openShopping)} abierta
                </p>
                <p className="mt-0.5 text-xs text-brand-800">
                  Desde el {formatDate(openShopping.shoppingCreatedAt)}. Añade encargos y
                  ciérrala cuando termines.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" onClick={encargoModal.open}>
                <TbPackage size={16} /> Nuevo encargo
              </Button>
              <Button variant="secondary" size="sm" onClick={() => openDetail(openShopping)}>
                Ver compra abierta
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      <Card className="p-4">
        <div className="grid gap-3 sm:max-w-xs">
          <Select
            aria-label="Filtrar compras por estado"
            options={STATUS_OPTIONS}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          />
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Listado de compras"
          description={`${formatNumber(meta.total)} compras registradas`}
          actions={
            shoppingsQuery.isFetching && !shoppingsQuery.isLoading ? (
              <Spinner size="sm" className="text-brand-500" label="Actualizando" />
            ) : null
          }
        />

        {shoppingsQuery.isError ? (
          <ErrorState
            title="No se pudieron cargar las compras"
            error={shoppingsQuery.error}
            onRetry={shoppingsQuery.refetch}
          />
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Compra</TableHeaderCell>
                <TableHeaderCell>Fecha</TableHeaderCell>
                <TableHeaderCell align="right">Peso</TableHeaderCell>
                <TableHeaderCell align="right">Compra</TableHeaderCell>
                <TableHeaderCell align="right">Envío</TableHeaderCell>
                <TableHeaderCell align="right">Ganancia</TableHeaderCell>
                <TableHeaderCell align="right">Encargos</TableHeaderCell>
                <TableHeaderCell>Estado</TableHeaderCell>
                <TableHeaderCell align="right">Acciones</TableHeaderCell>
              </TableRow>
            </TableHead>

            {shoppingsQuery.isLoading ? (
              <TableSkeleton rows={5} columns={COLUMNS} />
            ) : (
              <TableBody>
                {items.length === 0 ? (
                  <TableEmpty
                    colSpan={COLUMNS}
                    icon={TbShoppingCart}
                    title={status ? 'Sin compras con ese filtro' : 'Todavía no hay compras'}
                    description={
                      status
                        ? 'Cambia el filtro para ver otras compras.'
                        : 'Abre una compra para agrupar los encargos de un mismo pedido.'
                    }
                  >
                    {!status ? (
                      <Button size="sm" onClick={openCreate} disabled={Boolean(openShopping)}>
                        <TbPlus size={16} /> Abrir compra
                      </Button>
                    ) : null}
                  </TableEmpty>
                ) : (
                  items.map((shopping) => (
                    <TableRow key={shopping.documentId || shopping.id}>
                      <TableCell className="font-medium text-ink">
                        {getShoppingCode(shopping)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-ink-muted">
                        {formatDate(shopping.shoppingCreatedAt)}
                      </TableCell>
                      <TableCell align="right">
                        {formatNumber(shopping.totalWeight)} lb
                      </TableCell>
                      <TableCell align="right" className="font-semibold tabular-nums !text-price">
                        {formatCup(shopping.buySpent)}
                      </TableCell>
                      <TableCell align="right" className="font-semibold tabular-nums !text-price">
                        {formatCup(shopping.shippingSpent)}
                      </TableCell>
                      <TableCell align="right" className="font-semibold tabular-nums !text-gain">
                        {formatCup(shopping.gain)}
                      </TableCell>
                      <TableCell align="right">
                        {formatNumber(
                          encargoCounts[String(shopping.id)] ??
                            shopping.totalEncargos ??
                            0,
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={shopping.isClosed ? 'neutral' : 'brand'}>
                          {shopping.isClosed ? 'Cerrada' : 'Abierta'}
                        </Badge>
                      </TableCell>
                      <TableCell align="right">
                        <div className="flex justify-end gap-1">
                          <ActionIcon
                            label={`Ver compra ${getShoppingCode(shopping)}`}
                            onClick={() => openDetail(shopping)}
                          >
                            <TbEye size={17} />
                          </ActionIcon>
                          <ActionIcon
                            label={`Editar compra ${getShoppingCode(shopping)}`}
                            onClick={() => openEdit(shopping)}
                          >
                            <TbPencil size={17} />
                          </ActionIcon>
                          <ActionIcon
                            label={
                              shopping.isClosed
                                ? `Reabrir compra ${getShoppingCode(shopping)}`
                                : `Cerrar compra ${getShoppingCode(shopping)}`
                            }
                            onClick={() => requestToggle(shopping)}
                            disabled={!canToggleShopping(shopping)}
                            title={
                              !canToggleShopping(shopping)
                                ? 'Añade al menos un encargo para cerrar la compra'
                                : undefined
                            }
                          >
                            {shopping.isClosed ? (
                              <TbLockOpen size={17} />
                            ) : (
                              <TbLock size={17} />
                            )}
                          </ActionIcon>
                          <ActionIcon
                            label={`Eliminar compra ${getShoppingCode(shopping)}`}
                            onClick={() => requestDelete(shopping)}
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

        {!shoppingsQuery.isError ? (
          <Pagination
            page={meta.page ?? page}
            pageCount={meta.pageCount ?? 1}
            onChange={setPage}
            total={meta.total ?? 0}
            pageSize={meta.pageSize ?? PAGE_SIZE}
            itemLabel="compras"
          />
        ) : null}
      </Card>

      <ShoppingFormModal
        open={formModal.isOpen}
        onClose={formModal.close}
        shopping={editing}
        configuration={configurationQuery.data}
      />

      <ShoppingDetailModal
        open={detailModal.isOpen}
        shopping={selected}
        onClose={detailModal.close}
        onEdit={() => selected && openEdit(selected)}
        onDelete={() => selected && requestDelete(selected)}
        onToggleClosed={() => selected && requestToggle(selected)}
        toggling={toggleClosed.isPending}
      />

      <ConfirmDialog
        open={toggleDialog.isOpen}
        onClose={toggleDialog.close}
        onConfirm={confirmToggle}
        title="Reabrir compra"
        description={`La compra ${getShoppingCode(
          toggleTarget,
        )} volverá a estar abierta y podrás seguir añadiendo encargos.`}
        confirmLabel="Sí, reabrir"
        variant="primary"
        loading={toggleClosed.isPending}
      />

      <ShoppingCloseModal
        open={closeModal.isOpen}
        shopping={closeTarget}
        onClose={closeModal.close}
      />

      <EncargoFormModal
        open={encargoModal.isOpen}
        onClose={encargoModal.close}
        encargo={null}
      />

      <ConfirmDialog
        open={deleteDialog.isOpen}
        onClose={deleteDialog.close}
        onConfirm={confirmDelete}
        title="Eliminar compra"
        description={`Vas a eliminar la compra ${getShoppingCode(
          deleteTarget,
        )}. Los encargos asociados no se borran, pero quedarán apuntando a una compra inexistente. Esta acción no se puede deshacer.`}
        confirmLabel="Sí, eliminar"
        loading={deleteShopping.isPending}
      />
    </div>
  );
}
