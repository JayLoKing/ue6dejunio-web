import {
  BookOpenIcon,
  CalendarCheckIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  FileBarChartIcon,
  FileText,
  GraduationCapIcon,
  LayersIcon,
  LayoutDashboardIcon,
  LayoutGridIcon,
  LogOutIcon,
  type LucideIcon,
  SchoolIcon,
  UserSquare2Icon,
  UsersIcon,
} from "lucide-react"
import { Link, useRouterState } from "@tanstack/react-router"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/animate-ui/primitives/radix/collapsible"
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/animate-ui/components/radix/sidebar"
import { useAuthStore } from "@/features/auth/store/authStore"
import { isRole, type UserRole } from "@/features/auth/types"
import { useTeacherSubjects } from "@/features/students/hooks/useTeacherStudents"
import { useParallels } from "@/features/catalog/hooks/useCatalog"

interface NavLink {
  title: string
  to: string
  icon: LucideIcon
  roles: UserRole[]
}

const TOP_LINKS: NavLink[] = [
  {
    title: "Dashboard",
    to: "/dashboard",
    icon: LayoutDashboardIcon,
    roles: ["DIRECTOR", "SECRETARY", "TEACHER"],
  },
  { title: "Usuarios", to: "/users", icon: UsersIcon, roles: ["DIRECTOR"] },
  {
    title: "Asignar materias",
    to: "/courses",
    icon: ClipboardListIcon,
    roles: ["DIRECTOR"],
  },
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
    title: "Reportes",
    to: "/reports",
    icon: FileBarChartIcon,
    roles: ["TEACHER"],
  },
]

const ADMIN_LINKS: NavLink[] = [
  { title: "Niveles", to: "/levels", icon: LayersIcon, roles: ["DIRECTOR"] },
  { title: "Grados", to: "/grades", icon: GraduationCapIcon, roles: ["DIRECTOR"] },
  { title: "Paralelos", to: "/parallels", icon: LayoutGridIcon, roles: ["DIRECTOR"] },
  { title: "Materias", to: "/subjects", icon: BookOpenIcon, roles: ["DIRECTOR"] },
]

export function AppSidebar() {
  const fullName = useAuthStore((s) => s.fullName)
  const role = useAuthStore((s) => s.role)
  const userId = useAuthStore((s) => s.userId)
  const logout = useAuthStore((s) => s.logout)
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const teacher = isRole(role, "TEACHER")
  const director = isRole(role, "DIRECTOR")

  const subjectsQuery = useTeacherSubjects(teacher ? userId : null)
  const parallelsQuery = useParallels()

  const handleLogout = () => {
    logout()
    window.location.href = "/auth/login"
  }

  const visibleTop = TOP_LINKS.filter((l) => l.roles.some((r) => isRole(role, r)))

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-univalle text-univalle-foreground">
                  <SchoolIcon className="size-5" />
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
              {visibleTop.map((item) => {
                const Icon = item.icon
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname.startsWith(item.to)}
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

              {/* Teacher: Materias / Áreas → subjects */}
              {teacher ? (
                <Collapsible
                  defaultOpen
                  className="group/collapsible"
                  asChild
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip="Materias / Areas">
                        <ClipboardListIcon />
                        <span>Materias / Areas</span>
                        <ChevronRightIcon className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {subjectsQuery.isLoading ? (
                          <SidebarMenuSubItem>
                            <span className="px-2 text-xs text-muted-foreground">
                              Cargando…
                            </span>
                          </SidebarMenuSubItem>
                        ) : (subjectsQuery.data ?? []).length === 0 ? (
                          <SidebarMenuSubItem>
                            <span className="px-2 text-xs text-muted-foreground">
                              Sin materias
                            </span>
                          </SidebarMenuSubItem>
                        ) : (
                          (subjectsQuery.data ?? []).map((s) => (
                            <SidebarMenuSubItem key={s.subjectId}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === `/scores/${s.subjectId}`}
                              >
                                <Link
                                  to="/scores/$subjectId"
                                  params={{ subjectId: s.subjectId }}
                                >
                                  <span>{s.subjectName}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))
                        )}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : null}

              {/* Director: Cursos → parallels */}
              {director ? (
                <Collapsible className="group/collapsible" asChild>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip="Cursos">
                        <BookOpenIcon />
                        <span>Cursos</span>
                        <ChevronRightIcon className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {(parallelsQuery.data ?? []).map((p) => (
                          <SidebarMenuSubItem key={p.id}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === `/cursos/${p.id}`}
                            >
                              <Link
                                to="/cursos/$parallelId"
                                params={{ parallelId: String(p.id) }}
                              >
                                <span>Paralelo {p.name}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : null}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {director ? (
          <SidebarGroup>
            <SidebarGroupLabel>Academico</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {ADMIN_LINKS.map((item) => {
                  const Icon = item.icon
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname.startsWith(item.to)}
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
        ) : null}

        {teacher || director ? (
          <SidebarGroup>
            <SidebarGroupLabel>Planificacion</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith("/pdc")}
                    tooltip="PDC"
                  >
                    <Link to="/pdc">
                      <FileText />
                      <span>PDC</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="cursor-default">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
                {(fullName ?? "U").slice(0, 1).toUpperCase()}
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="text-sm font-medium">{fullName ?? "Usuario"}</span>
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
