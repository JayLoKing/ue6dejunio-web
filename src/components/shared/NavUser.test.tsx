import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { useAuthStore } from "@/features/auth/store/authStore"

// El menú animado exige un provider de resaltado que jsdom no necesita para decidir qué opciones
// hay; se sustituye por elementos planos con los mismos roles.
vi.mock("@/components/animate-ui/components/radix/dropdown-menu", () => {
  const Plain = ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  )
  return {
    DropdownMenu: Plain,
    DropdownMenuTrigger: Plain,
    DropdownMenuContent: Plain,
    DropdownMenuGroup: Plain,
    DropdownMenuLabel: Plain,
    DropdownMenuSeparator: () => <hr />,
    DropdownMenuItem: ({
      children,
      onSelect,
    }: {
      children?: React.ReactNode
      onSelect?: () => void
    }) => (
      <button role="menuitem" onClick={onSelect}>
        {children}
      </button>
    ),
  }
})
vi.mock("@/components/animate-ui/components/radix/sidebar", () => ({
  SidebarMenu: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SidebarMenuItem: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SidebarMenuButton: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useSidebar: () => ({ isMobile: false }),
}))

// Los diálogos no son lo que se prueba acá: sólo qué opciones ofrece el menú según el rol.
vi.mock("@/features/auth/components/ProfileDialog", () => ({
  ProfileDialog: () => null,
}))
vi.mock("@/features/auth/components/ChangePasswordMenuDialog", () => ({
  ChangePasswordMenuDialog: () => null,
}))
vi.mock("@/features/handover/components/DirectorHandoverDialog", () => ({
  DirectorHandoverDialog: ({ open }: { open: boolean }) =>
    open ? <div role="dialog">Cambio de Director abierto</div> : null,
}))

import { NavUser } from "./NavUser"

const openMenu = () => {
  render(<NavUser />)
}

describe("NavUser", () => {
  it("ofrece Mi perfil a todos", async () => {
    useAuthStore.setState({ role: "TEACHER", fullName: "Usuario Docente" })
    openMenu()

    expect(
      await screen.findByRole("menuitem", { name: /mi perfil/i })
    ).toBeInTheDocument()
  })

  it("ofrece Cambio de Director sólo al Director", async () => {
    useAuthStore.setState({ role: "DIRECTOR", fullName: "Usuario Director" })
    openMenu()

    await userEvent.click(
      await screen.findByRole("menuitem", { name: /cambio de director/i })
    )

    expect(screen.getByText("Cambio de Director abierto")).toBeInTheDocument()
  })

  it("no lo ofrece a un Docente ni a un Secretario", async () => {
    useAuthStore.setState({ role: "SECRETARY", fullName: "Usuario Secretaria" })
    openMenu()

    await screen.findByRole("menuitem", { name: /mi perfil/i })
    expect(
      screen.queryByRole("menuitem", { name: /cambio de director/i })
    ).not.toBeInTheDocument()
  })
})
