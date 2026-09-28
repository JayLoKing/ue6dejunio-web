import {
  BookOpenIcon,
  CalendarCheckIcon,
  CalendarRangeIcon,
  ClipboardListIcon,
  BrainCircuitIcon,
  FileBarChartIcon,
  GraduationCapIcon,
  LayersIcon,
  LayoutDashboardIcon,
  LayoutGridIcon,
  LibraryIcon,
  type LucideIcon,
  TrophyIcon,
  UserSquare2Icon,
  UsersIcon,
} from "lucide-react"

import { isRole, type UserRole } from "@/features/auth/types"

export interface NavLink {
  title: string
  to: string
  icon: LucideIcon
  roles: UserRole[]
}

/**
 * Los enlaces de una lista que le corresponden a un rol.
 *
 * Lo usan las dos listas de este módulo, y esa es la única promesa que hace. El catálogo
 * académico declaraba sus `roles` y el sidebar no los leía: abría el grupo entero con un flag
 * aparte y mapeaba todo, así que el campo no decidía nada y agregarle un rol a una entrada no
 * cambiaba lo que se veía. Dos formas de responder la misma pregunta terminan respondiéndola
 * distinto.
 *
 * Fuera de estas listas el sidebar todavía decide con flags propios — el cuaderno del docente,
 * los cursos de Dirección, el PDC y las notificaciones — porque cada uno es su propio grupo con
 * su etiqueta y su contenido, no una fila más. Eso significa que su visibilidad no está cubierta
 * por ningún test: mudarlos acá pide antes decidir cómo se agrupan.
 *
 * Sin rol no devuelve nada: una sesión a medio cargar muestra un menú vacío, no el de Dirección.
 */
export function visibleLinksFor(
  links: NavLink[],
  role: string | null
): NavLink[] {
  return links.filter((link) => link.roles.some((r) => isRole(role, r)))
}

/**
 * Qué enlace ve cada rol.
 *
 * Vive aparte del sidebar y sin JSX a propósito: una pantalla puede estar construida, tener su ruta
 * abierta al rol correcto y aun así no aparecer, porque nadie le puso el enlace. Eso fue
 * exactamente lo que pasó con Secretaría — `/reports`, `/riesgo` y `/cuadro-de-honor` ya la dejaban
 * entrar tipeando la URL. Separado del componente, el enlace se afirma en un test junto al permiso
 * que le corresponde, en vez de descubrirse iniciando sesión con cada rol.
 */
export const TOP_LINKS: NavLink[] = [
  {
    title: "Dashboard",
    to: "/dashboard",
    icon: LayoutDashboardIcon,
    roles: ["DIRECTOR", "SECRETARY", "TEACHER"],
  },
  { title: "Usuarios", to: "/users", icon: UsersIcon, roles: ["DIRECTOR"] },
  {
    title: "Registrar Curso",
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
  // Mismo título, otra pantalla y otro público: el docente ve el padrón de su curso, Dirección y
  // secretaría ven la institución entera. Ningún rol tiene los dos, así que el nombre no se repite.
  {
    title: "Estudiantes",
    to: "/estudiantes",
    icon: UserSquare2Icon,
    roles: ["DIRECTOR", "SECRETARY"],
  },
  {
    title: "Asistencias",
    to: "/attendance",
    icon: CalendarCheckIcon,
    roles: ["TEACHER"],
  },
  // Los tres, cada uno a lo suyo: el docente al consolidado de su curso de aula, Dirección y
  // Secretaría a cualquiera eligiéndolo. Qué pestaña ve cada uno lo decide la página — el informe
  // pedagógico, por ejemplo, es del docente con Dirección de consulta y Secretaría no lo abre.
  {
    title: "Reportes",
    to: "/reports",
    icon: FileBarChartIcon,
    roles: ["DIRECTOR", "SECRETARY", "TEACHER"],
  },
  // Fuera de "Reportes" aunque los tres roles lleguen a ambos: el podio tiene un alcance que la
  // pantalla de reportes no ofrece, la unidad educativa entera por encima de un curso.
  {
    title: "Cuadro de honor",
    to: "/cuadro-de-honor",
    icon: TrophyIcon,
    roles: ["DIRECTOR", "SECRETARY", "TEACHER"],
  },
  // Secretaría entra a leer y exportar, no a predecir: correr el modelo escribe predicciones y
  // avisa a los docentes, y `/api/risk-predictions/**` no la admite. La pantalla ya distingue las
  // dos cosas con `canRunModel`, así que la diferencia está adentro y no en quién ve el enlace.
  {
    title: "Riesgo académico",
    to: "/riesgo",
    icon: BrainCircuitIcon,
    roles: ["DIRECTOR", "SECRETARY", "TEACHER"],
  },
]

/** El catálogo académico: lo administra Dirección y nadie más lo ve. */
export const ADMIN_LINKS: NavLink[] = [
  { title: "Niveles", to: "/levels", icon: LayersIcon, roles: ["DIRECTOR"] },
  {
    title: "Grados",
    to: "/grades",
    icon: GraduationCapIcon,
    roles: ["DIRECTOR"],
  },
  {
    title: "Paralelos",
    to: "/parallels",
    icon: LayoutGridIcon,
    roles: ["DIRECTOR"],
  },
  // Antes que Materias: una materia no se puede crear sin un área a la que pertenecer.
  {
    title: "Áreas de Saberes",
    to: "/areas-saberes",
    icon: LibraryIcon,
    roles: ["DIRECTOR"],
  },
  {
    title: "Materias",
    to: "/subjects",
    icon: BookOpenIcon,
    roles: ["DIRECTOR"],
  },
  {
    title: "Trimestres",
    to: "/trimestres",
    icon: CalendarRangeIcon,
    roles: ["DIRECTOR"],
  },
]
