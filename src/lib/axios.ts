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

/** Exportado para poder afirmar el manejo de errores sobre una instancia propia, sin tocar la real. */
export const setupInterceptors = (httpClient: AxiosInstance) => {
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

      // Dos cosas muy distintas contestan 401, y lo que las separa es si había sesión.
      //
      // Con token es una sesión que venció: se marca vencida y se sale sin decir nada más, porque
      // `SessionExpiryNotice` ya muestra el cartel con la puerta y dos avisos para un solo hecho
      // sobran. Antes acá había un `window.location.href = "/auth/login"`: una recarga entera del
      // navegador en mitad de lo que la persona estuviera escribiendo, sin una palabra de por qué.
      // La redirección pasa a ser algo que se aprieta, no algo que ocurre.
      //
      // Sin token es un intento de entrar que falló, y cae al toast de abajo como cualquier otro
      // error. Antes los dos casos salían por acá: la contraseña equivocada no decía nada —
      // el servidor contesta "Credenciales inválidas" y nadie lo mostraba — y encima marcaba
      // vencida una sesión que nunca existió, que es contarle a la persona que perdió algo que
      // todavía no tenía.
      if (status === 401 && useAuthStore.getState().accessToken) {
        useAuthStore.getState().expireSession()
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
