import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

import type { AuthState } from "../types"
import type { CredentialResponse } from "../models/response/credential-response"

const initialState = {
  userId: null,
  email: null,
  fullName: null,
  role: null,
  accessToken: null,
  tokenType: null,
  expiresAt: null,
  mustChangePassword: false,
  gradeName: null,
  parallelName: null,
  courseId: null,
  isTechnical: null,
} as const

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...initialState,
      setSession: (user: CredentialResponse) =>
        set({
          userId: user.userId,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          accessToken: user.accessToken,
          tokenType: user.tokenType,
          expiresAt: user.expiresAt,
          mustChangePassword: user.mustChangePassword,
          gradeName: user.gradeName,
          parallelName: user.parallelName,
          courseId: user.courseId,
          isTechnical: user.technical,
        }),
      logout: () => set({ ...initialState }),
    }),
    {
      name: "ue6dejunio-auth-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
