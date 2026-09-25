import { motion } from "motion/react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export interface AuthLayoutProps {
  /** El formulario. Va sobre el papel, a la derecha. */
  children: ReactNode
  /** Qué se viene a hacer acá: "Ingresa a tu cuenta", "Recupera tu contraseña". */
  title: string
  /** Una línea, la que aclara el título sin repetirlo. */
  subtitle?: string
  className?: string
}

/**
 * La puerta del sistema: pizarra a la izquierda, papel a la derecha.
 *
 * Las tres pantallas de autenticación eran una tarjeta centrada sobre un fondo de estrellas con
 * gravedad. Se veía como cualquier cosa — el fondo no decía nada de una escuela y la tarjeta
 * flotaba sin apoyarse en nada. Esto las reemplaza por una composición partida, que es lo que hace
 * una institución cuando se presenta: de un lado quién es, del otro qué hay que hacer.
 *
 * EL PANEL DE MARCA no es decorado. Sostiene el nombre completo de la escuela, que en la tarjeta
 * entraba apretado en dos renglones, y deja el formulario sin encabezado institucional — el
 * formulario pregunta el correo, no explica dónde estás.
 *
 * LA TRAMA es una hoja cuadriculada, a un tercio de opacidad. Es el material del lugar: todo lo que
 * este sistema reemplaza estaba escrito en una hoja así. Cuesta dos degradados repetidos y ningún
 * archivo.
 *
 * EL SEIS de fondo es tipografía, no un logo. El escudo no está en el repositorio y un placeholder
 * gris se ve peor que no poner nada; un número gigante recortado por el borde da la misma presencia
 * y no finge ser un escudo que no tenemos.
 *
 * EN PANTALLA CHICA el panel se derrumba a una banda de cabecera: el nombre sigue estando, el
 * formulario queda arriba del pliegue, y nadie tiene que hacer scroll para escribir su correo.
 */
export function AuthLayout({
  children,
  title,
  subtitle,
  className,
}: AuthLayoutProps) {
  return (
    <div className={cn("grid min-h-svh lg:grid-cols-[1.05fr_1fr]", className)}>
      <aside className="bg-brand-gradient relative flex flex-col justify-between overflow-hidden px-8 py-10 text-white lg:px-14 lg:py-16">
        {/*
          La hoja cuadriculada. `repeating-linear-gradient` y no una imagen: escala sola a cualquier
          tamaño de panel y no pesa nada. El aria-hidden importa — un lector de pantalla no tiene
          nada que hacer acá.
        */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, rgba(255,255,255,0.7) 0 1px, transparent 1px 28px), repeating-linear-gradient(90deg, rgba(255,255,255,0.7) 0 1px, transparent 1px 28px)",
          }}
        />
        {/* El seis, cortado por el borde inferior: presencia sin pedir un asset. */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-6 -bottom-24 text-[22rem] leading-none font-semibold tracking-tighter text-white/[0.07] select-none lg:-right-10 lg:text-[30rem]"
        >
          6
        </span>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
          initial={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <p className="text-[0.7rem] font-medium tracking-[0.2em] text-white/70 uppercase">
            Sistema académico
          </p>
        </motion.div>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 max-w-lg py-12"
          initial={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.5, delay: 0.08, ease: "easeOut" }}
        >
          <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight text-balance lg:text-6xl">
            Unidad Educativa
            <span className="block text-white/80">
              &ldquo;6 de Junio&rdquo;
            </span>
          </h1>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-white/70 lg:text-base">
            Notas, asistencia y seguimiento pedagógico de la unidad educativa,
            en un solo lugar.
          </p>
        </motion.div>

        <motion.dl
          animate={{ opacity: 1 }}
          className="relative z-10 flex gap-8 border-t border-white/15 pt-6 text-xs text-white/60"
          initial={{ opacity: 0 }}
          transition={{ duration: 0.4, delay: 0.24 }}
        >
          <div>
            <dt className="tracking-[0.14em] uppercase">Distrito</dt>
            <dd className="mt-1 text-sm text-white/90">Sacaba</dd>
          </div>
          <div>
            <dt className="tracking-[0.14em] uppercase">Departamento</dt>
            <dd className="mt-1 text-sm text-white/90">Cochabamba</dd>
          </div>
        </motion.dl>
      </aside>

      <main className="flex items-center justify-center px-6 py-12 lg:px-12">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
          initial={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.45, delay: 0.12, ease: "easeOut" }}
        >
          <header className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
            {subtitle ? (
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </header>
          {children}
        </motion.div>
      </main>
    </div>
  )
}
