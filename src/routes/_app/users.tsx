import { createFileRoute, redirect } from "@tanstack/react-router"

import { useAuthStore } from "@/features/auth/store/authStore"
import { isRole } from "@/features/auth/types"
import { CreateUserDialog } from "@/features/users/components/CreateUserDialog"
import { UsersTable } from "@/features/users/components/UsersTable"

export const Route = createFileRoute("/_app/users")({
  beforeLoad: () => {
    const role = useAuthStore.getState().role
    if (!isRole(role, "DIRECTOR")) {
      throw redirect({ to: "/dashboard" })
    }
  },
  component: UsersPage,
})

function UsersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Gestion de cuentas institucionales.
          </p>
        </div>
        <CreateUserDialog />
      </div>
      <UsersTable />
    </div>
  )
}
