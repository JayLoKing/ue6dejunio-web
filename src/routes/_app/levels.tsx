import { createFileRoute, redirect } from "@tanstack/react-router"

import { useAuthStore } from "@/features/auth/store/authStore"
import { isRole } from "@/features/auth/types"
import { NameCrudPage } from "@/features/academic/components/NameCrudPage"
import {
  useCreateLevel,
  useDeleteLevel,
  useLevels,
  useUpdateLevel,
} from "@/features/academic/hooks/useAcademic"

export const Route = createFileRoute("/_app/levels")({
  beforeLoad: () => {
    if (!isRole(useAuthStore.getState().role, "DIRECTOR")) {
      throw redirect({ to: "/dashboard" })
    }
  },
  component: LevelsPage,
})

function LevelsPage() {
  const create = useCreateLevel()
  const update = useUpdateLevel()
  const remove = useDeleteLevel()
  return (
    <NameCrudPage
      title="Niveles"
      description="Niveles educativos de la institucion."
      label="Nivel"
      useList={useLevels}
      mutations={{ create, update, remove }}
    />
  )
}
