"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { createCorrectionAction } from "@/lib/actions/inspection";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface CorrectionButtonProps {
  eventId: string;
  nodeId: string;
}

export function CorrectionButton({ eventId, nodeId }: CorrectionButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Only show to authenticated users who are members of this node
  if (!session?.user?.id || session.user.nodeId !== nodeId) {
    return null;
  }

  async function handleConfirm() {
    setLoading(true);
    const result = await createCorrectionAction({ eventId });
    setLoading(false);

    if (result.success && result.data) {
      toast.success("Corrección creada exitosamente.");
      router.push(`/dashboard/inspect/${result.data.event.id}`);
    } else {
      toast.error(result.error ?? "Error al crear la corrección.");
      setOpen(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant="outline"
            size="lg"
            className="w-full border-brand-accent text-brand-accent hover:bg-brand-accent/5"
          />
        }
      >
        Crear corrección
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Crear una corrección?</AlertDialogTitle>
          <AlertDialogDescription>
            Se creará un nuevo borrador vinculado a este reporte. El reporte
            original no será modificado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={loading}>
            {loading ? "Creando..." : "Crear corrección"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
