import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TbClock, TbInfoCircle } from 'react-icons/tb';
import toast from 'react-hot-toast';
import PageHeader from '@/shared/components/ui/PageHeader';
import Card, { CardHeader } from '@/shared/components/ui/Card';
import Badge from '@/shared/components/ui/Badge';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import ErrorState from '@/shared/components/ui/ErrorState';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { getApiErrorMessage } from '@/shared/api/strapiClient';
import { formatCup, formatDateTime, formatNumber } from '@/shared/lib/formatters';
import { useConfiguration, useSaveConfiguration } from '../hooks';

const schema = z.object({
  usdPrice: z
    .number({ invalid_type_error: 'Introduce un número válido' })
    .min(0, 'No puede ser negativo'),
  poundPrice: z
    .number({ invalid_type_error: 'Introduce un número válido' })
    .min(0, 'No puede ser negativo'),
  gainPercentForBusiness: z
    .number({ invalid_type_error: 'Introduce un número válido' })
    .int('Debe ser un número entero')
    .min(0, 'No puede ser negativo')
    .max(1000, 'Máximo 1000 %'),
  transferPercent: z
    .number({ invalid_type_error: 'Introduce un número válido' })
    .int('Debe ser un número entero')
    .min(0, 'No puede ser negativo')
    .max(100, 'Máximo 100 %'),
  contactPhone: z
    .string()
    .trim()
    .min(1, 'Indica el número de WhatsApp')
    .max(25, 'Máximo 25 caracteres')
    .regex(/^[0-9+\s()-]*$/, 'Solo números, espacios y el signo +'),
});

const DEFAULT_VALUES = {
  usdPrice: 0,
  poundPrice: 0,
  gainPercentForBusiness: 0,
  transferPercent: 0,
  contactPhone: '',
};

function toFormValues(configuration) {
  return {
    usdPrice: configuration?.usdPrice ?? 0,
    poundPrice: configuration?.poundPrice ?? 0,
    gainPercentForBusiness: configuration?.gainPercentForBusiness ?? 0,
    transferPercent: configuration?.transferPercent ?? 0,
    contactPhone: configuration?.contactPhone ?? '',
  };
}

function TotalsCard({ configuration }) {
  const totals = [
    { label: 'Ganancia total', value: formatCup(configuration?.totalGain ?? 0), tone: 'text-gain' },
    { label: 'Encargos totales', value: formatNumber(configuration?.totalEncargos ?? 0), tone: 'text-ink' },
    {
      label: 'Encargos pendientes',
      value: formatNumber(configuration?.pendingEncargos ?? 0),
      tone: 'text-price',
    },
    {
      label: 'Encargos entregados',
      value: formatNumber(configuration?.deliveredEncargos ?? 0),
      tone: 'text-gain',
    },
    {
      label: 'Gasto en envíos',
      value: formatCup(configuration?.totalShippingSpent ?? 0),
      tone: 'text-price',
    },
    {
      label: 'Peso total',
      value: `${formatNumber(configuration?.totalWeight ?? 0)} lb`,
      tone: 'text-ink',
    },
    {
      label: 'Gasto en compras',
      value: formatCup(configuration?.totalBuySpent ?? 0),
      tone: 'text-price',
    },
  ];

  return (
    <Card>
      <CardHeader
        title="Totales registrados"
        description="Valores guardados en la configuración del negocio"
      />
      <dl className="divide-y divide-line">
        {totals.map(({ label, value, tone }) => (
          <div key={label} className="flex items-center justify-between gap-3 px-5 py-3">
            <dt className="text-xs text-ink-muted">{label}</dt>
            <dd className={`text-sm font-semibold tabular-nums ${tone}`}>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex items-start gap-2 border-t border-line px-5 py-3">
        <TbInfoCircle size={15} className="mt-0.5 shrink-0 text-ink-faint" aria-hidden="true" />
        <p className="text-[11px] leading-relaxed text-ink-muted">
          Estos totales se recalculan automáticamente cuando registres compras y actualices
          estados de encargos en las próximas fases.
        </p>
      </div>
    </Card>
  );
}

export default function ConfiguracionPage() {
  const configurationQuery = useConfiguration();
  const saveConfiguration = useSaveConfiguration();
  const configuration = configurationQuery.data ?? null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (configurationQuery.data) {
      reset(toFormValues(configurationQuery.data));
    }
  }, [configurationQuery.data, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await saveConfiguration.mutateAsync({
        documentId: configuration?.documentId,
        values,
        current: configuration,
      });
      toast.success('Configuración guardada');
      reset(values);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo guardar la configuración'));
    }
  });

  const actions = configuration?.updatedAt ? (
    <Badge variant="neutral">
      <TbClock size={13} aria-hidden="true" />
      Actualizado {formatDateTime(configuration.updatedAt)}
    </Badge>
  ) : (
    <Badge variant="warning">Sin configuración creada</Badge>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finanzas"
        title="Configuración"
        description="Precios de referencia y porcentajes usados en las operaciones."
        actions={actions}
      />

      {configurationQuery.isLoading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="space-y-4 p-5 lg:col-span-2">
            <Skeleton className="h-5 w-48" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
            <Skeleton className="h-10 w-40" />
          </Card>
          <Card className="space-y-3 p-5">
            <Skeleton className="h-5 w-40" />
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={`total-skeleton-${index}`} className="h-3 w-full" />
            ))}
          </Card>
        </div>
      ) : configurationQuery.isError ? (
        <Card>
          <ErrorState error={configurationQuery.error} onRetry={configurationQuery.refetch} />
        </Card>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {!configuration ? (
              <Card className="border-price/25 bg-price/10">
                <div className="flex items-start gap-3 px-5 py-4">
                  <TbInfoCircle
                    size={18}
                    className="mt-0.5 shrink-0 text-price"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-sm font-medium text-price">
                      Todavía no existe una configuración
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-price/85">
                      Completa los precios y porcentajes y guarda: se creará el primer registro
                      del negocio.
                    </p>
                  </div>
                </div>
              </Card>
            ) : null}

            <Card>
              <CardHeader
                title="Precios y porcentajes"
                description="Datos de referencia para calcular precios y ganancias."
              />
              <form onSubmit={onSubmit} className="space-y-5 px-5 py-5" noValidate>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Input
                    label="Precio del Zelle (cup)"
                    type="number"
                    inputMode="numeric"
                    step="1"
                    min="0"
                    tone="price"
                    suffix="cup"
                    hint="Valor del dólar en moneda local"
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
                    hint="Coste por libra de envío"
                    error={errors.poundPrice?.message}
                    {...register('poundPrice', { valueAsNumber: true })}
                  />
                  <Input
                    label="Ganancia del negocio (%)"
                    type="number"
                    inputMode="numeric"
                    step="1"
                    min="0"
                    max="1000"
                    tone="percent"
                    hint="Porcentaje aplicado a cada artículo"
                    error={errors.gainPercentForBusiness?.message}
                    {...register('gainPercentForBusiness', { valueAsNumber: true })}
                  />
                  <Input
                    label="Transferencias (%)"
                    type="number"
                    inputMode="numeric"
                    step="1"
                    min="0"
                    max="100"
                    tone="percent"
                    hint="Porcentaje aceptado en transferencias"
                    error={errors.transferPercent?.message}
                    {...register('transferPercent', { valueAsNumber: true })}
                  />
                </div>

                <Input
                  label="Número de WhatsApp"
                  inputMode="tel"
                  placeholder="5354805750"
                  hint="Incluye el código de país. Se usa en los botones de compra de la tienda online."
                  error={errors.contactPhone?.message}
                  {...register('contactPhone')}
                />

                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-4">
                  <Button
                    variant="secondary"
                    onClick={() => reset(toFormValues(configuration))}
                    disabled={!isDirty || isSubmitting}
                  >
                    Descartar cambios
                  </Button>
                  <Button
                    type="submit"
                    loading={isSubmitting}
                    disabled={Boolean(configuration) && !isDirty}
                  >
                    {configuration ? 'Guardar cambios' : 'Crear configuración'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          <TotalsCard configuration={configuration} />
        </div>
      )}
    </div>
  );
}
