import { createFileRoute, redirect } from "@tanstack/react-router"

import { useAuthStore } from "@/features/auth/store/authStore"
import { isRole } from "@/features/auth/types"
import { KnowledgeAreasPage } from "@/features/academic/components/KnowledgeAreasPage"

export const Route = createFileRoute("/_app/areas-saberes")({
  beforeLoad: () => {
    if (!isRole(useAuthStore.getState().role, "DIRECTOR")) {
      throw redirect({ to: "/dashboard" })
    }
  },
  component: KnowledgeAreasPage,
})
