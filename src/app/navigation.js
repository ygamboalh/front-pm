import {
  TbAdjustmentsHorizontal,
  TbBuildingStore,
  TbCash,
  TbLayoutDashboard,
  TbPackage,
  TbPalette,
  TbReceipt,
  TbReportAnalytics,
  TbShoppingCart,
  TbWorld,
} from 'react-icons/tb';

const BASE_NAV_GROUPS = [
  {
    label: 'General',
    items: [
      { to: '/', label: 'Dashboard', icon: TbLayoutDashboard, end: true },
      { to: '/informes', label: 'Informes', icon: TbReportAnalytics },
      {
        to: '/tienda-online',
        label: 'Tienda online',
        icon: TbWorld,
        newTab: true,
      },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { to: '/encargos', label: 'Encargos', icon: TbPackage },
      { to: '/compras', label: 'Compras', icon: TbShoppingCart },
      { to: '/caja', label: 'Caja', icon: TbCash },
    ],
  },
  {
    label: 'Catálogo',
    items: [
      { to: '/tienda', label: 'Tienda', icon: TbBuildingStore },
      { to: '/comprados', label: 'Comprados', icon: TbShoppingCart },
      { to: '/vendidos', label: 'Vendidos', icon: TbCash },
    ],
  },
  {
    label: 'Finanzas',
    items: [
      { to: '/impuestos', label: 'Impuestos', icon: TbReceipt },
      { to: '/configuracion', label: 'Configuración', icon: TbAdjustmentsHorizontal },
    ],
  },
];

const DEV_NAV_GROUP = import.meta.env.DEV
  ? [
      {
        label: 'Desarrollo',
        items: [{ to: '/dev/ui', label: 'Sistema UI', icon: TbPalette }],
      },
    ]
  : [];

export const NAV_GROUPS = [...BASE_NAV_GROUPS, ...DEV_NAV_GROUP];

export function findPageTitle(pathname) {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      const matches =
        item.to === pathname || (item.to !== '/' && pathname.startsWith(`${item.to}/`));
      if (matches) return item.label;
    }
  }
  return 'Panel';
}
