import { createFileRoute, redirect } from "@tanstack/react-router"

import { useAuthStore } from "@/features/auth/store/authStore"
import { isRole } from "@/features/auth/types"
import { NameCrudPage } from "@/features/academic/components/NameCrudPage"
import {
  useCreateParallel,
  useDeleteParallel,
  useParallels,
  useUpdateParallel,
} from "@/features/academic/hooks/useAcademic"

export const Route = createFileRoute("/_app/parallels")({
  beforeLoad: () => {
    if (!isRole(useAuthStore.getState().role, "DIRECTOR")) {
      throw redirect({ to: "/dashboard" })
    }
  },
  component: ParallelsPage,
})

function ParallelsPage() {
  const create = useCreateParallel()
  const update = useUpdateParallel()
  const remove = useDeleteParallel()
  return (
    <NameCrudPage
      title="Paralelos"
      description="Paralelos (A, B, C…) de la institucion."
      label="Paralelo"
      maxLen={1}
      useList={useParallels}
      mutations={{ create, update, remove }}
    />
  )
}
