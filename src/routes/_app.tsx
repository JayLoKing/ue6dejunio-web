import {
  Outlet,
  createFileRoute,
  redirect,
  useRouterState,
} from "@tanstack/react-router"

import { AppSidebar } from "@/components/shared/AppSidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { ChangePasswordDialog } from "@/features/auth/components/ChangePasswordDialog"
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
  "/courses": "Cursos",
  "/attendance": "Asistencias",
  "/scores": "Notas",
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
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <h1 className="text-sm font-medium">{title}</h1>
          <div className="ml-auto">
            <ModeToggle />
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-6">
          <Outlet />
        </main>
      </SidebarInset>
      <ChangePasswordDialog open={mustChangePassword} />
    </SidebarProvider>
  )
}
