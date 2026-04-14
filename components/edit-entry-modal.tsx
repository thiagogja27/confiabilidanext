'use client'

import { useState } from "react"
import { database } from "@/lib/firebase"
import { ref, update } from "firebase/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Save, Plus, Trash2, RotateCcw } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { v4 as uuidv4 } from 'uuid';

interface DynamicScaleEntry {
  id: string
  prefixo: string
  placaVagoes: string
  pesoOrigem: string
  bitola: "Estreita" | "Larga"
  primeiraPassagemR300B: string
  segundaPassagemR300C: string
  terceiraPassagemR300B: string
  origemXPrimeira: number
  origemXSegunda: number
  origemXTerceira: number
}

interface EditEntryModalProps {
  entry: any
  onClose: () => void
  onSave: () => void
}

const createEmptyEntries = (): DynamicScaleEntry[] => {
  return Array.from({ length: 10 }, () => ({
    id: uuidv4(),
    prefixo: "",
    placaVagoes: "",
    pesoOrigem: "",
    bitola: "Estreita",
    primeiraPassagemR300B: "",
    segundaPassagemR300C: "",
    terceiraPassagemR300B: "",
    origemXPrimeira: 0,
    origemXSegunda: 0,
    origemXTerceira: 0,
  }))
}

export function EditEntryModal({ entry, onClose, onSave }: EditEntryModalProps) {
  const [formData, setFormData] = useState({
    dataHora: entry.dataHora || "",
    tipoVeiculo: entry.tipoVeiculo || "pc",
    tipoVeiculo2: entry.tipoVeiculo2 || "pc",
    placa: entry.placa || "",
    placa2: entry.placa2 || "",
    motorista: entry.motorista || "",
    nomeAssistente: entry.nomeAssistente || "",
    turnoAssistente: entry.turnoAssistente || "turnoA",
    nomeSeguranca: entry.nomeSeguranca || "",
  })

  const [balancas, setBalancas] = useState(entry.balancas || {})
  const [checklist, setChecklist] = useState(entry.checklist || {})
  const [testeEstatico, setTesteEstatico] = useState(entry.testeEstatico || {})

  const [afericaoBalancaDinamica, setAfericaoBalancaDinamica] = useState<DynamicScaleEntry[]>(() => {
    const existingData = entry.afericaoBalancaDinamica
    if (existingData && Array.isArray(existingData) && existingData.length > 0) {
      // Ensure all fields exist, especially 'bitola' which might be missing from old records
      return existingData.map(v => ({
        ...v,
        bitola: v.bitola || "Estreita"
      }))
    }
    return createEmptyEntries()
  })

  const handleSave = async () => {
    const { placa, placa2, motorista, nomeAssistente, nomeSeguranca } = formData;

    if (!placa || !placa2 || !motorista || !nomeAssistente || !nomeSeguranca) {
      alert("Por favor, preencha todos os campos obrigatórios: Placa, Placa 2, Motorista, Nome do Assistente e Nome do Segurança.");
      return;
    }

    try {
      const entryRef = ref(database, `pesagens/${entry.key}`)
      await update(entryRef, {
        ...formData,
        balancas,
        checklist,
        testeEstatico,
        afericaoBalancaDinamica,
        updatedAt: Date.now(),
      })
      alert("Registro atualizado com sucesso!")
      onSave()
      onClose()
    } catch (error) {
      console.error("Erro ao atualizar:", error)
      alert("Erro ao atualizar registro")
    }
  }

  const updateBalanca = (balancaId: string, field: string, value: string) => {
    setBalancas({
      ...balancas,
      [balancaId]: {
        ...balancas[balancaId],
        [field]: Number.parseFloat(value) || 0,
      },
    })
  }

  const removeBalanca = (balancaId: string) => {
    const newBalancas = { ...balancas };
    delete newBalancas[balancaId];
    setBalancas(newBalancas);
  };

  const updateChecklist = (field: string, checked: boolean) => {
    setChecklist({
      ...checklist,
      [field]: checked,
    })
  }

  const updateTesteEstatico = (tipo: string, field: string, value: string) => {
    const numValue = Number.parseFloat(value) || 0
    const currentTest = testeEstatico[tipo] || {}

    const updatedTest = {
      ...currentTest,
      [field]: numValue,
    }

    if (field === "pesoPadrao" || field === "resultado") {
      const pesoPadrao = field === "pesoPadrao" ? numValue : currentTest.pesoPadrao || 0
      const resultado = field === "resultado" ? numValue : currentTest.resultado || 0
      updatedTest.variacaoPeso = resultado - pesoPadrao
      updatedTest.variacaoPercentual =
        pesoPadrao !== 0 ? ((updatedTest.variacaoPeso / pesoPadrao) * 100).toFixed(2) + "%" : "0.00%"
    }

    setTesteEstatico({
      ...testeEstatico,
      [tipo]: updatedTest,
    })
  }

  const addDynamicEntry = () => {
    const newEntry: DynamicScaleEntry = {
      id: uuidv4(),
      prefixo: "",
      placaVagoes: "",
      pesoOrigem: "",
      bitola: "Estreita",
      primeiraPassagemR300B: "",
      segundaPassagemR300C: "",
      terceiraPassagemR300B: "",
      origemXPrimeira: 0,
      origemXSegunda: 0,
      origemXTerceira: 0,
    }
    setAfericaoBalancaDinamica([...afericaoBalancaDinamica, newEntry])
  }

  const removeDynamicEntry = (id: string) => {
    setAfericaoBalancaDinamica(afericaoBalancaDinamica.filter((e) => e.id !== id))
  }

  const resetDynamicEntries = () => {
    setAfericaoBalancaDinamica(createEmptyEntries())
  }

  const updateDynamicEntry = (id: string, field: keyof DynamicScaleEntry, value: string) => {
    const updatedEntries = afericaoBalancaDinamica.map((entry) => {
      if (entry.id === id) {
        const updated = { ...entry, [field]: value }

        // Calculate differences automatically
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
    setAfericaoBalancaDinamica(updatedEntries)
  }

  const getDifferenceColor = (diff: number) => {
    const absDiff = Math.abs(diff)
    if (absDiff <= 40) return "text-green-600 bg-green-50"
    return "text-red-600 bg-red-50"
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-background z-10 border-b">
          <CardTitle className="text-2xl">Editar Confiabilidade</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          {/* Dados do Veículo */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Dados do Veículo</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="dataHora">Data/Hora</Label>
                <Input
                  id="dataHora"
                  type="datetime-local"
                  value={formData.dataHora}
                  onChange={(e) => setFormData({ ...formData, dataHora: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="tipoVeiculo">Tipo de Veículo</Label>
                <select
                  id="tipoVeiculo"
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={formData.tipoVeiculo}
                  onChange={(e) => setFormData({ ...formData, tipoVeiculo: e.target.value })}
                >
                  <option value="pc">PC</option>
                  <option value="caminhao">Caminhão</option>
                  <option value="vagao">Vagão</option>
                </select>
              </div>
              <div>
                <Label htmlFor="tipoVeiculo2">Tipo de Veículo 2</Label>
                <select
                  id="tipoVeiculo2"
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={formData.tipoVeiculo2}
                  onChange={(e) => setFormData({ ...formData, tipoVeiculo2: e.target.value })}
                >
                  <option value="pc">PC</option>
                  <option value="caminhao">Caminhão</option>
                  <option value="vagao">Vagão</option>
                </select>
              </div>
              <div>
                <Label htmlFor="placa">Placa</Label>
                <Input
                  id="placa"
                  value={formData.placa}
                  onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="placa2">Placa 2</Label>
                <Input
                  id="placa2"
                  value={formData.placa2}
                  onChange={(e) => setFormData({ ...formData, placa2: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="motorista">Motorista</Label>
                <Input
                  id="motorista"
                  value={formData.motorista}
                  onChange={(e) => setFormData({ ...formData, motorista: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="nomeAssistente">Nome do Assistente</Label>
                <Input
                  id="nomeAssistente"
                  value={formData.nomeAssistente}
                  onChange={(e) => setFormData({ ...formData, nomeAssistente: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="turnoAssistente">Turno do Assistente</Label>
                <select
                  id="turnoAssistente"
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={formData.turnoAssistente}
                  onChange={(e) => setFormData({ ...formData, turnoAssistente: e.target.value })}
                >
                  <option value="turnoA">Turno A</option>
                  <option value="turnoB">Turno B</option>
                  <option value="turnoC">Turno C</option>
                </select>
              </div>
              <div>
                <Label htmlFor="nomeSeguranca">Nome do Segurança</Label>
                <Input
                  id="nomeSeguranca"
                  value={formData.nomeSeguranca}
                  onChange={(e) => setFormData({ ...formData, nomeSeguranca: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Balanças */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Balanças</h3>
            <div className="space-y-4">
              {Object.entries(balancas).map(([balancaId, balancaData]: [string, any]) => (
                <div key={balancaId} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium">Balança {balancaId}</h4>
                    <Button variant="destructive" size="sm" onClick={() => removeBalanca(balancaId)}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir Balança
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label>Ponta Mar (kg)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={balancaData.pontaMar || 0}
                        onChange={(e) => updateBalanca(balancaId, "pontaMar", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Meio (kg)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={balancaData.meio || 0}
                        onChange={(e) => updateBalanca(balancaId, "meio", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Ponta Terra (kg)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={balancaData.pontaTerra || 0}
                        onChange={(e) => updateBalanca(balancaId, "pontaTerra", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Checklist */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Checklist</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="drenagemBalanca"
                  checked={checklist.drenagemBalanca || false}
                  onCheckedChange={(checked) => updateChecklist("drenagemBalanca", checked as boolean)}
                />
                <Label htmlFor="drenagemBalanca" className="cursor-pointer">
                  Drenagem da Balança
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="plataformaLivre"
                  checked={checklist.plataformaLivre || false}
                  onCheckedChange={(checked) => updateChecklist("plataformaLivre", checked as boolean)}
                />
                <Label htmlFor="plataformaLivre" className="cursor-pointer">
                  Plataforma Livre (ao redor)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="modulosZerados"
                  checked={checklist.modulosZerados || false}
                  onCheckedChange={(checked) => updateChecklist("modulosZerados", checked as boolean)}
                />
                <Label htmlFor="modulosZerados" className="cursor-pointer">
                  Módulos Zerados, Trancados e Imprimindo
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="portasTrancadas"
                  checked={checklist.portasTrancadas || false}
                  onCheckedChange={(checked) => updateChecklist("portasTrancadas", checked as boolean)}
                />
                <Label htmlFor="portasTrancadas" className="cursor-pointer">
                  Portas/Janelas Trancadas
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="fossosCadeados"
                  checked={checklist.fossosCadeados || false}
                  onCheckedChange={(checked) => updateChecklist("fossosCadeados", checked as boolean)}
                />
                <Label htmlFor="fossosCadeados" className="cursor-pointer">
                  Fossos com Cadeados
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="caixasJuncaoLacradas"
                  checked={checklist.caixasJuncaoLacradas || false}
                  onCheckedChange={(checked) => updateChecklist("caixasJuncaoLacradas", checked as boolean)}
                />
                <Label htmlFor="caixasJuncaoLacradas" className="cursor-pointer">
                  Caixas de Junção Lacradas
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="atuacaoCancela"
                  checked={checklist.atuacaoCancela || false}
                  onCheckedChange={(checked) => updateChecklist("atuacaoCancela", checked as boolean)}
                />
                <Label htmlFor="atuacaoCancela" className="cursor-pointer">
                  Atuação da Cancela com 60 Kg
                </Label>
              </div>
            </div>
            <div className="mt-4">
              <Label htmlFor="observacoes">Observações</Label>
              <textarea
                id="observacoes"
                className="w-full rounded-md border border-input bg-background px-3 py-2 min-h-[80px]"
                value={checklist.observacoes || ""}
                onChange={(e) => setChecklist({ ...checklist, observacoes: e.target.value })}
              />
            </div>
          </div>

          {/* Teste Estático */}
          {Object.keys(testeEstatico).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Teste Estático</h3>
              <div className="space-y-4">
                {Object.entries(testeEstatico).map(([tipo, dados]: [string, any]) => (
                  <div key={tipo} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">{tipo}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label>Peso Padrão (kg)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={dados.pesoPadrao || 0}
                          onChange={(e) => updateTesteEstatico(tipo, "pesoPadrao", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Resultado (kg)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={dados.resultado || 0}
                          onChange={(e) => updateTesteEstatico(tipo, "resultado", e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Variação Peso (kg)</Label>
                        <Input
                          type="text"
                          value={Number(dados.variacaoPeso || 0).toFixed(2)}
                          disabled
                          className={
                            Math.abs(dados.variacaoPeso || 0) >= 15
                              ? "font-bold text-red-600"
                              : ""
                          }
                        />
                      </div>
                      <div>
                        <Label>Percentual Variação (%)</Label>
                        <Input type="text" value={dados.variacaoPercentual || "0.00%"} disabled />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Aferição da Balança Dinâmica (10 Vagões)</h3>
              <div className="flex gap-2">
                <Button onClick={resetDynamicEntries} size="sm" variant="outline" className="gap-2 bg-transparent">
                  <RotateCcw className="h-4 w-4" />
                  Resetar
                </Button>
                <Button onClick={addDynamicEntry} size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Vagão
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="border p-2 text-left font-semibold w-8">#</th>
                    <th className="border p-2 text-left font-semibold">PREFIXO</th>
                    <th className="border p-2 text-left font-semibold">PLACA VAGÕES</th>
                    <th className="border p-2 text-left font-semibold">PESO ORIGEM</th>
                    <th className="border p-2 text-left font-semibold">BITOLA</th>
                    <th className="border p-2 text-left font-semibold">1ª R300 B</th>
                    <th className="border p-2 text-left font-semibold">2ª R300 C</th>
                    <th className="border p-2 text-left font-semibold">3ª R300 B</th>
                    <th className="border p-2 text-left font-semibold">ORIG X 1ª</th>
                    <th className="border p-2 text-left font-semibold">ORIG X 2ª</th>
                    <th className="border p-2 text-left font-semibold">ORIG X 3ª</th>
                    <th className="border p-2 text-left font-semibold">AÇÕES</th>
                  </tr>
                </thead>
                <tbody>
                  {afericaoBalancaDinamica.map((vagao, index) => (
                    <tr key={vagao.id} className="hover:bg-muted/50">
                      <td className="border p-2 text-center font-medium text-muted-foreground">{index + 1}</td>
                      <td className="border p-1">
                        <Input
                          value={vagao.prefixo}
                          onChange={(e) => updateDynamicEntry(vagao.id, "prefixo", e.target.value)}
                          className="h-8"
                          placeholder="Prefixo"
                        />
                      </td>
                      <td className="border p-1">
                        <Input
                          value={vagao.placaVagoes}
                          onChange={(e) => updateDynamicEntry(vagao.id, "placaVagoes", e.target.value)}
                          className="h-8"
                          placeholder="Placa"
                        />
                      </td>
                      <td className="border p-1">
                        <Input
                          type="number"
                          step="0.1"
                          value={vagao.pesoOrigem}
                          onChange={(e) => updateDynamicEntry(vagao.id, "pesoOrigem", e.target.value)}
                          className="h-8"
                          placeholder="kg"
                        />
                      </td>
                      <td className="border p-1">
                        <select
                          value={vagao.bitola}
                          onChange={(e) => updateDynamicEntry(vagao.id, "bitola", e.target.value as any)}
                          className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs"
                        >
                          <option value="Estreita">Estreita</option>
                          <option value="Larga">Larga</option>
                        </select>
                      </td>
                      <td className="border p-1">
                        <Input
                          type="number"
                          step="0.1"
                          value={vagao.primeiraPassagemR300B}
                          onChange={(e) => updateDynamicEntry(vagao.id, "primeiraPassagemR300B", e.target.value)}
                          className="h-8"
                          placeholder="kg"
                        />
                      </td>
                      <td className="border p-1">
                        <Input
                          type="number"
                          step="0.1"
                          value={vagao.segundaPassagemR300C}
                          onChange={(e) => updateDynamicEntry(vagao.id, "segundaPassagemR300C", e.target.value)}
                          className="h-8"
                          placeholder="kg"
                        />
                      </td>
                      <td className="border p-1">
                        <Input
                          type="number"
                          step="0.1"
                          value={vagao.terceiraPassagemR300B}
                          onChange={(e) => updateDynamicEntry(vagao.id, "terceiraPassagemR300B", e.target.value)}
                          className="h-8"
                          placeholder="kg"
                        />
                      </td>
                      <td className={`border p-2 text-center font-medium ${getDifferenceColor(vagao.origemXPrimeira)}`}>
                        {vagao.origemXPrimeira.toFixed(1)}
                      </td>
                      <td className={`border p-2 text-center font-medium ${getDifferenceColor(vagao.origemXSegunda)}`}>
                        {vagao.origemXSegunda.toFixed(1)}
                      </td>
                      <td className={`border p-2 text-center font-medium ${getDifferenceColor(vagao.origemXTerceira)}`}>
                        {vagao.origemXTerceira.toFixed(1)}
                      </td>
                      <td className="border p-1 text-center">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeDynamicEntry(vagao.id)}
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
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Salvar Alterações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
