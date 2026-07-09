import { useState } from "react"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { ManualEnrollForm } from "./ManualEnrollForm"
import { AutomatedEnrollForm } from "./AutomatedEnrollForm"

export interface EnrollStudentDialogProps {
  courseId: string | null
}

export function EnrollStudentDialog({ courseId }: EnrollStudentDialogProps) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<"manual" | "automated">("manual")

  const close = () => setOpen(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="bg-univalle text-univalle-foreground hover:bg-univalle/90"
          disabled={!courseId}
        >
          <PlusIcon data-icon="inline-start" />
          Nuevo estudiante
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Inscribir estudiantes</DialogTitle>
          <DialogDescription>
            Elige el modo: manual (1 estudiante) o automatizado (nomina PDF).
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">Manual</TabsTrigger>
            <TabsTrigger value="automated">Automatizado (PDF)</TabsTrigger>
          </TabsList>
          <TabsContent value="manual" className="pt-4">
            <ManualEnrollForm courseId={courseId} onSuccess={close} />
          </TabsContent>
          <TabsContent value="automated" className="pt-4">
            <AutomatedEnrollForm courseId={courseId} onSuccess={close} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
