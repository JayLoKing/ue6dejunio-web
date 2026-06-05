import {
  Outlet,
  createFileRoute,
  redirect,
  useRouterState,
} from "@tanstack/react-router"

import { AppSidebar } from "@/components/shared/AppSidebar"
import { ThemeTogglerButton } from "@/components/animate-ui/components/buttons/theme-toggler"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/animate-ui/components/radix/sidebar"
import { ChangePasswordDialog } from "@/features/auth/components/ChangePasswordDialog"
import { NotificationBell } from "@/features/notifications/components/NotificationBell"
import { useAuthStore } from "@/features/auth/store/authStore"

export const Route = createFileRoute("/_app")({
  beforeLoad: () => {
    const token = useAuthStore.getState().accessToken
    if (!token) {
      throw redirect({ to: "/auth/login" })
    }
  },
  component: AppLayout,
})

const SECTION_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/users": "Usuarios",
  "/courses": "Asignar materias",
  "/cursos": "Cursos",
  "/levels": "Niveles",
  "/grades": "Grados",
  "/parallels": "Paralelos",
  "/subjects": "Materias",
  "/students": "Estudiantes",
  "/attendance": "Asistencias",
  "/scores": "Notas / Areas",
  "/pdc": "PDC",
  "/reports": "Reportes",
}

function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const mustChangePassword = useAuthStore((s) => s.mustChangePassword)

  const title =
    Object.entries(SECTION_TITLES).find(([key]) =>
      pathname.startsWith(key),
    )?.[1] ?? "Plataforma"

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4 self-center!" />
          <h1 className="text-sm font-medium">{title}</h1>
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
            <ThemeTogglerButton variant="outline" />
          </div>
        </header>
        <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-x-hidden p-6">
          <Outlet />
        </div>
      </SidebarInset>
      <ChangePasswordDialog open={mustChangePassword} />
    </SidebarProvider>
  )
}
