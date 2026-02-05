"use client"
import { useState, useEffect } from "react"
import { ref, update } from "firebase/database"
import { database } from "@/lib/firebase"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { WeighingEntry } from "@/lib/types"

export interface Adjustment {
  ajustadoPor: string;
  pontaMar: number;
  meio: number;
  pontaTerra: number;
  observacoes: string;
  dataAjuste: string;
}

interface AdjustmentModalProps {
  open: boolean;
  onClose: () => void;
  entry: WeighingEntry | null;
  balancaId: string | null;
}

export function AdjustmentModal({ open, onClose, entry, balancaId }: AdjustmentModalProps) {
  const [ajustadoPor, setAjustadoPor] = useState("")
  const [pontaMar, setPontaMar] = useState("")
  const [meio, setMeio] = useState("")
  const [pontaTerra, setPontaTerra] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open && entry && balancaId && entry.balancas[balancaId]?.ajuste) {
      const existingAdjustment = entry.balancas[balancaId].ajuste!;
      setAjustadoPor(existingAdjustment.ajustadoPor || "")
      setPontaMar(existingAdjustment.pontaMar.toString())
      setMeio(existingAdjustment.meio.toString())
      setPontaTerra(existingAdjustment.pontaTerra.toString())
      setObservacoes(existingAdjustment.observacoes || "")
    } else {
      setAjustadoPor("")
      setPontaMar("")
      setMeio("")
      setPontaTerra("")
      setObservacoes("")
    }
  }, [open, entry, balancaId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry || !balancaId) {
      console.error("Nenhum registro selecionado para ajuste.");
      return;
    }

    setIsLoading(true);

    const newAdjustment: Adjustment = {
      ajustadoPor,
      pontaMar: Number(pontaMar) || 0,
      meio: Number(meio) || 0,
      pontaTerra: Number(pontaTerra) || 0,
      observacoes,
      dataAjuste: new Date().toISOString(),
    };

    // Lógica de Notificação
    const notificationMessage = `Ajuste na Balança ${balancaId} realizado por ${ajustadoPor}.`;
    const notificationKey = `notif_${new Date().getTime()}_${entry.key}`; // Chave única

    const newNotification = {
      date: new Date().toLocaleString("pt-BR"),
      message: notificationMessage,
      pontaTerra: newAdjustment.pontaTerra,
      meio: newAdjustment.meio,
      pontaMar: newAdjustment.pontaMar,
      observations: newAdjustment.observacoes,
      entryId: entry.key,
      balancaId: balancaId,
    };

    try {
      const adjustmentPath = `pesagens/${entry.key}/balancas/${balancaId}/ajuste`;
      const notificationPath = `dashboardNotifications/${notificationKey}`;

      // Combina o ajuste e a notificação em uma única operação de atualização atômica.
      const updates = {
        [adjustmentPath]: newAdjustment,
        [notificationPath]: newNotification,
      };

      await update(ref(database), updates);

      console.log("Ajuste e notificação salvos com sucesso!");
      onClose();
    } catch (error) {
      console.error("Erro ao salvar o ajuste e a notificação:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!open || !entry || !balancaId) return null;

  const balancaName = `Balança ${balancaId}`;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Ajuste de Pesagem - {balancaName}</DialogTitle>
            <DialogDescription>
              Ajuste os valores de pesagem e adicione uma observação. O registro original será mantido.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="ajustadoPor" className="text-right">Ajustado por</Label>
              <Input
                id="ajustadoPor"
                value={ajustadoPor}
                onChange={(e) => setAjustadoPor(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pontaMar" className="text-right">Ponta Mar</Label>
              <Input
                id="pontaMar"
                type="number"
                value={pontaMar}
                onChange={(e) => setPontaMar(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="meio" className="text-right">Meio</Label>
              <Input
                id="meio"
                type="number"
                value={meio}
                onChange={(e) => setMeio(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="pontaTerra" className="text-right">Ponta Terra</Label>
              <Input
                id="pontaTerra"
                type="number"
                value={pontaTerra}
                onChange={(e) => setPontaTerra(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="observacoes" className="text-right">Observações</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar Ajuste"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
