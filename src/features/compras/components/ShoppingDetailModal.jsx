import { TbLock, TbLockOpen, TbPencil, TbShoppingCart, TbTrash } from 'react-icons/tb';
import Modal from '@/shared/components/ui/Modal';
import Button from '@/shared/components/ui/Button';
import Badge from '@/shared/components/ui/Badge';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/shared/components/ui/Table';
import { formatCup, formatDate, formatNumber, formatUsd } from '@/shared/lib/formatters';
import { deliveredStatusVariant } from '@/shared/lib/status';
import { SENT_BY_LABELS } from '@/shared/lib/constants';
import { getShoppingCode } from '../api';
import { useShoppingEncargos } from '../hooks';

const COLUMNS = 5;

function Field({ label, value, tone }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-ink-faint">{label}</dt>
      <dd
        className={
          tone
            ? `mt-0.5 text-sm font-semibold tabular-nums ${tone}`
            : 'mt-0.5 text-sm text-ink'
        }
      >
        {value || '—'}
      </dd>
    </div>
  );
}

export default function ShoppingDetailModal({
  open,
  shopping,
  onClose,
  onEdit,
  onDelete,
  onToggleClosed,
  toggling = false,
}) {
  const encargosQuery = useShoppingEncargos(shopping?.documentId, open);
  const encargos = encargosQuery.data?.items ?? [];

  if (!shopping) return null;

  const isClosed = Boolean(shopping.isClosed);
  const code = getShoppingCode(shopping);
  const encargosTotal = encargosQuery.data?.total ?? 0;
  const closeDisabled = !isClosed && (encargosQuery.isLoading || encargosTotal === 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Compra ${code}`}
      description={`Registrada el ${formatDate(shopping.shoppingCreatedAt)}`}
      size="lg"
      footer={
        <>
          <Button
            variant="ghost"
            className="mr-auto text-danger hover:bg-danger/10 hover:text-danger"
            onClick={onDelete}
          >
            <TbTrash size={16} /> Eliminar
          </Button>
          <Button variant="secondary" onClick={onEdit}>
            <TbPencil size={16} /> Editar
          </Button>
          <Button
            variant={isClosed ? 'secondary' : 'primary'}
            onClick={onToggleClosed}
            loading={toggling}
            disabled={closeDisabled}
            title={
              closeDisabled
                ? 'Añade al menos un encargo para cerrar la compra'
                : undefined
            }
          >
            {isClosed ? <TbLockOpen size={16} /> : <TbLock size={16} />}
            {isClosed ? 'Reabrir compra' : 'Cerrar compra'}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={isClosed ? 'neutral' : 'brand'}>
            {isClosed ? 'Cerrada' : 'Abierta'}
          </Badge>
          <Badge variant="neutral">
            {SENT_BY_LABELS[shopping.sentBy] || shopping.sentBy || 'Sin envío'}
          </Badge>
          <Badge variant="neutral">Zelle {formatCup(shopping.usdPrice)}</Badge>
        </div>

        <dl className="grid grid-cols-2 gap-3 rounded-xl border border-line bg-canvas/40 p-4 sm:grid-cols-3">
          <Field label="Peso total" value={`${formatNumber(shopping.totalWeight)} lb`} />
          <Field
            label="Precio de la libra"
            value={formatUsd(shopping.poundPrice)}
            tone="text-price"
          />
          <Field label="Encargos" value={formatNumber(shopping.totalEncargos)} />
          <Field
            label="Gasto en compra"
            value={formatCup(shopping.buySpent)}
            tone="text-price"
          />
          <Field
            label="Gasto en envío"
            value={formatCup(shopping.shippingSpent)}
            tone="text-price"
          />
          <Field label="Total gastado" value={formatCup(shopping.totalSpent)} tone="text-price" />
          <Field
            label="Total gastado (USD)"
            value={formatUsd(shopping.totalSpentUSD)}
            tone="text-price"
          />
          <Field label="Ganancia" value={formatCup(shopping.gain)} tone="text-gain" />
          <Field label="Dinero entregado" value={formatCup(shopping.givenMoney)} />
        </dl>

        <div>
          <div className="flex items-center justify-between border-b border-line pb-2">
            <h3 className="text-sm font-semibold text-ink">Encargos de esta compra</h3>
            <span className="text-xs text-ink-muted">
              {formatNumber(encargosQuery.data?.total ?? 0)} en total
            </span>
          </div>

          {encargosQuery.isLoading ? (
            <div className="space-y-2 pt-3">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          ) : encargosQuery.isError ? (
            <p className="pt-3 text-xs text-danger">
              No se pudieron cargar los encargos de esta compra.
            </p>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell>Cliente</TableHeaderCell>
                  <TableHeaderCell>Producto</TableHeaderCell>
                  <TableHeaderCell>Estado</TableHeaderCell>
                  <TableHeaderCell align="right">Precio</TableHeaderCell>
                  <TableHeaderCell>Fecha</TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {encargos.length === 0 ? (
                  <TableEmpty
                    colSpan={COLUMNS}
                    icon={TbShoppingCart}
                    title="Sin encargos"
                    description={`No hay encargos registrados con shoppingId ${shopping.id}.`}
                  />
                ) : (
                  encargos.map((encargo) => (
                    <TableRow key={encargo.documentId || encargo.id}>
                      <TableCell className="font-medium text-ink">
                        {encargo.ownerName || '—'}
                      </TableCell>
                      <TableCell className="max-w-[160px] truncate">
                        {encargo.productDescription || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={deliveredStatusVariant(encargo.deliveredStatus)}>
                          {encargo.deliveredStatus || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell align="right">{formatCup(encargo.productPrice)}</TableCell>
                      <TableCell className="whitespace-nowrap text-ink-muted">
                        {formatDate(encargo.encargoCreatedAt)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {encargosQuery.isFetching && !encargosQuery.isLoading ? (
            <div className="pt-2">
              <Skeleton className="h-2 w-24" />
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
