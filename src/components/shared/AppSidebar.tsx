import {
  BookOpenIcon,
  CalendarCheckIcon,
  ClipboardListIcon,
  FileBarChartIcon,
  GraduationCapIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  UserSquare2Icon,
  UsersIcon,
} from "lucide-react"
import { Link, useRouterState } from "@tanstack/react-router"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useAuthStore } from "@/features/auth/store/authStore"
import { isRole, type UserRole } from "@/features/auth/types"

type NavTo =
  | "/dashboard"
  | "/users"
  | "/courses"
  | "/students"
  | "/attendance"
  | "/scores"
  | "/reports"

interface NavItem {
  title: string
  to: NavTo
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  roles: UserRole[]
}

const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    to: "/dashboard",
    icon: LayoutDashboardIcon,
    roles: ["DIRECTOR", "SECRETARY", "TEACHER"],
  },
  { title: "Usuarios", to: "/users", icon: UsersIcon, roles: ["DIRECTOR"] },
  { title: "Cursos", to: "/courses", icon: BookOpenIcon, roles: ["DIRECTOR"] },
  {
    title: "Estudiantes",
    to: "/students",
    icon: UserSquare2Icon,
    roles: ["TEACHER"],
  },
  {
    title: "Asistencias",
    to: "/attendance",
    icon: CalendarCheckIcon,
    roles: ["TEACHER"],
  },
  {
    title: "Notas / Areas",
    to: "/scores",
    icon: ClipboardListIcon,
    roles: ["TEACHER"],
  },
  {
    title: "Reportes",
    to: "/reports",
    icon: FileBarChartIcon,
    roles: ["TEACHER"],
  },
]

export function AppSidebar() {
  const fullName = useAuthStore((s) => s.fullName)
  const role = useAuthStore((s) => s.role)
  const logout = useAuthStore((s) => s.logout)
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const visible = NAV_ITEMS.filter((i) =>
    i.roles.some((r) => isRole(role, r)),
  )

  const handleLogout = () => {
    logout()
    window.location.href = "/auth/login"
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-univalle text-univalle-foreground">
                  <GraduationCapIcon className="size-5" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">U.E. 6 de Junio</span>
                  <span className="text-xs text-muted-foreground">
                    Sistema academico
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Plataforma</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visible.map((item) => {
                const Icon = item.icon
                const isActive = pathname.startsWith(item.to)
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link to={item.to}>
                        <Icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="cursor-default">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
                {(fullName ?? "U").slice(0, 1).toUpperCase()}
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="text-sm font-medium">
                  {fullName ?? "Usuario"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {role ?? "Sin rol"}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleLogout} tooltip="Cerrar sesion">
              <LogOutIcon />
              <span>Cerrar sesion</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
