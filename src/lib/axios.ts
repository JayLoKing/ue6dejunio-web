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

/**
 * El cuerpo de error tal como puede llegar, no sólo como lo manda la API.
 *
 * `ErrorResponse` es siempre un objeto, pero entre el navegador y el handler hay un proxy y un
 * servidor que contestan texto plano o HTML cuando algo se cae antes de llegar. Tipar sólo el
 * objeto volvía inalcanzable la rama que atiende ese caso, y la rama sigue haciendo falta.
 */
type ApiErrorBody = ApiErrorPayload | string

const GENERIC_FAILURE = "Ocurrió un error inesperado."

/** Hasta dónde un cuerpo en texto plano sigue siendo algo que alguien puede leer en un cartel. */
const MAX_PLAIN_TEXT = 200

/**
 * Lo que se puede mostrar de un cuerpo que no vino en el formato de la API.
 *
 * Un proxy caído contesta una página de error entera. Tal cual, eso es una pared de markup
 * dentro de un toast: ilegible, y encima tapa la pantalla. Una línea corta se muestra; lo que
 * empieza como HTML no es un mensaje para nadie, y lo largo se corta.
 */
const asReadableText = (body: string): string => {
  const text = body.trim()
  if (!text || text.startsWith("<")) return GENERIC_FAILURE
  return text.length > MAX_PLAIN_TEXT
    ? `${text.slice(0, MAX_PLAIN_TEXT).trimEnd()}…`
    : text
}

const extractMessage = (error: AxiosError<ApiErrorBody>): string => {
  const data = error.response?.data
  if (data) {
    if (typeof data === "string") return asReadableText(data)
    return (
      data.message ?? data.detail ?? data.title ?? data.error ?? GENERIC_FAILURE
    )
  }
  if (error.code === "ERR_NETWORK")
    return "No se pudo conectar con el servidor."
  return error.message || GENERIC_FAILURE
}

const createAxiosInstance = (): AxiosInstance => axios.create({ baseURL })

/** Exportado para poder afirmar el manejo de errores sobre una instancia propia, sin tocar la real. */
export const setupInterceptors = (instance: AxiosInstance): void => {
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Un `FormData` se manda solo: el navegador le pone su `multipart/form-data` con el
      // `boundary` que acaba de generar. Pisarlo con `application/json` deja un cuerpo que el
      // servidor no puede partir, y el error sale del otro lado sin nombrar la causa.
      if (!(config.data instanceof FormData)) {
        config.headers["Content-Type"] = "application/json"
      }
      const jwt = useAuthStore.getState().accessToken
      if (jwt) {
        config.headers["Authorization"] = `Bearer ${jwt}`
      }
      return config
    },
    (error: AxiosError) => Promise.reject(error)
  )

  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiErrorBody>) => {
      const status = error.response?.status ?? 0

      // Dos cosas distintas contestan 401, y lo que las separa es si había token.
      //
      // Con token es una sesión que venció: se marca vencida y se sale callado, porque
      // `SessionExpiryNotice` ya muestra el cartel con la puerta y dos avisos para un solo hecho
      // sobran. Sin token es un intento de entrar que falló, y baja al toast como cualquier otro
      // error — el servidor contesta "Credenciales inválidas" y hay que mostrarlo.
      if (status === 401 && useAuthStore.getState().accessToken) {
        useAuthStore.getState().expireSession()
        return Promise.reject(error)
      }

      // Todo lo que llegue hasta acá se cuenta, incluido lo que no trae estado: un servidor que
      // no contesta deja `status` en 0, y filtrar por `>= 400` lo dejaba pasar callado. La
      // excepción es lo que la interfaz canceló ella misma al desmontar o al cambiar de filtro —
      // eso no es una falla, y avisarlo sería acusar al usuario de algo que hizo la aplicación.
      //
      // El código va sólo cuando existe: a quien perdió la conexión, "Código desconocido" no le
      // agrega nada sobre el mensaje que ya lee.
      if (error.code === AxiosError.ERR_CANCELED) {
        return Promise.reject(error)
      }

      toast.error(
        extractMessage(error),
        status > 0 ? { description: `Código ${status}` } : undefined
      )

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
