# Front PM · Control de encargos y ventas

Frontend en **React + Vite** para la gestión de encargos, compras, productos e impuestos.
Consume la API de **Strapi v5** ubicada en `../pm-backend-strapi`.

## Requisitos

- Node.js 20+ (probado con Node 22)
- Strapi v5 corriendo en `http://localhost:1337`

## Puesta en marcha

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar la URL del backend (ya incluida en .env)
# VITE_API_URL=http://localhost:1337

# 3. Levantar el frontend
npm run dev
# → http://localhost:5173
```

### Backend

```bash
cd ../pm-backend-strapi
npm run develop
```

Crea tu usuario en el panel de Strapi (`http://localhost:1337/admin`) y asígnale el rol
**Authenticated**. En *Settings → Users & Permissions → Roles → Authenticated* habilita los
permisos (`find`, `findOne`, `create`, `update`, `delete`) de los content types que vayas a usar:
`Configuration`, `Encargo`, `Shopping`, `Product` y `Tax`.

> Strapi tiene CORS abierto por defecto (`strapi::cors`), por lo que `http://localhost:5173`
> funciona sin cambios. Si lo restringes, añade ese origen en `config/middlewares.js`.

## Scripts

| Comando           | Descripción                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Servidor de desarrollo (5173)        |
| `npm run build`   | Build de producción en `dist/`       |
| `npm run preview` | Sirve el build localmente            |
| `npm run lint`    | ESLint sobre todo el proyecto        |

## Arquitectura

```
src/
  app/                  # router, providers, layouts, navegación
  features/
    auth/               # login, store de sesión, hooks
    dashboard/          # panel inicial y estado de conexión
    encargos/           # Fase 5
    compras/            # Fase 6
    productos/          # Fase 7
    impuestos/          # Fase 8
    configuracion/      # Fase 4
  shared/
    api/                # strapiClient, media, query keys
    components/         # UI base y componentes compartidos
    lib/                # utilidades, constantes, formateadores
```

Convenciones:

- Cada feature expone su propia capa `api.js` y sus `hooks.js` (TanStack Query).
- Los componentes nunca llaman a `axios` directamente.
- `shared/api/strapiClient.js` inyecta el JWT y normaliza errores. Como este Strapi usa `jwtManagement: 'refresh'` (access token de 10 minutos + refresh token en cookie httpOnly), el cliente **renueva la sesión automáticamente** contra `/api/auth/refresh` y reintenta la petición original; solo cierra sesión si el refresh falla.
- Las peticiones usan `withCredentials: true` para enviar la cookie de refresh. El CORS de Strapi debe permitir credenciales (lo hace por defecto).
- Las imágenes se suben a `POST /api/upload` y se asocian al encargo por su `id`.
- En Strapi v5 el `id` numérico de una entrada publicada cambia al editarla. Las compras se muestran con un código estable `CMP-XXXXXX` derivado del `documentId`; las mutaciones siempre usan `documentId`.
- Nota: `Encargo.shoppingId` es un entero en Strapi. Para que la asociación encargo→compra sea estable conviene convertirlo en una relación (documentId) más adelante.
- Los estados del servidor viven en TanStack Query. Zustand solo guarda sesión y estado de UI.
- Los campos y tipos se toman **tal como están definidos en Strapi** (Strapi es la fuente de verdad).

## Tema visual

La app usa un **tema oscuro fijo** con tokens semánticos definidos en `tailwind.config.js`:

| Token | Uso |
| --- | --- |
| `canvas` / `canvas-deep` | Fondo de la app y barra lateral |
| `surface` / `surface-raised` / `surface-hover` | Tarjetas, inputs y estados hover |
| `line` | Bordes y divisores |
| `ink` / `ink-soft` / `ink-muted` / `ink-faint` | Jerarquía de texto |
| `brand` | Navegación y acciones principales (azul) |
| `price` | Precios e importes (ámbar) |
| `gain` | Ganancias y positivos (esmeralda) |
| `percent` | Porcentajes y totales (violeta) |
| `danger` | Errores, no pagado y acciones destructivas (rosa) |

Reglas de resalte:

- Los **precios** usan `text-price`, las **ganancias** `text-gain` y los **porcentajes** `text-percent`, siempre con `tabular-nums`.
- El color se aplica a la cifra, no a toda la tarjeta; el contenedor recibe como mucho un borde o halo del mismo tono.
- Los KPIs usan el componente `Metric` (`shared/components/ui/Metric.jsx`) y los tonos centralizados en `shared/lib/metricTones.js`.
- Los estados nunca dependen solo del color: mantienen texto y forma en los badges.

Para añadir más adelante un tema claro bastaría con mover estos valores a variables CSS y alternarlas, sin tocar los componentes.

## Reglas de compras

- **Abrir compra** pide solo fecha y medio de envío. `usdPrice` y `poundPrice` se copian de Configuración y el resto de totales empieza en cero.
- Al **cerrar la compra** se calculan desde sus encargos:
  - Gasto de compra: `Σ (shopPrice × usdPrice × 1.12)`
  - Gasto de envío: `Σ (weight × poundPrice × usdPrice)` usando el `poundPrice` de cada encargo
  - Peso total y número de encargos: sumas directas
  - Total gastado: gasto de compra + gasto de envío
- En el cierre se especifican manualmente **Dinero entregado** y **Total gastado (USD)**; la ganancia es `dinero entregado − total gastado`.
- La columna **Encargos** usa el conteo en vivo de encargos de cada compra.
- Los encargos se asocian a su compra mediante la relación **`shopping`** (muchos encargos → una compra). Al crear o editar un encargo se envía el `documentId` de la compra; el detalle de compras y el cierre consultan los encargos por esa relación.
- Se conserva `shoppingId` como referencia numérica histórica y para los conteos del listado; los encargos existentes se enlazaron a su compra mediante `shoppingId`.
- En Strapi v5 el `id` publicado cambia al guardar una compra; al editar, cerrar o reabrir se **reasignan automáticamente** los encargos al nuevo id para que el detalle siga mostrándolos.

## Reglas de productos

- **Catálogo** se divide en tres vistas:
  - **Tienda**: solo productos en estado `Recibido`, sin botón de creación; el informe de ventas vive en la cabecera. La tabla incluye ubicación, precio, USD actual, coste, ganancia, llegada y peso.
  - **Comprados**: solo productos en estado `Comprado`, con el botón **Nuevo producto**. Las acciones permiten ver el detalle, editar o eliminar (sin venta ni entrega a gestor).
    - Columnas: fecha de compra, precio de tienda, precio, precio USD, coste, ganancia planificada (con su %), peso y envío.
    - Sin filtro de ubicación; solo búsqueda y categoría.
  - **Vendidos**: solo productos en estado `Vendido`; la acción de gestionar venta se muestra en ámbar (advertencia) y abre el detalle, que permite **reintegrar el producto a la tienda**.
    - Columnas: estado, precio vendido, coste total, ganancia real y fecha de venta.
    - El filtro de ubicación se sustituye por un **selector de fecha** que filtra las ventas por día (`soldDate`).
    - La cabecera no muestra los contadores de inventario.
- El formulario permite hasta **3 imágenes** por producto.
- Las tablas de **Tienda**, **Comprados** y **Encargos** usan el layout ampliado y columnas compactas. En Encargos se añaden **Precio tienda ($)** y **Peso**, con los importes destacados y los datos secundarios en tono atenuado.
- Las categorías se leen del modelo **Type** de Strapi, ordenadas por `typeId`, en formularios, filtros y tienda online.
- Si un producto conserva una categoría antigua que no existe en Type, se mantiene como opción al editar para poder cambiarla; en filtros y tienda se añade al final.
- Coste total: `shopPrice × usdPrice × 1.12 + weight × poundPrice × usdPrice`.
- Ganancia: `sellPrice − totalCost`.
- Porcentaje de ganancia: `ganancia ÷ coste total × 100`.
- El select de porcentaje (25, 30, 35 o 45 %) sugiere automáticamente el precio de venta: `coste total × (1 + porcentaje ÷ 100)`.
- La acción “Entregar a gestor” actualiza `sellPrice`, `takenByVendor` y `dateTakenByVendor`, y recalcula `gainPlanned = sellPrice − totalCost`; el resto del producto no se modifica.
- La ubicación del producto se muestra como **En stock** (`takenByVendor` vacío, “En stock” o “No asignado”) o **En gestor** con el nombre del gestor.
- Los indicadores de **Ventas de hoy** y **Ventas del mes** suman productos con `deliveredStatus = Vendido` por rango de `soldDate`, mostrando cantidad, `soldPrice`, `gainReal` y el porcentaje de ganancia sobre el coste.
- Al marcar un producto como vendido se registran `soldDate`, `soldPrice = sellPrice` y `gainReal = sellPrice − totalCost`.
- El modal de detalle funciona como punto de venta: permite indicar el **Precio del producto** final y vende con `soldPrice = precio indicado` y `gainReal = precio − totalCost`.
- En el modal de venta, el porcentaje y la ganancia se calculan igual que en la columna **USD actual**: con el coste recalculado usando el USD de Configuración y el precio de la libra del producto, y como ganancia sobre ese coste. El coste registrado del producto se sigue mostrando como referencia.
- Al vender, `gainReal` se guarda usando ese **coste actual** (USD de Configuración y precio de la libra del producto).
- Al vender se crea automáticamente un **ingreso en Caja** por el precio final, con motivo `Venta-<categoría>-<descripción>` y saldo actualizado (`resto`).
- Reintegrar a la tienda un producto vendido lo devuelve a `deliveredStatus = Recibido` y `takenByVendor = En stock`, con `soldPrice` y `gainReal` en `0`, como si no se hubiera vendido.
- En el formulario de producto, si el estado es **Comprado**, aparece el toggle **“¿Ya llegó a tus manos?”**; al activarlo se guarda como **Recibido** y se registra la **fecha de llegada** (`arrivedAt`), editable desde el mismo formulario.
- La columna **USD actual** recalcula el coste con el `usdPrice` vigente de Configuración y el `gainPercent` del producto: `coste = shopPrice × USD × 1.12 + peso × poundPrice × USD` y `precio = coste × (1 + gainPercent ÷ 100)`.
- Los tres valores se muestran en vivo en el formulario. Estado inicial `Comprado`, vendedor `En stock`, precio vendido y ganancia real en `0`, y fecha de venta igual a la fecha de compra.

## Reglas de informes
- **Informes** vive en la sección **General** del menú (`/informes`) y agrupa cuatro reportes:
  - **Resumen general**: precios de Configuración, compras, gasto total, envíos, peso, encargos (total, pendientes y entregados) y ganancias reales.
  - **Estado del negocio**: productos en stock y en gestor, mercancía comprada, vendidos, ganancia virtual (precio de venta − coste del stock y compras) y ganancia real, además de libras de compras y de encargos pendientes.
- **Ventas del mes por categoría**: artículos vendidos en el mes actual, coste, importe recuperado, ganancia real y porcentaje de ganancia.
  - Las categorías se construyen desde el modelo **Type** (orden `typeId`), complementadas con categorías antiguas presentes en productos. Las categorías sin datos aparecen con valores en cero.
  - **Inventario comprado por categoría**: mercancía en estado `Comprado`, inversión, ganancia planificada, porcentaje de ganancia y porcentaje sobre la inversión total.
- Los informes se calculan en el frontend a partir de `products`, `shoppings`, `encargos` y la configuración vigente, paginando todas las entradas.

## Tienda online

- Ruta pública `/tienda-online`, **fuera** del layout protegido: sin barra lateral ni login.
- El enlace **Tienda online** en **General** abre la tienda en una pestaña nueva.
- Endpoint público `GET /api/storefront` que devuelve solo datos seguros: número de WhatsApp y productos con descripción, categoría, precio, imagen y estado.
- Secciones:
  - **Disponibles ahora**: productos `Recibido`/`Disponible` con `takenByVendor = En stock`.
  - **Próximamente**: productos `Comprado`, marcados como “A la venta pronto”.
  - Se excluyen vendidos, no disponibles y asignados a gestor.
- Tarjetas con imagen, categoría, precio y botón **Comprar** que abre `wa.me` con el producto y precio en el mensaje.
- El precio de la tienda se calcula con el coste actual (USD de Configuración y `gainPercent` del producto) y se redondea al millar más cercano (ej. 14.300 → 14.000, 14.750 → 15.000). Si no se puede calcular, usa `sellPrice`.
- El número de WhatsApp se toma de `contactPhone` en Configuración; si está vacío, los enlaces de compra quedan desactivados.
- Incluye buscador, filtros por categoría y “Ver más” de 12 en 12.
- El selector de categorías se construye desde el modelo **Type** (orden `typeId`), excluye **Conjunto** y añade al final las categorías antiguas que todavía tengan productos.

## Reglas de caja

- **Caja** vive en **Operaciones** del menú (`/caja`) y replica el movimiento de efectivo de la app anterior.
- Cada movimiento es un **ingreso** (`ganancia`) o un **gasto** (`gasto`) con su motivo; el `resto` guarda el saldo resultante acumulado y `movementDate` conserva la fecha real del movimiento.
- Los motivos de ingreso son Venta, Encargo, Fondo y Otros ingresos; los de gasto, Compra USD, Pago de ganancia, Aduana, Devolución, Casa, Ajustes y Otros gastos.
- La cabecera muestra el efectivo disponible (último `resto`), ganancias y gastos acumulados y el número de movimientos.
- Se puede buscar por motivo, filtrar por tipo, paginar, eliminar un movimiento concreto y limpiar todo el registro.
- Al eliminar un movimiento se recalculan los saldos (`resto`) de los movimientos posteriores para mantener la coherencia.
- Requiere el content type `cash` en Strapi (`api::cash.cash`) con los campos `gasto`, `ganancia`, `resto`, `motivoGasto`, `motivoGanancia` y `movementDate`. El backend concede automáticamente los permisos al rol autenticado desde `src/index.js`.

## Migración desde la app anterior

- Script: `pm-backend-strapi/scripts/migrate-old-data.js` (`--dry-run` para ver el reporte sin escribir).
- Lee la SQLite antigua (`prisma/bd.db`) y escribe por la API de Strapi.
- Reemplaza productos, compras, encargos, configuración, impuestos y caja; no toca clientes, login, usuarios ni roles.
- Productos `Eliminado` se excluyen; `gainPercent` se fija en 35; estados y categorías se traducen al catálogo nuevo (incluye Audífonos).
- Las imágenes se suben a la Media Library en las carpetas `products`, `encargos` y `tax`, reutilizando cada archivo único.
- Los encargos se vinculan a las compras mediante el nuevo `id` numérico y la relación `shopping` (`documentId`), y la caja conserva su fecha original en `movementDate`.
- Antes de migrar se crea una copia de seguridad en `pm-backend-strapi/backups/`.

## Estado actual

- ✅ **Fase 0** — Vite + React (JS), Tailwind, ESLint, aliases `@/`, estructura por features.
- ✅ **Fase 1** — Cliente Strapi, interceptor JWT, manejo de errores, helper de medios, query keys.
- ✅ **Fase 2** — Login con users-permissions, rutas protegidas, layout responsive, logout, dashboard de verificación.
- ✅ **Fase 3** — Design system: `Table`, `Modal`, `ConfirmDialog`, `Select`, `Textarea`, `Pagination`, `EmptyState`, `ErrorState`, `Skeleton`, `PageHeader` y `useDisclosure`.
- ✅ **Fase 4** — Configuración real (crear/editar precios y porcentajes) y dashboard con datos en vivo: precios, contadores, compra abierta y encargos pendientes.
- ✅ **Fase 5** — Encargos: listado con búsqueda y filtros, paginación, detalle, alta/edición con imagen, eliminación y acción rápida “Marcar entregado”.
- ✅ **Fase 6** — Compras: listado con filtro abiertas/cerradas, apertura (una sola activa), edición de totales, detalle con encargos asociados, cierre/reapertura y borrado.
- ✅ **Fase 7** — Productos: inventario con búsqueda y filtros, galería de imágenes múltiple, alta/edición, detalle, “Marcar vendido” y borrado.
- ✅ **Fase 8** — Impuestos: listado con búsqueda, alta/edición con comprobante obligatorio, detalle y borrado.

La ruta `/dev/ui` permite ver una previsualización del design system (solo en desarrollo).

## Estado del plan

Todas las fases funcionales del frontend están implementadas y verificadas contra Strapi. Las mejoras pendientes de backend (Clientes, Referencias, Usuarios y relación estable Encargo→Shopping) se irán integrando cuando existan en Strapi.

Pendiente de backend (fuera del alcance actual): Clientes, Referencias y gestión de Usuarios.
