import { useState } from 'react';
import {
  TbAlertTriangle,
  TbArrowRight,
  TbBox,
  TbPackage,
  TbPlus,
  TbTrash,
} from 'react-icons/tb';
import PageHeader from '@/shared/components/ui/PageHeader';
import Card, { CardHeader } from '@/shared/components/ui/Card';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import Select from '@/shared/components/ui/Select';
import Textarea from '@/shared/components/ui/Textarea';
import Badge from '@/shared/components/ui/Badge';
import Pagination from '@/shared/components/ui/Pagination';
import EmptyState from '@/shared/components/ui/EmptyState';
import ErrorState from '@/shared/components/ui/ErrorState';
import Modal from '@/shared/components/ui/Modal';
import ConfirmDialog from '@/shared/components/ui/ConfirmDialog';
import { Skeleton, SkeletonText } from '@/shared/components/ui/Skeleton';
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
import { useDisclosure } from '@/shared/hooks/useDisclosure';
import { formatCurrency, formatDate } from '@/shared/lib/formatters';

const ENCARGOS = [
  {
    id: 1,
    owner: 'Ana Pérez',
    product: 'Zapatillas deportivas',
    status: 'Pendiente',
    payStatus: 'Parcial',
    price: 45.5,
    createdAt: '2026-11-18',
  },
  {
    id: 2,
    owner: 'Luis Gómez',
    product: 'Auriculares Bluetooth',
    status: 'Recibido',
    payStatus: 'Pagado',
    price: 32,
    createdAt: '2026-11-16',
  },
  {
    id: 3,
    owner: 'Marta Ruiz',
    product: 'Mochila escolar',
    status: 'Entregado',
    payStatus: 'Pagado',
    price: 28.75,
    createdAt: '2026-11-12',
  },
  {
    id: 4,
    owner: 'Carlos Díaz',
    product: 'Reloj inteligente',
    status: 'Pendiente',
    payStatus: 'Pendiente',
    price: 61,
    createdAt: '2026-11-10',
  },
  {
    id: 5,
    owner: 'Yenis López',
    product: 'Set de sartenes',
    status: 'Recibido',
    payStatus: 'Parcial',
    price: 54.2,
    createdAt: '2026-11-08',
  },
  {
    id: 6,
    owner: 'Pedro Sánchez',
    product: 'Lámpara LED',
    status: 'Entregado',
    payStatus: 'Pagado',
    price: 19.99,
    createdAt: '2026-11-03',
  },
];

const PAY_BADGE = {
  Pagado: 'success',
  Parcial: 'warning',
  Pendiente: 'danger',
};

const STATUS_BADGE = {
  Entregado: 'success',
  Recibido: 'brand',
  Pendiente: 'neutral',
};

const PAGE_SIZE = 4;

function Section({ title, description, children }) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <div className="px-5 py-5">{children}</div>
    </Card>
  );
}

export default function DesignSystemPage() {
  const [page, setPage] = useState(1);
  const [skeletonVisible, setSkeletonVisible] = useState(false);
  const modal = useDisclosure();
  const confirm = useDisclosure();

  const start = (page - 1) * PAGE_SIZE;
  const rows = ENCARGOS.slice(start, start + PAGE_SIZE);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Desarrollo"
        title="Sistema de componentes"
        description="Componentes reutilizables de la Fase 3. Esta ruta solo existe en modo desarrollo."
        actions={<Badge variant="brand">Fase 3</Badge>}
      />

      <Section
        title="Botones"
        description="Variantes, tamaños y estado de carga."
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button>Principal</Button>
          <Button variant="secondary">Secundario</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Eliminar</Button>
          <Button loading>Guardando…</Button>
          <Button disabled>Deshabilitado</Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button size="sm">Pequeño</Button>
          <Button size="md">Mediano</Button>
          <Button size="lg">Grande</Button>
        </div>
      </Section>

      <Section
        title="Formularios"
        description="Inputs, selects y textareas con validación visual."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Input label="Nombre" placeholder="Ana Pérez" name="demo-name" />
          <Input
            label="Email"
            placeholder="ana@email.com"
            name="demo-email"
            error="Introduce un email válido"
          />
          <Select
            label="Estado del encargo"
            name="demo-status"
            placeholder="Selecciona un estado"
            options={[
              { value: 'pendiente', label: 'Pendiente' },
              { value: 'recibido', label: 'Recibido' },
              { value: 'entregado', label: 'Entregado' },
            ]}
          />
          <Select
            label="Estado de pago"
            name="demo-pay"
            hint="Se puede actualizar más tarde"
            options={[
              { value: 'pagado', label: 'Pagado' },
              { value: 'parcial', label: 'Parcial' },
            ]}
          />
          <Textarea
            label="Observaciones"
            name="demo-notes"
            placeholder="Detalles adicionales del encargo…"
            className="md:col-span-2"
          />
        </div>
      </Section>

      <Card>
        <CardHeader
          title="Tabla y paginación"
          description="Datos de ejemplo con paginación controlada."
          actions={
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSkeletonVisible((value) => !value)}
              >
                {skeletonVisible ? 'Ver datos' : 'Ver skeleton'}
              </Button>
              <Button size="sm" onClick={modal.open}>
                <TbPlus size={16} /> Detalle
              </Button>
            </div>
          }
        />
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Cliente</TableHeaderCell>
              <TableHeaderCell>Producto</TableHeaderCell>
              <TableHeaderCell>Estado</TableHeaderCell>
              <TableHeaderCell>Pago</TableHeaderCell>
              <TableHeaderCell align="right">Precio</TableHeaderCell>
              <TableHeaderCell align="right">Fecha</TableHeaderCell>
            </TableRow>
          </TableHead>
          {skeletonVisible ? (
            <TableSkeleton rows={PAGE_SIZE} columns={6} />
          ) : (
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium text-ink">{row.owner}</TableCell>
                  <TableCell>{row.product}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE[row.status]}>{row.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={PAY_BADGE[row.payStatus]}>{row.payStatus}</Badge>
                  </TableCell>
                  <TableCell
                    align="right"
                    className="font-semibold tabular-nums !text-price"
                  >
                    {formatCurrency(row.price)}
                  </TableCell>
                  <TableCell align="right" className="text-ink-muted">
                    {formatDate(row.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>
        <Pagination
          page={page}
          pageCount={Math.ceil(ENCARGOS.length / PAGE_SIZE)}
          onChange={setPage}
          total={ENCARGOS.length}
          pageSize={PAGE_SIZE}
          itemLabel="encargos"
        />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Estado vacío" description="Sin resultados o sin datos aún." />
          <EmptyState
            icon={TbPackage}
            title="Todavía no hay encargos"
            description="Cuando registres el primer encargo aparecerá en esta tabla."
            action={
              <Button size="sm">
                <TbPlus size={16} /> Crear encargo
              </Button>
            }
          />
        </Card>

        <Card>
          <CardHeader title="Estado de error" description="Con opción de reintentar." />
          <ErrorState
            description="No se pudo conectar con la API de Strapi. Verifica que el backend esté en ejecución."
            onRetry={() => {}}
          />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Skeleton" description="Carga de contenido sin saltos de layout." />
          <div className="space-y-4 px-5 py-5">
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <SkeletonText lines={3} />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Tabla vacía" description="Mensaje dentro de la propia tabla." />
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Cliente</TableHeaderCell>
                <TableHeaderCell>Estado</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableEmpty
                colSpan={2}
                icon={TbBox}
                title="Sin encargos registrados"
                description="Usa el botón Crear para añadir el primero."
              />
            </TableBody>
          </Table>
        </Card>
      </div>

      <Section
        title="Modales"
        description="Diálogo genérico y confirmación de acciones destructivas."
      >
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={modal.open}>
            Abrir modal de detalle
          </Button>
          <Button variant="danger" onClick={confirm.open}>
            <TbTrash size={16} /> Eliminar encargo
          </Button>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-muted">
          <TbArrowRight size={14} />
          Cierra con la X, la tecla Escape o haciendo clic fuera del panel.
        </p>
      </Section>

      <Modal
        open={modal.isOpen}
        onClose={modal.close}
        title="Detalle del encargo"
        description="Información de ejemplo"
        footer={
          <>
            <Button variant="secondary" onClick={modal.close}>
              Cerrar
            </Button>
            <Button onClick={modal.close}>Guardar cambios</Button>
          </>
        }
      >
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <span className="text-ink-muted">Cliente</span>
            <span className="font-medium text-ink">Ana Pérez</span>
          </div>
          <div className="flex items-center justify-between border-b border-line pb-3">
            <span className="text-ink-muted">Producto</span>
            <span className="font-medium text-ink">Zapatillas deportivas</span>
          </div>
          <div className="flex items-center justify-between border-b border-line pb-3">
            <span className="text-ink-muted">Estado de pago</span>
            <Badge variant="warning">Parcial</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ink-muted">Precio</span>
            <span className="font-medium text-ink">{formatCurrency(45.5)}</span>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirm.isOpen}
        onClose={confirm.close}
        onConfirm={confirm.close}
        title="Eliminar encargo"
        description="Esta acción no se puede deshacer. El encargo y sus datos asociados se eliminarán de forma permanente."
        confirmLabel="Sí, eliminar"
      />

      <Card className="border-price/25 bg-price/10">
        <div className="flex items-start gap-3 px-5 py-4">
          <TbAlertTriangle size={18} className="mt-0.5 shrink-0 text-price" aria-hidden="true" />
          <p className="text-xs leading-relaxed text-price/85">
            Esta página es solo para desarrollo y no forma parte del menú de producción. Los
            componentes se usarán en las fases 4 a 8.
          </p>
        </div>
      </Card>
    </div>
  );
}
