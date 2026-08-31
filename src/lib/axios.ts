import { useAuthStore } from "@/features/auth/store/authStore"
import { env } from "@/config/env"
import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios"
import { toast } from "sonner"

const baseURL: string = env.VITE_API_URL

interface ApiErrorPayload {
  message?: string
  error?: string
  detail?: string
  title?: string
}

const extractMessage = (error: AxiosError<ApiErrorPayload>): string => {
  const data = error.response?.data
  if (data) {
    if (typeof data === "string") return data
    return (
      data.message ??
      data.detail ??
      data.title ??
      data.error ??
      "Ocurrió un error inesperado."
    )
  }
  if (error.code === "ERR_NETWORK")
    return "No se pudo conectar con el servidor."
  return error.message || "Ocurrió un error inesperado."
}

const createAxiosInstance = (): AxiosInstance => axios.create({ baseURL })

const setupInterceptors = (httpClient: AxiosInstance) => {
  httpClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      config.headers["Content-Type"] = "application/json"
      const jwt = useAuthStore.getState().accessToken
      if (jwt) {
        config.headers["Authorization"] = `Bearer ${jwt}`
      }
      return config
    },
    (error: AxiosError) => Promise.reject(error)
  )

  httpClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<ApiErrorPayload>) => {
      const status = error.response?.status ?? 0

      if (status === 401) {
        useAuthStore.getState().logout()
        window.location.href = "/auth/login"
        return Promise.reject(error)
      }

      if (status >= 400) {
        toast.error(extractMessage(error), {
          description: `Código ${status || "desconocido"}`,
        })
      }

      return Promise.reject(error)
    }
  )
}

const initAxios = (): AxiosInstance => {
  const httpClient = createAxiosInstance()
  setupInterceptors(httpClient)
  return httpClient
}

export const httpClient: AxiosInstance = initAxios()
