// Re-export animate-ui animated tooltip under the shadcn path.
// animate-ui's <Tooltip> self-provides its provider, so TooltipProvider here
// is a passthrough to keep existing imports (e.g. global provider) working.
import type { ReactNode } from "react"

export {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/animate-ui/components/radix/tooltip"

export function TooltipProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}
