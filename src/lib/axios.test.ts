import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { setupInterceptors } from "./axios"
import { useAuthStore } from "@/features/auth/store/authStore"

const toastError = vi.hoisted(() => vi.fn())
vi.mock("sonner", () => ({ toast: { error: toastError } }))

/**
 * Un cliente que falla con el estado y el cuerpo que se le pidan, con los interceptores reales
 * encima.
 *
 * El adapter lanza el `AxiosError` en lugar de devolver la respuesta: `validateStatus` lo aplican
 * los adapters que trae axios, no el pipeline, así que uno propio que devuelve un 401 lo daría
 * por bueno y el interceptor de error nunca correría. Armado así, lo que llega al interceptor es
 * la misma forma que le llega en producción, con su `response` y su `code`.
 */
const clientRejectingWith = (status: number, data: unknown): AxiosInstance => {
  const client = axios.create()
  setupInterceptors(client)
  client.defaults.adapter = async (config) => {
    const response = {
      status,
      statusText: "",
      data,
      headers: {},
      config,
    } as AxiosResponse
    throw new AxiosError(
      `Request failed with status code ${status}`,
      AxiosError.ERR_BAD_REQUEST,
      config,
      null,
      response
    )
  }
  return client
}

/** Un cliente que falla sin respuesta: el servidor no contestó, o alguien canceló el pedido. */
const clientFailingWithout = (code: string): AxiosInstance => {
  const client = axios.create()
  setupInterceptors(client)
  client.defaults.adapter = async (config) => {
    throw new AxiosError("Network Error", code, config)
  }
  return client
}

const CREDENTIALS_REJECTED = { message: "Credenciales inválidas" }

beforeEach(() => {
  toastError.mockClear()
  useAuthStore.setState({ accessToken: null, sessionExpired: false })
})

describe("las cabeceras que salen", () => {
  /** Un cliente que no falla, para poder leer la config con la que salió el pedido. */
  const clientCapturingConfig = () => {
    const client = axios.create()
    setupInterceptors(client)
    let sent: InternalAxiosRequestConfig | undefined
    client.defaults.adapter = async (config) => {
      sent = config
      return { status: 200, statusText: "", data: {}, headers: {}, config }
    }
    return { client, sent: () => sent }
  }

  it("declara JSON para un cuerpo normal", async () => {
    const { client, sent } = clientCapturingConfig()

    await client.post("/courses", { name: "Primero A" })

    expect(sent()?.headers["Content-Type"]).toBe("application/json")
  })

  /**
   * Un `FormData` se manda solo: el navegador le pone su `multipart/form-data` con el `boundary`
   * que acaba de generar. Pisarlo con JSON deja un cuerpo que el servidor no puede partir, y la
   * falla aparece del otro lado sin nombrar la causa.
   */
  it("no pisa el tipo de un FormData", async () => {
    const { client, sent } = clientCapturingConfig()

    await client.post("/students/import", new FormData())

    expect(sent()?.headers["Content-Type"]).not.toBe("application/json")
  })
})

describe("el 401 de un login que falla", () => {
  /**
   * Es el caso que se veía roto desde afuera: escribías mal la contraseña y no pasaba nada. El
   * interceptor cortaba en 401 antes del toast, así que el servidor decía "Credenciales
   * inválidas" y nadie lo mostraba.
   */
  it("dice lo que el servidor contestó", async () => {
    const client = clientRejectingWith(401, CREDENTIALS_REJECTED)

    await expect(client.post("/auth/login")).rejects.toThrow()

    expect(toastError).toHaveBeenCalledOnce()
    expect(toastError.mock.calls[0][0]).toBe("Credenciales inválidas")
  })

  /**
   * Y no marca vencida una sesión que nunca existió. `expireSession` borra el store entero y
   * levanta el cartel de sesión vencida; dispararlo en la pantalla de entrar es contarle a la
   * persona que perdió algo que todavía no tenía.
   */
  it("no marca vencida una sesión que nunca existió", async () => {
    const client = clientRejectingWith(401, CREDENTIALS_REJECTED)

    await expect(client.post("/auth/login")).rejects.toThrow()

    expect(useAuthStore.getState().sessionExpired).toBe(false)
  })
})

describe("el 401 de una sesión que venció", () => {
  /**
   * El otro 401, el que sí tenía razón de ser silencioso: acá no hace falta un toast porque
   * `SessionExpiryNotice` ya muestra el cartel con la puerta. Dos avisos para un solo hecho.
   */
  it("levanta el cartel y no dice nada más", async () => {
    useAuthStore.setState({ accessToken: "un-token-vencido" })
    const client = clientRejectingWith(401, { message: "Token expirado" })

    await expect(client.get("/courses")).rejects.toThrow()

    expect(useAuthStore.getState().sessionExpired).toBe(true)
    expect(toastError).not.toHaveBeenCalled()
  })
})

describe("el resto de los errores", () => {
  it("los cuenta con su código", async () => {
    const client = clientRejectingWith(409, { message: "El curso ya existe" })

    await expect(client.post("/courses")).rejects.toThrow()

    expect(toastError).toHaveBeenCalledWith("El curso ya existe", {
      description: "Código 409",
    })
  })

  /**
   * No todo lo que contesta con error habla el formato de la API: un proxy o el servidor que se
   * cae antes de llegar al handler devuelven texto plano. Si eso se leyera como objeto, la
   * persona vería "Ocurrió un error inesperado." teniendo el motivo escrito delante.
   */
  it("también lee un cuerpo que vino en texto plano", async () => {
    const client = clientRejectingWith(502, "Bad Gateway")

    await expect(client.get("/courses")).rejects.toThrow()

    expect(toastError).toHaveBeenCalledWith("Bad Gateway", {
      description: "Código 502",
    })
  })

  /**
   * Un servidor que no contesta no deja estado, así que `status` queda en 0 y la condición que
   * miraba `>= 400` lo dejaba pasar sin decir nada — el mismo silencio que la contraseña
   * equivocada, y con el mensaje ya escrito en `extractMessage` sin que nadie lo alcanzara.
   */
  it("avisa cuando el servidor no contesta", async () => {
    const client = clientFailingWithout(AxiosError.ERR_NETWORK)

    await expect(client.get("/courses")).rejects.toThrow()

    expect(toastError).toHaveBeenCalledOnce()
    expect(toastError.mock.calls[0][0]).toBe(
      "No se pudo conectar con el servidor."
    )
  })

  /**
   * Un pedido cancelado no es una falla: lo cancela la propia interfaz al desmontar o al cambiar
   * de filtro, y avisarlo sería acusar al usuario de un error que cometió la aplicación.
   */
  it("se calla cuando el pedido se canceló", async () => {
    const client = clientFailingWithout(AxiosError.ERR_CANCELED)

    await expect(client.get("/courses")).rejects.toThrow()

    expect(toastError).not.toHaveBeenCalled()
  })

  /**
   * Un 403 con sesión viva no es una sesión vencida: el token sirve, lo que falta es el permiso.
   * Sin esta distinción, pedir algo ajeno cerraría la sesión de quien lo pidió.
   */
  it("un permiso negado no cierra la sesión", async () => {
    useAuthStore.setState({ accessToken: "un-token-bueno" })
    const client = clientRejectingWith(403, { message: "Acceso denegado" })

    await expect(client.get("/users")).rejects.toThrow()

    expect(useAuthStore.getState().sessionExpired).toBe(false)
    expect(toastError).toHaveBeenCalledOnce()
  })
})
