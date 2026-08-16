import { useMemo } from "react"
import {
  BookOpenIcon,
  CalendarCheckIcon,
  CalendarRangeIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  FileBarChartIcon,
  FileText,
  GraduationCapIcon,
  LayersIcon,
  LayoutDashboardIcon,
  LayoutGridIcon,
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
import { NavUser } from "@/components/shared/NavUser"
import { useAuthStore } from "@/features/auth/store/authStore"
import { isRole, type UserRole } from "@/features/auth/types"
import { useCurrentContext } from "@/features/auth/hooks/useCurrentContext"
import { isTechnicalSubject } from "@/features/courses/types/course"
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
  { title: "Trimestres", to: "/trimestres", icon: CalendarRangeIcon, roles: ["DIRECTOR"] },
]

export function AppSidebar() {
  const role = useAuthStore((s) => s.role)
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const teacher = isRole(role, "TEACHER")
  const director = isRole(role, "DIRECTOR")

  const ctx = useCurrentContext()
  const isTechnical = ctx.isTechnical
  const classGroups = ctx.classGroups
  const parallelsQuery = useParallels()
  const parallels = useMemo(
    () => parallelsQuery.data ?? [],
    [parallelsQuery.data],
  )

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
                    Sistema académico
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

              {/* Docente: aula ve sus materias; tecnico ve sus cursos (su unica materia por curso). */}
              {teacher ? (
                <Collapsible
                  defaultOpen
                  className="group/collapsible"
                  asChild
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={isTechnical ? "Mis cursos" : "Materias / Áreas"}
                      >
                        {isTechnical ? <SchoolIcon /> : <ClipboardListIcon />}
                        <span>{isTechnical ? "Mis cursos" : "Materias / Áreas"}</span>
                        <ChevronRightIcon className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {ctx.isLoading ? (
                          <SidebarMenuSubItem>
                            <span className="px-2 text-xs text-muted-foreground">
                              Cargando…
                            </span>
                          </SidebarMenuSubItem>
                        ) : classGroups.length === 0 ? (
                          <SidebarMenuSubItem>
                            <span className="px-2 text-xs text-muted-foreground">
                              {isTechnical ? "Sin cursos" : "Sin materias"}
                            </span>
                          </SidebarMenuSubItem>
                        ) : (
                          classGroups.map((cg) => (
                            <SidebarMenuSubItem key={cg.id}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={pathname === `/scores/${cg.id}`}
                              >
                                <Link
                                  to="/scores/$classGroupId"
                                  params={{ classGroupId: cg.id }}
                                >
                                  <span className="truncate">
                                    {isTechnical
                                      ? `${cg.gradeName} ${cg.parallelName}`
                                      : cg.subjectName}
                                  </span>
                                  {!isTechnical &&
                                  isTechnicalSubject(cg.subjectName) ? (
                                    <span className="ml-auto rounded bg-amber-500/20 px-1 text-[10px] text-amber-700 dark:text-amber-300">
                                      T
                                    </span>
                                  ) : null}
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
                        {parallels.map((p) => (
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
            <SidebarGroupLabel>Académico</SidebarGroupLabel>
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
            <SidebarGroupLabel>Planificación</SidebarGroupLabel>
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
        <NavUser />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
