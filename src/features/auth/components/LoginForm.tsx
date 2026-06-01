import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { LogInIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import {
  credentialsSchema,
  type CredentialsFormValues,
} from "../models/schemas/credentials-schema"
import { useLogin } from "../hooks/useLogin"

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CredentialsFormValues>({
    resolver: zodResolver(credentialsSchema),
    defaultValues: { email: "", password: "" },
  })

  const { mutateAsync, isPending } = useLogin()

  const onSubmit = handleSubmit(async (values) => {
    try {
      await mutateAsync(values)
    } catch {
      /* axios interceptor ya dispara toast */
    }
  })

  const loading = isSubmitting || isPending

  return (
    <Card className="w-full max-w-md border-univalle/20 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Unidad Educativa 6 de Junio</CardTitle>
        <CardDescription>Ingresa tus credenciales</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate>
          <FieldGroup>
            <Field data-invalid={Boolean(errors.email) || undefined}>
              <FieldLabel htmlFor="email">Correo</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="director@ue6.bo"
                aria-invalid={Boolean(errors.email) || undefined}
                {...register("email")}
              />
              {errors.email ? (
                <FieldError>{errors.email.message}</FieldError>
              ) : (
                <FieldDescription>Tu correo</FieldDescription>
              )}
            </Field>

            <Field data-invalid={Boolean(errors.password) || undefined}>
              <FieldLabel htmlFor="password">Contraseña</FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password) || undefined}
                {...register("password")}
              />
              {errors.password ? (
                <FieldError>{errors.password.message}</FieldError>
              ) : null}
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-2">
        <Button
          type="submit"
          className="w-full bg-univalle text-univalle-foreground hover:bg-univalle/90"
          disabled={loading}
          onClick={onSubmit}
        >
          <LogInIcon data-icon="inline-start" />
          {loading ? "Ingresando..." : "Ingresar"}
        </Button>
      </CardFooter>
    </Card>
  )
}

export default LoginForm
