"use client"

import { useState } from "react"
import { ref, push } from "firebase/database"
import { database } from "@/lib/firebase"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface AdjustmentModalProps {
  open: boolean
  onClose: () => void
}

const scales = [
  { id: 1, name: "Balança 1" },
  { id: 2, name: "Balança 2" },
  { id: 3, name: "Balança 3" },
  { id: 5, name: "Balança 5" },
  { id: 6, name: "Balança 6" },
  { id: 7, name: "Balança 7" },
  { id: 8, name: "Balança 8" },
  { id: 9, name: "Balança 9" },
  { id: 10, name: "Balança 10" },
]

export function AdjustmentModal({ open, onClose }: AdjustmentModalProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 16),
    assistantName: "",
    electricianName: "",
    selectedScale: "1",
    pontaTerra: "",
    meio: "",
    pontaMar: "",
    observations: "",
  })

  const handleSubmit = async () => {
    try {
      const adjustmentData = {
        date: formData.date,
        assistantName: formData.assistantName,
        electricianName: formData.electricianName,
        scale: formData.selectedScale,
        pontaTerra: Number.parseFloat(formData.pontaTerra) || 0,
        meio: Number.parseFloat(formData.meio) || 0,
        pontaMar: Number.parseFloat(formData.pontaMar) || 0,
        observations: formData.observations,
        timestamp: Date.now(),
      }

      await push(ref(database, "adjustments"), adjustmentData)

      // Create notification
      const notification = {
        date: formData.date,
        message: `Ajuste realizado na Balança ${formData.selectedScale} por ${formData.assistantName}`,
        pontaTerra: adjustmentData.pontaTerra,
        meio: adjustmentData.meio,
        pontaMar: adjustmentData.pontaMar,
        observations: formData.observations,
        timestamp: Date.now(),
      }

      await push(ref(database, "dashboardNotifications"), notification)

      alert("Ajuste registrado com sucesso!")
      setFormData({
        date: new Date().toISOString().slice(0, 16),
        assistantName: "",
        electricianName: "",
        selectedScale: "1",
        pontaTerra: "",
        meio: "",
        pontaMar: "",
        observations: "",
      })
      onClose()
    } catch (error) {
      console.error("Erro ao registrar ajuste:", error)
      alert("Erro ao registrar ajuste")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registro de Ajuste</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="date">Data e Hora</Label>
            <Input
              id="date"
              type="datetime-local"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="assistantName">Nome do Assistente</Label>
            <Input
              id="assistantName"
              value={formData.assistantName}
              onChange={(e) => setFormData({ ...formData, assistantName: e.target.value })}
              placeholder="Digite o nome do assistente"
            />
          </div>

          <div>
            <Label htmlFor="electricianName">Nome do Eletricista</Label>
            <Input
              id="electricianName"
              value={formData.electricianName}
              onChange={(e) => setFormData({ ...formData, electricianName: e.target.value })}
              placeholder="Digite o nome do eletricista"
            />
          </div>

          <div>
            <Label htmlFor="selectedScale">Selecione a Balança</Label>
            <Select
              value={formData.selectedScale}
              onValueChange={(value) => setFormData({ ...formData, selectedScale: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {scales.map((scale) => (
                  <SelectItem key={scale.id} value={String(scale.id)}>
                    {scale.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">Pesos de Ajuste</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="pontaTerra">Ponta Terra (kg)</Label>
                <Input
                  id="pontaTerra"
                  type="number"
                  step="0.1"
                  value={formData.pontaTerra}
                  onChange={(e) => setFormData({ ...formData, pontaTerra: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="meio">Meio (kg)</Label>
                <Input
                  id="meio"
                  type="number"
                  step="0.1"
                  value={formData.meio}
                  onChange={(e) => setFormData({ ...formData, meio: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="pontaMar">Ponta Mar (kg)</Label>
                <Input
                  id="pontaMar"
                  type="number"
                  step="0.1"
                  value={formData.pontaMar}
                  onChange={(e) => setFormData({ ...formData, pontaMar: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="observations">Observações</Label>
            <Textarea
              id="observations"
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              placeholder="Digite observações sobre o ajuste"
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>Salvar Ajuste</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
