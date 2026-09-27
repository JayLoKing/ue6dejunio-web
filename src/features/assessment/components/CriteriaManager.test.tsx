import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"

const useCriteria = vi.hoisted(() => vi.fn())
const useCriteriaEvents = vi.hoisted(() => vi.fn())
const noopMutation = vi.hoisted(() => () => ({
  mutate: vi.fn(),
  mutateAsync: vi.fn(),
  isPending: false,
}))

vi.mock("../hooks/useAssessment", () => ({
  useCriteria,
  useCriteriaEvents,
  useCreateCriterion: noopMutation,
  useUpdateCriterion: noopMutation,
  useDeleteCriterion: noopMutation,
  useCreateEvent: noopMutation,
  useDeleteEvent: noopMutation,
}))

/**
 * El Link de TanStack necesita un router montado; acá sólo interesa si el enlace existe.
 *
 * Reenvía las props que le llegan. El botón usa `asChild`, así que el `title` que la prueba busca
 * baja hasta este elemento: un mock que sólo pintara `children` lo perdería, y entonces las
 * pruebas que exigen que el botón NO esté pasarían aunque el botón estuviera.
 */
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to: _to,
    params: _params,
    search: _search,
    ...rest
  }: {
    children: React.ReactNode
    to?: string
    params?: unknown
    search?: unknown
  }) => (
    // Con `href`: un ancla sin él no tiene rol `link`, y la prueba lo busca por rol.
    <a href="#" {...rest}>
      {children}
    </a>
  ),
}))

import { CriteriaManager } from "./CriteriaManager"

const CLASS_GROUP = "cg-1"

const criterion = (id: string, name: string, activityName: string | null) => ({
  id,
  classGroupId: CLASS_GROUP,
  dimension: "Knowing" as const,
  name,
  activityName,
  trimester: 1,
  curriculumPlanId: null,
})

const event = (id: string, criterionId: string, title: string) => ({
  id,
  criterionId,
  classGroupId: CLASS_GROUP,
  title,
})

const loaded = <T,>(data: T) => ({ data, isLoading: false, isError: false })

beforeEach(() => {
  vi.clearAllMocks()
  useCriteriaEvents.mockReturnValue({ byCriterion: {}, isLoading: false })
})

const notesLink = (name: string) =>
  screen.queryByRole("link", { name: `Notas del criterio ${name}` })

describe("CriteriaManager", () => {
  /**
   * Un criterio de calificación directa lleva la nota sobre sí mismo, y eso se escribe en Notas.
   *
   * La página de criterio existe para calificar los ítems de una actividad. Ofrecerla en un
   * criterio que no tiene ítems abre un segundo lugar para escribir el mismo número, y el docente
   * no tiene cómo saber cuál de los dos es el bueno.
   */
  it("no ofrece la página de notas en un criterio de calificación directa", () => {
    useCriteria.mockReturnValue(loaded([criterion("c-1", "test1", null)]))

    render(<CriteriaManager classGroupId={CLASS_GROUP} trimester={1} />)

    expect(screen.getByText("test1")).toBeInTheDocument()
    expect(notesLink("test1")).toBeNull()
  })

  it("sí la ofrece en un criterio con actividad", () => {
    useCriteria.mockReturnValue(
      loaded([criterion("c-2", "Lectura Didactica", "Control de lectura")])
    )
    useCriteriaEvents.mockReturnValue({
      byCriterion: { "c-2": [event("e-1", "c-2", "Cuento 1")] },
      isLoading: false,
    })

    render(<CriteriaManager classGroupId={CLASS_GROUP} trimester={1} />)

    expect(notesLink("Lectura Didactica")).toBeInTheDocument()
  })

  /**
   * Los criterios anteriores a `activityName` lo traen en null y aun así tienen ítems. Tener ítems
   * es lo que define al criterio de actividad, no el nombre.
   */
  it("la ofrece en un criterio viejo que tiene ítems y no nombre de actividad", () => {
    useCriteria.mockReturnValue(loaded([criterion("c-3", "Antiguo", null)]))
    useCriteriaEvents.mockReturnValue({
      byCriterion: { "c-3": [event("e-2", "c-3", "Tema 1")] },
      isLoading: false,
    })

    render(<CriteriaManager classGroupId={CLASS_GROUP} trimester={1} />)

    expect(notesLink("Antiguo")).toBeInTheDocument()
  })

  /**
   * Mientras los ítems cargan no se sabe todavía si el criterio es de actividad.
   *
   * Mostrar el botón y sacarlo cuando llega la respuesta es peor que no mostrarlo: el docente
   * alcanza a apretarlo.
   */
  it("no lo ofrece mientras todavía no sabe si hay ítems", () => {
    useCriteria.mockReturnValue(loaded([criterion("c-4", "Cargando", null)]))
    useCriteriaEvents.mockReturnValue({ byCriterion: {}, isLoading: true })

    render(<CriteriaManager classGroupId={CLASS_GROUP} trimester={1} />)

    expect(notesLink("Cargando")).toBeNull()
  })

  it("no lo ofrece en solo lectura, ni con actividad", () => {
    useCriteria.mockReturnValue(
      loaded([criterion("c-5", "Lectura", "Control de lectura")])
    )
    useCriteriaEvents.mockReturnValue({
      byCriterion: { "c-5": [event("e-3", "c-5", "Cuento 1")] },
      isLoading: false,
    })

    render(
      <CriteriaManager classGroupId={CLASS_GROUP} trimester={1} readOnly />
    )

    expect(notesLink("Lectura")).toBeNull()
  })
})
