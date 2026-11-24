import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { TbEye, TbEyeOff, TbLock, TbMail, TbPackage, TbShieldCheck, TbTruckDelivery } from 'react-icons/tb';
import toast from 'react-hot-toast';
import Button from '@/shared/components/ui/Button';
import Input from '@/shared/components/ui/Input';
import { API_URL, getApiErrorMessage } from '@/shared/api/strapiClient';
import { APP_NAME } from '@/shared/lib/constants';
import { useLogin } from '../hooks';
import { useAuthStore } from '../store/authStore';

const schema = z.object({
  identifier: z.string().min(1, 'El email es obligatorio').email('Introduce un email válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

const HIGHLIGHTS = [
  {
    icon: TbPackage,
    title: 'Encargos centralizados',
    text: 'Compras, estados de pago y entregas en un solo lugar.',
  },
  {
    icon: TbTruckDelivery,
    title: 'Compras y envíos',
    text: 'Sigue el peso, el gasto y la ganancia de cada compra.',
  },
  {
    icon: TbShieldCheck,
    title: 'Acceso seguro',
    text: 'Autenticación con usuarios y roles de Strapi.',
  },
];

export default function LoginPage() {
  const token = useAuthStore((state) => state.token);
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { identifier: '', password: '' },
  });

  if (token) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values);
      toast.success('Bienvenido de nuevo');
      navigate(location.state?.from || '/', { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo iniciar sesión'));
    }
  });

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-canvas-deep p-12 text-white lg:flex">
        <div
          aria-hidden="true"
          className="absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-brand-600/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-blue-500/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-price/10 blur-3xl"
        />

        <div className="relative flex items-center gap-3">
          <img
            src="/pm.png"
            alt={APP_NAME}
            className="h-11 w-11 shrink-0 rounded-xl object-cover"
          />
          <div>
            <p className="text-sm font-semibold">{APP_NAME}</p>
            <p className="text-xs text-ink-faint">Control de encargos y ventas</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-3xl font-semibold leading-tight">
            Todo tu negocio de encargos, bajo control.
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            Una interfaz rápida y clara para gestionar compras, inventario y cobros, conectada
            directamente a tu backend en Strapi.
          </p>

          <ul className="mt-10 space-y-6">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-300 ring-1 ring-inset ring-brand-500/20">
                  <Icon size={20} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-medium">{title}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-ink-muted">
          Conectado a <span className="font-mono text-ink-faint">{API_URL}</span>
        </p>
      </aside>

      <main className="flex items-center justify-center bg-canvas px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <img
              src="/pm.png"
              alt={APP_NAME}
              className="h-10 w-10 shrink-0 rounded-xl object-cover"
            />
            <p className="text-sm font-semibold text-ink">{APP_NAME}</p>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-7 shadow-card ring-1 ring-line/60">
            <h2 className="text-xl font-semibold text-ink">Iniciar sesión</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Usa el email y la contraseña de tu usuario de Strapi.
            </p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="tu@email.com"
                icon={TbMail}
                error={errors.identifier?.message}
                {...register('identifier')}
              />

              <div className="relative">
                <Input
                  label="Contraseña"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  icon={TbLock}
                  className="pr-10"
                  error={errors.password?.message}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-2 top-[34px] rounded-md p-1.5 text-ink-faint transition hover:bg-surface-hover hover:text-ink-soft"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <TbEyeOff size={18} /> : <TbEye size={18} />}
                </button>
              </div>

              <Button type="submit" className="w-full" loading={isSubmitting}>
                Entrar
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-ink-muted">
            ¿Problemas para entrar? Revisa que Strapi esté corriendo y que tu usuario tenga el
            rol <span className="font-medium text-ink-soft">Authenticated</span>.
          </p>
        </div>
      </main>
    </div>
  );
}
