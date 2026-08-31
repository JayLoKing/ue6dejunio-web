import { CheckIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { PASSWORD_RULES } from "@/lib/validation/rules"

export interface PasswordRequirementsProps {
  value: string
}

/** Live checklist — each rule turns green when satisfied. */
export function PasswordRequirements({ value }: PasswordRequirementsProps) {
  return (
    <ul className="flex flex-col gap-1 text-xs">
      {PASSWORD_RULES.map((rule) => {
        const ok = rule.test(value)
        return (
          <li
            key={rule.id}
            className={cn(
              "flex items-center gap-1.5 transition-colors",
              ok
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-muted-foreground"
            )}
          >
            {ok ? (
              <CheckIcon className="size-3.5" />
            ) : (
              <XIcon className="size-3.5" />
            )}
            {rule.label}
          </li>
        )
      })}
    </ul>
  )
}
