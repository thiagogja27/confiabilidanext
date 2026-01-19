"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, RotateCcw } from "lucide-react"

export interface DynamicScaleEntry {
  id: string
  prefixo: string
  bitola: "Estreita" | "Larga" 
  placaVagoes: string
  pesoOrigem: string
  primeiraPassagemR300B: string
  segundaPassagemR300C: string
  terceiraPassagemR300B: string
  origemXPrimeira: number
  origemXSegunda: number
  origemXTerceira: number
}

interface DynamicScaleInputsProps {
  entries: DynamicScaleEntry[]
  onEntriesChange: (entries: DynamicScaleEntry[]) => void
}

const createEmptyEntries = (): DynamicScaleEntry[] => {
  return Array.from({ length: 10 }, (_, index) => ({
    id: `vagao-${index + 1}-${Date.now()}`,
    prefixo: "",
    bitola: "Estreita",
    placaVagoes: "",
    pesoOrigem: "",
    primeiraPassagemR300B: "",
    segundaPassagemR300C: "",
    terceiraPassagemR300B: "",
    origemXPrimeira: 0,
    origemXSegunda: 0,
    origemXTerceira: 0,
  }))
}

export function DynamicScaleInputs({ entries, onEntriesChange }: DynamicScaleInputsProps) {
  const displayEntries = entries.length === 0 ? createEmptyEntries() : entries

  // If entries were empty, update parent with the 10 empty entries
  useEffect(() => {
    if (entries.length === 0 && displayEntries.length > 0) {
      onEntriesChange(displayEntries)
    }
  }, [entries, displayEntries, onEntriesChange])

  const addEntry = () => {
    const newEntry: DynamicScaleEntry = {
      id: `vagao-${displayEntries.length + 1}-${Date.now()}`,
      prefixo: "",
      bitola: "Estreita",
      placaVagoes: "",
      pesoOrigem: "",
      primeiraPassagemR300B: "",
      segundaPassagemR300C: "",
      terceiraPassagemR300B: "",
      origemXPrimeira: 0,
      origemXSegunda: 0,
      origemXTerceira: 0,
    }
    onEntriesChange([...displayEntries, newEntry])
  }

  const removeEntry = (id: string) => {
    onEntriesChange(displayEntries.filter((e) => e.id !== id))
  }

  const resetEntries = () => {
    onEntriesChange(createEmptyEntries())
  }

  const updateEntry = (id: string, field: keyof DynamicScaleEntry, value: string) => {
    const updatedEntries = displayEntries.map((entry) => {
      if (entry.id === id) {
        const updated = { ...entry, [field]: value }

        // Calcular diferenças automaticamente
        const pesoOrigem = Number.parseFloat(updated.pesoOrigem) || 0
        const primeira = Number.parseFloat(updated.primeiraPassagemR300B) || 0
        const segunda = Number.parseFloat(updated.segundaPassagemR300C) || 0
        const terceira = Number.parseFloat(updated.terceiraPassagemR300B) || 0

        updated.origemXPrimeira = pesoOrigem - primeira
        updated.origemXSegunda = pesoOrigem - segunda
        updated.origemXTerceira = pesoOrigem - terceira

        return updated
      }
      return entry
    })
    onEntriesChange(updatedEntries)
  }

  const getDifferenceColor = (diff: number) => {
    const absDiff = Math.abs(diff)
    if (absDiff <= 40) return "text-green-600 bg-green-50"
    return "text-red-600 bg-red-50"
  }

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl">Aferição da Balança Dinâmica (10 Vagões)</CardTitle>
        <div className="flex gap-2">
          <Button onClick={resetEntries} size="sm" variant="outline" className="gap-2 bg-transparent">
            <RotateCcw className="h-4 w-4" />
            Resetar
          </Button>
          <Button onClick={addEntry} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Vagão
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border p-2 text-left font-semibold w-8">#</th>
                <th className="border p-2 text-left font-semibold">PREFIXO</th>
                <th className="border p-2 text-left font-semibold">PLACA VAGÕES</th>
                <th className="border p-2 text-left font-semibold">PESO ORIGEM</th>
                <th className="border p-2 text-left font-semibold">BITOLA</th>
                <th className="border p-2 text-left font-semibold">1ª PASSAGEM R300 SENTIDO B</th>
                <th className="border p-2 text-left font-semibold">2ª PASSAGEM R300 SENTIDO C</th>
                <th className="border p-2 text-left font-semibold">3ª PASSAGEM R300 SENTIDO B</th>
                <th className="border p-2 text-left font-semibold">ORIGEM X 1ª</th>
                <th className="border p-2 text-left font-semibold">ORIGEM X 2ª</th>
                <th className="border p-2 text-left font-semibold">ORIGEM X 3ª</th>
                <th className="border p-2 text-left font-semibold">AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {displayEntries.map((entry, index) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="border p-2 text-center font-medium text-gray-500">{index + 1}</td>
                  <td className="border p-1">
                    <Input
                      value={entry.prefixo}
                      onChange={(e) => updateEntry(entry.id, "prefixo", e.target.value)}
                      className="h-8"
                      placeholder="Prefixo"
                    />
                  </td>
                  <td className="border p-1">
                    <Input
                      value={entry.placaVagoes}
                      onChange={(e) => updateEntry(entry.id, "placaVagoes", e.target.value)}
                      className="h-8"
                      placeholder="Placa"
                    />
                  </td>
                  <td className="border p-1">
                    <Input
                      type="number"
                      step="0.1"
                      value={entry.pesoOrigem}
                      onChange={(e) => updateEntry(entry.id, "pesoOrigem", e.target.value)}
                      className="h-8"
                      placeholder="kg"
                    />
                  </td>
                  <td className="border p-1">
                    <select
                      value={entry.bitola}
                      onChange={(e) => updateEntry(entry.id, "bitola", e.target.value as any)}
                      className="h-8 w-full rounded border-gray-300 bg-white px-2 text-sm"
                    >
                      <option value="Estreita">Estreita</option>
                      <option value="Larga">Larga</option>
                    </select>
                  </td>
                  <td className="border p-1">
                    <Input
                      type="number"
                      step="0.1"
                      value={entry.primeiraPassagemR300B}
                      onChange={(e) => updateEntry(entry.id, "primeiraPassagemR300B", e.target.value)}
                      className="h-8"
                      placeholder="kg"
                    />
                  </td>
                  <td className="border p-1">
                    <Input
                      type="number"
                      step="0.1"
                      value={entry.segundaPassagemR300C}
                      onChange={(e) => updateEntry(entry.id, "segundaPassagemR300C", e.target.value)}
                      className="h-8"
                      placeholder="kg"
                    />
                  </td>
                  <td className="border p-1">
                    <Input
                      type="number"
                      step="0.1"
                      value={entry.terceiraPassagemR300B}
                      onChange={(e) => updateEntry(entry.id, "terceiraPassagemR300B", e.target.value)}
                      className="h-8"
                      placeholder="kg"
                    />
                  </td>
                  <td className={`border p-2 text-center font-medium ${getDifferenceColor(entry.origemXPrimeira)}`}>
                    {entry.origemXPrimeira.toFixed(1)}
                  </td>
                  <td className={`border p-2 text-center font-medium ${getDifferenceColor(entry.origemXSegunda)}`}>
                    {entry.origemXSegunda.toFixed(1)}
                  </td>
                  <td className={`border p-2 text-center font-medium ${getDifferenceColor(entry.origemXTerceira)}`}>
                    {entry.origemXTerceira.toFixed(1)}
                  </td>
                  <td className="border p-1 text-center">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeEntry(entry.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
