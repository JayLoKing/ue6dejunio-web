import { useMemo } from "react"
import {
  Bell as BellIcon,
  BookOpenIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  FileText as FileTextIcon,
  SchoolIcon,
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
import {
  ADMIN_LINKS,
  TOP_LINKS,
  visibleLinksFor,
} from "@/components/shared/navLinks"
import { useAuthStore } from "@/features/auth/store/authStore"
import { isRole } from "@/features/auth/types"
import { useCurrentContext } from "@/features/auth/hooks/useCurrentContext"
import { useCourseOverview } from "@/features/courses/hooks/useCourses"
import { isTechnicalSubject } from "@/features/courses/utils/subject"
import { useParallels } from "@/features/catalog/hooks/useCatalog"

export function AppSidebar() {
  const role = useAuthStore((s) => s.role)
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const teacher = isRole(role, "TEACHER")
  const director = isRole(role, "DIRECTOR")

  const ctx = useCurrentContext()
  const isTechnical = ctx.isTechnical
  const classGroups = ctx.classGroups
  // Docente de aula: ve las 9 materias del curso (incl. técnicas) vía overview.
  const homeroomOverview = useCourseOverview(
    teacher && !isTechnical ? ctx.homeroomCourseId : null,
    1
  )
  const subjects = useMemo(
    () =>
      isTechnical ? classGroups : (homeroomOverview.data?.classGroups ?? []),
    [isTechnical, classGroups, homeroomOverview.data]
  )
  const subjectsLoading =
    ctx.isLoading || (!isTechnical && homeroomOverview.isLoading)
  const parallelsQuery = useParallels()
  const parallels = useMemo(
    () => parallelsQuery.data ?? [],
    [parallelsQuery.data]
  )

  // Las dos listas se filtran igual: el `roles` que cada enlace declara es lo único que decide si
  // se ve. El catálogo académico antes se abría con el flag `director` sin mirar ese campo.
  const visibleTop = visibleLinksFor(TOP_LINKS, role)
  const visibleAdmin = visibleLinksFor(ADMIN_LINKS, role)

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="/dashboard">
                {/* El degradado, y no el plano: es la marca de la escuela y el único lugar del
                    menú donde algo puede permitirse tener peso. */}
                <div className="bg-brand-gradient flex aspect-square size-8 items-center justify-center rounded-lg text-white shadow-sm">
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

              {/* Docente: aula ve sus materias; técnico ve sus cursos (su única materia por curso). */}
              {teacher ? (
                <Collapsible defaultOpen className="group/collapsible" asChild>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={
                          isTechnical ? "Mis cursos" : "Cuaderno Pedagógico"
                        }
                      >
                        {isTechnical ? <SchoolIcon /> : <ClipboardListIcon />}
                        <span>
                          {isTechnical ? "Mis cursos" : "Cuaderno Pedagógico"}
                        </span>
                        <ChevronRightIcon className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {subjectsLoading ? (
                          <SidebarMenuSubItem>
                            <span className="px-2 text-xs text-muted-foreground">
                              Cargando…
                            </span>
                          </SidebarMenuSubItem>
                        ) : subjects.length === 0 ? (
                          <SidebarMenuSubItem>
                            <span className="px-2 text-xs text-muted-foreground">
                              {isTechnical ? "Sin cursos" : "Sin materias"}
                            </span>
                          </SidebarMenuSubItem>
                        ) : (
                          subjects.map((cg) => (
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
                                    <span className="ml-auto rounded bg-warning/16 px-1 text-[10px] text-warning">
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

        {visibleAdmin.length > 0 ? (
          <SidebarGroup>
            <SidebarGroupLabel>Académico</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {visibleAdmin.map((item) => {
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
                      <FileTextIcon />
                      <span>PDC</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        {/* Todos tienen bandeja: la campana es un vistazo, esto es la bandeja entera. */}
        <SidebarGroup>
          <SidebarGroupLabel>Comunicación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith("/notifications")}
                  tooltip="Notificaciones"
                >
                  <Link to="/notifications">
                    <BellIcon />
                    <span>Notificaciones</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
