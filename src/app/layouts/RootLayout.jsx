import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { TbLogout, TbMenu2, TbX } from 'react-icons/tb';
import { NAV_GROUPS, findPageTitle } from '@/app/navigation';
import { useCurrentUser } from '@/features/auth/hooks';
import { logoutRequest } from '@/features/auth/api';
import { useAuthStore } from '@/features/auth/store/authStore';
import { APP_NAME, APP_VERSION } from '@/shared/lib/constants';
import { getInitials } from '@/shared/lib/formatters';
import { cn } from '@/shared/lib/cn';

function SidebarContent({ onNavigate }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        <img
          src="/pm.png"
          alt={APP_NAME}
          className="h-9 w-9 shrink-0 rounded-lg object-cover"
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{APP_NAME}</p>
          <p className="truncate text-[11px] text-ink-faint">Encargos y ventas</p>
        </div>
      </div>

      <nav className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
              {group.label}
            </p>
            <ul className="space-y-1">
              {group.items.map(({ to, label, icon: Icon, end, newTab }) => (
                <li key={to}>
                  {newTab ? (
                    <a
                      href={to}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-muted transition hover:bg-white/5 hover:text-white"
                    >
                      <Icon size={19} aria-hidden="true" />
                      <span>{label}</span>
                    </a>
                  ) : (
                    <NavLink
                      to={to}
                      end={end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition',
                          isActive
                            ? 'bg-brand-600 font-medium text-white shadow-glow'
                            : 'text-ink-muted hover:bg-white/5 hover:text-white',
                        )
                      }
                    >
                      <Icon size={19} aria-hidden="true" />
                      <span>{label}</span>
                    </NavLink>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 px-5 py-4">
        <p className="text-[11px] text-ink-muted">Versión {APP_VERSION}</p>
      </div>
    </div>
  );
}

export default function RootLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((state) => state.clearSession);
  const user = useAuthStore((state) => state.user);

  // Refresca el usuario en segundo plano y valida el token.
  useCurrentUser();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logoutRequest();
    } catch {
      // Si el refresh token ya no es válido, igualmente se limpia la sesión local.
    }
    clearSession();
    queryClient.clear();
    navigate('/login', { replace: true });
  };

  const displayName = user?.username || user?.email || 'Usuario';
  const title = findPageTitle(location.pathname);

  return (
    <div className="min-h-screen bg-canvas">
      {/* Sidebar de escritorio */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 bg-canvas-deep lg:block">
        <SidebarContent />
      </aside>

      {/* Drawer móvil */}
      {sidebarOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative h-full w-72 max-w-[85vw] bg-canvas-deep shadow-2xl">
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="absolute right-3 top-4 rounded-md p-1.5 text-ink-faint hover:bg-white/10 hover:text-white"
              aria-label="Cerrar menú"
            >
              <TbX size={20} />
            </button>
            <SidebarContent onNavigate={() => setSidebarOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-canvas/85 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-2 text-ink-soft transition hover:bg-surface-hover lg:hidden"
            aria-label="Abrir menú"
          >
            <TbMenu2 size={22} />
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-ink">{title}</h1>
            <p className="hidden text-xs text-ink-muted sm:block">
              Panel de administración
            </p>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-3 sm:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500/15 text-[11px] font-semibold text-brand-300">
                {getInitials(displayName) || 'PM'}
              </span>
              <span className="max-w-[160px] truncate text-xs font-medium text-ink-soft">
                {displayName}
              </span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-xs font-medium text-ink-soft transition hover:border-danger/30 hover:bg-danger/10 hover:text-danger"
            >
              <TbLogout size={17} aria-hidden="true" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
