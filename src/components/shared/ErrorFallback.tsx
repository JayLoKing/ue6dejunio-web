import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export interface ErrorFallbackProps {
  error?: unknown
  reset?: () => void
}

const isErrorWithMessage = (e: unknown): e is { message: string } =>
  typeof e === "object" &&
  e !== null &&
  "message" in e &&
  typeof (e as { message: unknown }).message === "string"

export function ErrorFallback({ error, reset }: ErrorFallbackProps) {
  const message = isErrorWithMessage(error)
    ? error.message
    : "Ha ocurrido un error inesperado en la plataforma escolar."

  const handleRetry = () => {
    if (reset) {
      reset()
      return
    }
    window.location.reload()
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md border-brand/30">
        <CardHeader className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangleIcon data-icon className="size-6" />
          </div>
          <CardTitle>Algo salió mal</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          Intenta reintentar la acción. Si el problema persiste, contacta a
          soporte de la Unidad Educativa 6 de Junio.
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={handleRetry}>
            <RefreshCwIcon data-icon="inline-start" />
            Reintentar acción
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
