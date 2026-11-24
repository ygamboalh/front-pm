import { TbBrandWhatsapp, TbPhoto } from 'react-icons/tb';
import Badge from '@/shared/components/ui/Badge';
import { formatNumber } from '@/shared/lib/formatters';
import { cn } from '@/shared/lib/cn';import { buildWhatsAppLink, resolveStoreImage } from '../api';

export default function StoreProductCard({ product, whatsappNumber }) {
  const coming = product.status === 'coming';
  const image = resolveStoreImage(product.image);
  const whatsappLink = coming ? null : buildWhatsAppLink(whatsappNumber, product);

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-brand-500/40">
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-raised">
        {image ? (
          <img
            src={image}
            alt={product.description}
            loading="lazy"
            className={cn(
              'h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]',
              coming && 'opacity-70 grayscale-[35%]',
            )}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-ink-faint">
            <TbPhoto size={34} aria-hidden="true" />
          </span>
        )}

        <span className="absolute left-3 top-3 inline-flex rounded-full bg-canvas/90 p-0.5 shadow-sm backdrop-blur-sm">
          <Badge variant={coming ? 'warning' : 'success'}>
            {coming ? 'Próximamente' : 'Disponible'}
          </Badge>
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-[10px] font-medium uppercase tracking-wide text-ink-faint">
          {product.category}
        </p>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-ink">
          {product.description}
        </h3>

        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-ink-faint">Precio</p>
            <p className="text-lg font-semibold tabular-nums text-price">
              {formatNumber(product.price)}
              <span className="ml-0.5 text-xs font-medium text-ink-muted">cup</span>
            </p>
          </div>

          {coming ? (
            <span className="text-[11px] font-medium text-price">A la venta pronto</span>
          ) : whatsappLink ? (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-gain px-3 py-2 text-xs font-semibold text-canvas-deep transition hover:bg-gain/90"
            >
              <TbBrandWhatsapp size={16} aria-hidden="true" /> Comprar
            </a>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-xs font-medium text-ink-faint">
              <TbBrandWhatsapp size={15} aria-hidden="true" /> Comprar
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
