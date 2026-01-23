"use client"
import { useState, useEffect } from "react"
import { ref, update } from "firebase/database"
import { database } from "@/lib/firebase"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { WeighingEntry } from "@/lib/types" // Precisaremos criar/ajustar este arquivo de tipos

// Esta é a estrutura dos dados do ajuste que vamos salvar.
export interface Adjustment {
  ajustadoPor: string;
  pontaMar: number;
  meio: number;
  pontaTerra: number;
  observacoes: string;
  dataAjuste: string;
}

// As propriedades para o modal agora são mais específicas.
interface AdjustmentModalProps {
  open: boolean;
  onClose: () => void;
  // Recebe a entrada de pesagem completa para obter o ID
  entry: WeighingEntry | null;
  // Recebe o ID/nome da balança específica que está sendo ajustada
  balancaId: string | null;
}

export function AdjustmentModal({ open, onClose, entry, balancaId }: AdjustmentModalProps) {
  const [ajustadoPor, setAjustadoPor] = useState("")
  const [pontaMar, setPontaMar] = useState("")
  const [meio, setMeio] = useState("")
  const [pontaTerra, setPontaTerra] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Este efeito é executado quando o modal abre ou o registro muda.
  // Ele pré-preenche o formulário se um ajuste já existir.
  useEffect(() => {
    if (open && entry && balancaId && entry.balancas[balancaId]?.ajuste) {
      const existingAdjustment = entry.balancas[balancaId].ajuste!;
      setAjustadoPor(existingAdjustment.ajustadoPor || "")
      setPontaMar(existingAdjustment.pontaMar.toString())
      setMeio(existingAdjustment.meio.toString())
      setPontaTerra(existingAdjustment.pontaTerra.toString())
      setObservacoes(existingAdjustment.observacoes || "")
    } else {
      // Se não houver ajuste, limpa o formulário.
      setAjustadoPor("")
      setPontaMar("")
      setMeio("")
      setPontaTerra("")
      setObservacoes("")
    }
  }, [open, entry, balancaId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!entry || !balancaId) {
        console.error("Nenhum registro selecionado para ajuste.")
        return;
    }
    
    setIsLoading(true)

    const newAdjustment: Adjustment = {
      ajustadoPor,
      pontaMar: Number(pontaMar) || 0,
      meio: Number(meio) || 0,
      pontaTerra: Number(pontaTerra) || 0,
      observacoes,
      dataAjuste: new Date().toISOString(),
    }

    try {
      // O caminho agora aponta diretamente para a balança específica dentro do registro específico.
      // Corrigindo o caminho para usar entry.key em vez de entry.id
      const adjustmentPath = `pesagens/${entry.key}/balancas/${balancaId}/ajuste`;
      const updates = {
        [adjustmentPath]: newAdjustment
      };

      // Usamos `update` para definir ou sobrescrever o objeto 'ajuste'.
      await update(ref(database), updates);

      console.log("Ajuste salvo com sucesso!")
      onClose(); // Fecha o modal em caso de sucesso.
    } catch (error) {
      console.error("Erro ao salvar o ajuste:", error)
    } finally {
        setIsLoading(false);
    }
  }
  
  // Retorna nulo se o modal não deveria estar aberto ou se os dados estiverem faltando.
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
