import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  RefreshCwIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PAGE_SIZE_OPTIONS } from "@/lib/types/pagination"

export interface DataTablePaginationProps {
  /** 1-indexed current page. */
  page: number
  pageSize: number
  total: number
  totalPages: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  isFetching?: boolean
  /** Optional refresh handler — shows a refresh button when provided. */
  onRefresh?: () => void
}

export function DataTablePagination({
  page,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  isFetching,
  onRefresh,
}: DataTablePaginationProps) {
  const safeTotalPages = Math.max(1, totalPages)
  const canPrev = page > 1
  const canNext = page < safeTotalPages

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span>Filas por pagina</span>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => onPageSizeChange(Number(v))}
        >
          <SelectTrigger className="h-8 w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="ml-2">
          {total} registro(s){isFetching ? " · actualizando…" : ""}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {onRefresh ? (
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            title="Refrescar"
            disabled={isFetching}
            onClick={onRefresh}
          >
            <RefreshCwIcon
              className={cn("size-4", isFetching && "animate-spin")}
            />
          </Button>
        ) : null}
        <span className="text-muted-foreground">
          Pagina {page} de {safeTotalPages}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            disabled={!canPrev}
            onClick={() => onPageChange(1)}
          >
            <ChevronsLeftIcon className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            disabled={!canPrev}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeftIcon className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            disabled={!canNext}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRightIcon className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            disabled={!canNext}
            onClick={() => onPageChange(safeTotalPages)}
          >
            <ChevronsRightIcon className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
