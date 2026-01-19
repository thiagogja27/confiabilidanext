"use client"

import { useState, useEffect } from "react"
import { database } from "@/lib/firebase"
import { ref, onValue, off, remove } from "firebase/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ChevronDown, ChevronUp, Trash2, Edit, FileSpreadsheet, ArrowLeft, FileText } from "lucide-react"
import { EditEntryModal } from "@/components/edit-entry-modal"
import { ChartsDashboard } from "@/components/charts-dashboard"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { AIAnalyst } from "@/components/ai-analyst" // <-- 1. IMPORTAÇÃO ADICIONADA

interface BalanceReading {
  pontaMar: number
  meio: number
  pontaTerra: number
  diferenca?: number
}

interface ChecklistData {
  drenagemBalanca: { sim?: boolean; nao?: boolean }
  plataformaLivre: { sim?: boolean; nao?: boolean }
  modulosZerados: { sim?: boolean; nao?: boolean }
  portasTrancadas: { sim?: boolean; nao?: boolean }
  fossosCadeados: { sim?: boolean; nao?: boolean }
  caixasJuncaoLacradas: { sim?: boolean; nao?: boolean }
  atuacaoCancela: { sim?: boolean; nao?: boolean }
  observacoes?: string
}

interface StaticTest {
  pesoPadrao: number
  resultado: number
  variacaoPeso: number
  variacaoPercentual: string
}

interface DynamicScaleEntry {
  id: string
  prefixo: string
  placaVagoes: string
  pesoOrigem: string
  bitola: "Estreita" | "Larga" // <-- Nova propriedade
  primeiraPassagemR300B: string
  segundaPassagemR300C: string
  terceiraPassagemR300B: string
  origemXPrimeira: number
  origemXSegunda: number
  origemXTerceira: number
}

interface WeighingEntry {
  key?: string
  dataHora: string
  tipoVeiculo: string
  tipoVeiculo2?: string
  placa: string
  placa2?: string
  motorista?: string
  nomeAssistente: string
  turnoAssistente: string
  nomeSeguranca: string
  balancas: Record<string, BalanceReading>
  checklist: ChecklistData
  testeEstatico?: Record<string, StaticTest>
  afericaoBalancaDinamica?: DynamicScaleEntry[]
}
function calculateSpecificDifferences(entry: WeighingEntry) {
  const differences: {
    pair: string
    pontaMarDiff: string
    meioDiff: string
    pontaTerraDiff: string
  }[] = []
  const balancas = entry.balancas

  if (!balancas) {
    return differences
  }

  const pairs = [
    ["10", "5"],
    ["10", "9"],
    ["10", "1"],
  ]

  pairs.forEach(([balancaA, balancaB]) => {
    const balancaAData = balancas[balancaA]
    const balancaBData = balancas[balancaB]

    if (balancaAData && balancaBData) {
      const pontaMarDiff = Math.abs((balancaAData.pontaMar || 0) - (balancaBData.pontaMar || 0))
      const meioDiff = Math.abs((balancaAData.meio || 0) - (balancaBData.meio || 0))
      const pontaTerraDiff = Math.abs((balancaAData.pontaTerra || 0) - (balancaBData.pontaTerra || 0))

      differences.push({
        pair: `${balancaA} vs ${balancaB}`,
        pontaMarDiff: pontaMarDiff.toFixed(1),
        meioDiff: meioDiff.toFixed(1),
        pontaTerraDiff: pontaTerraDiff.toFixed(1),
      })
    }
  })

  return differences
}


export function AdvancedDashboard({ onBack }: { onBack: () => void }) {
  const [entries, setEntries] = useState<WeighingEntry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<WeighingEntry[]>([])
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set())
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [filterAbove40, setFilterAbove40] = useState(false)
  const [searchPlaca, setSearchPlaca] = useState("")
  const [editingEntry, setEditingEntry] = useState<WeighingEntry | null>(null)
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set())

  const [stats, setStats] = useState({
    total: 0,
    confiaveis: 0,
    naoConfiaveis: 0,
    percentualConfiavel: 0,
    variacaoMedia: 0,
  })

  useEffect(() => {
    const entriesRef = ref(database, "pesagens")
    onValue(entriesRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const entriesArray = Object.entries(data).map(([key, value]: [string, any]) => ({
          key,
          ...value,
        }))
        // Sort by date descending
        entriesArray.sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime())
        setEntries(entriesArray)
      } else {
        setEntries([])
      }
    })

    return () => {
      off(entriesRef)
    }
  }, [])

  useEffect(() => {
    let filtered = entries

    if (startDate) {
      filtered = filtered.filter((entry) => entry.dataHora >= startDate)
    }

    if (endDate) {
      filtered = filtered.filter((entry) => entry.dataHora <= endDate + "T23:59")
    }

    if (filterAbove40) {
      filtered = filtered.filter((entry) => {
        if (!entry.balancas) return false
        return Object.values(entry.balancas).some((balance) => {
          const valores = [balance.pontaMar, balance.meio, balance.pontaTerra].filter(
            (v) => v !== undefined && v !== null,
          )
          if (valores.length < 2) return false
          const max = Math.max(...valores)
          const min = Math.min(...valores)
          return max - min > 40
        })
      })
    }

    if (searchPlaca) {
      const searchUpper = searchPlaca.toUpperCase()
      filtered = filtered.filter((entry) => {
        // Busca pela placa principal ou secundária
        const placaMatch =
          (entry.placa || "").toUpperCase().includes(searchUpper) ||
          (entry.placa2 || "").toUpperCase().includes(searchUpper)
    
        // Busca pelo prefixo dentro da Aferição da Balança Dinâmica
        const prefixoMatch =
          entry.afericaoBalancaDinamica?.some((vagao) =>
            (vagao.prefixo || "").toUpperCase().includes(searchUpper)
          ) || false
          
        // Busca pelo nome do Assistente  
        const assistenteMatch = 
          (entry.nomeAssistente || "").toUpperCase().includes(searchUpper)
    
        return placaMatch || prefixoMatch || assistenteMatch
      })
    }

    setFilteredEntries(filtered)

    calculateStats(filtered)
  }, [entries, startDate, endDate, filterAbove40, searchPlaca])

  const calculateStats = (filteredData: WeighingEntry[]) => {
    let totalBalancas = 0
    let confiaveisCount = 0
    let totalVariacao = 0
    let variacaoCount = 0

    filteredData.forEach((entry) => {
      if (entry.balancas) {
        Object.values(entry.balancas).forEach((balance) => {
          const valores = [balance.pontaMar, balance.meio, balance.pontaTerra].filter(
            (v) => v !== undefined && v !== null && !isNaN(v),
          )
          if (valores.length >= 2) {
            totalBalancas++
            const max = Math.max(...valores)
            const min = Math.min(...valores)
            const diff = max - min
            totalVariacao += diff
            variacaoCount++
            if (diff <= 40) {
              confiaveisCount++
            }
          }
        })
      }
    })

    const percentual = totalBalancas > 0 ? (confiaveisCount / totalBalancas) * 100 : 0
    const mediaVariacao = variacaoCount > 0 ? totalVariacao / variacaoCount : 0

    setStats({
      total: filteredData.length,
      confiaveis: confiaveisCount,
      naoConfiaveis: totalBalancas - confiaveisCount,
      percentualConfiavel: percentual,
      variacaoMedia: mediaVariacao,
    })
  }

  const toggleExpand = (key: string) => {
    setExpandedEntries((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }

  const toggleSelectEntry = (key: string) => {
    setSelectedEntries((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedEntries.size === filteredEntries.length && filteredEntries.length > 0) {
      setSelectedEntries(new Set())
    } else {
      setSelectedEntries(new Set(filteredEntries.map((e) => e.key || e.dataHora)))
    }
  }

  const handleDelete = async (entry: WeighingEntry) => {
    if (!entry.key) return
    if (confirm("Tem certeza que deseja excluir este registro?")) {
      try {
        await remove(ref(database, `pesagens/${entry.key}`))
        alert("Registro excluído com sucesso!")
      } catch (error) {
        console.error("Erro ao excluir:", error)
        alert("Erro ao excluir registro")
      }
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedEntries.size === 0) {
      alert("Selecione pelo menos um registro para excluir")
      return
    }
    if (confirm(`Tem certeza que deseja excluir ${selectedEntries.size} registro(s)?`)) {
      try {
        const promises = Array.from(selectedEntries).map((key) => remove(ref(database, `pesagens/${key}`)))
        await Promise.all(promises)
        setSelectedEntries(new Set())
        alert("Registros excluídos com sucesso!")
      } catch (error) {
        console.error("Erro ao excluir:", error)
        alert("Erro ao excluir registros")
      }
    }
  }

  const calculateDiferenca = (balance: BalanceReading) => {
    const valores = [balance.pontaMar, balance.meio, balance.pontaTerra].filter((v) => v !== undefined && v !== null)
    if (valores.length < 2) return 0
    return Math.max(...valores) - Math.min(...valores)
  }

  const getEntriesToExport = () => {
    if (selectedEntries.size > 0) {
      return filteredEntries.filter((e) => selectedEntries.has(e.key || e.dataHora))
    }
    return filteredEntries
  }

  const exportToExcel = () => {
    const entriesToExport = getEntriesToExport()

    // Arrays para cada aba da planilha
    const pesagensData: any[] = []
    const checklistData: any[] = []
    const balancaDinamicaData: any[] = []
    const testeEstaticoData: any[] = []
    const diferencasEspecificasData: any[] = [] // <--- NOVO ARRAY PARA A NOVA ABA

    entriesToExport.forEach((entry) => {
      const baseInfo = {
        DataHora: entry.dataHora,
        Placa: entry.placa,
        TipoVeiculo: entry.tipoVeiculo,
        TipoVeiculo2: entry.tipoVeiculo2 || "N/A",
        Motorista: entry.motorista || "",
        Assistente: entry.nomeAssistente,
        TurnoAssistente: entry.turnoAssistente,
        Seguranca: entry.nomeSeguranca || "N/A",
      }

      // 1. Coleta de dados de Pesagens (código existente)
      if (entry.balancas && Object.keys(entry.balancas).length > 0) {
        Object.entries(entry.balancas).forEach(([balancaName, bal]) => {
          pesagensData.push({
            ...baseInfo,
            Balanca: `Balança ${balancaName}`,
            PontaMar: bal.pontaMar || 0,
            Meio: bal.meio || 0,
            PontaTerra: bal.pontaTerra || 0,
            Diferenca: calculateDiferenca(bal),
            Status: calculateDiferenca(bal) <= 40 ? "Confiável" : "Não Confiável",
          })
        })
      } else {
        pesagensData.push({ ...baseInfo, Balanca: "-", PontaMar: 0, Meio: 0, PontaTerra: 0, Diferenca: 0, Status: "-" })
      }

      // 2. Coleta de dados do Checklist (código existente)
      checklistData.push({
        DataHora: entry.dataHora,
        Placa: entry.placa,
        DrenagemBalanca: entry.checklist?.drenagemBalanca?.sim ? "Sim" : "Não",
        PlataformaLivre: entry.checklist?.plataformaLivre?.sim ? "Sim" : "Não",
        ModulosZerados: entry.checklist?.modulosZerados?.sim ? "Sim" : "Não",
        PortasTrancadas: entry.checklist?.portasTrancadas?.sim ? "Sim" : "Não",
        FossosCadeados: entry.checklist?.fossosCadeados?.sim ? "Sim" : "Não",
        CaixasJuncaoLacradas: entry.checklist?.caixasJuncaoLacradas?.sim ? "Sim" : "Não",
        AtuacaoCancela: entry.checklist?.atuacaoCancela?.sim ? "Sim" : "Não",
        Observacoes: entry.checklist?.observacoes || "",
      })
      
           // 3. Coleta de dados da Balança Dinâmica (código existente)
           if (entry.afericaoBalancaDinamica && entry.afericaoBalancaDinamica.length > 0) {
            entry.afericaoBalancaDinamica.forEach((vagao, index) => {
              balancaDinamicaData.push({
                DataHora: index === 0 ? entry.dataHora : "",
                NumeroVagao: index + 1,
                Prefixo: vagao.prefixo || "",
                bitola: vagao.bitola || "",
                PlacaVagoes: vagao.placaVagoes || "",
                PesoOrigem: vagao.pesoOrigem || "",
                PrimeiraPassagemR300B: vagao.primeiraPassagemR300B || "",
                SegundaPassagemR300C: vagao.segundaPassagemR300C || "",
                TerceiraPassagemR300B: vagao.terceiraPassagemR300B || "",
                OrigemXPrimeira: vagao.origemXPrimeira || 0,
                OrigemXSegunda: vagao.origemXSegunda || 0,
                OrigemXTerceira: vagao.origemXTerceira || 0,
              })
            })
            balancaDinamicaData.push({})
          }
    

      // 4. Coleta de dados do Teste Estático (código adicionado anteriormente)
      if (entry.testeEstatico && Object.keys(entry.testeEstatico).length > 0) {
        Object.entries(entry.testeEstatico).forEach(([balancaName, teste]) => {
          testeEstaticoData.push({
            DataHora: entry.dataHora,
            Balança: balancaName,
            "Peso Padrão": teste.pesoPadrao || 0,
            Resultado: teste.resultado || 0,
            "Variação Peso": teste.variacaoPeso || 0,
            "Variação %": teste.variacaoPercentual || "0%",
          })
        })
      }

      // =============================================================
      // >>> NOVO BLOCO PARA DIFERENÇAS ESPECÍFICAS <<<
      // =============================================================
      const specificDiffs = calculateSpecificDifferences(entry);
      if (specificDiffs.length > 0) {
        specificDiffs.forEach((diff) => {
          diferencasEspecificasData.push({
            DataHora: entry.dataHora,
            Placa: entry.placa,
            "Par de Balanças": diff.pair,
            "Diferença Ponta Mar (kg)": parseFloat(diff.pontaMarDiff),
            "Diferença Meio (kg)": parseFloat(diff.meioDiff),
            "Diferença Ponta Terra (kg)": parseFloat(diff.pontaTerraDiff),
          });
        });
      }
    })

    // Criação do Workbook e das abas
    const wb = XLSX.utils.book_new()

    // Aba 1: Pesagens
    const ws1 = XLSX.utils.json_to_sheet(pesagensData)
    ws1["!cols"] = [ { wch: 18 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 14 } ]
    XLSX.utils.book_append_sheet(wb, ws1, "Pesagens")

    // Aba 2: Checklist
    const ws2 = XLSX.utils.json_to_sheet(checklistData)
    ws2["!cols"] = [ { wch: 18 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 15 }, { wch: 30 } ]
    XLSX.utils.book_append_sheet(wb, ws2, "Checklist")

    // Aba 3: Balança Dinâmica
    const ws3 = XLSX.utils.json_to_sheet(balancaDinamicaData)
    ws3["!cols"] = [ { wch: 18 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 14 } ]
    XLSX.utils.book_append_sheet(wb, ws3, "Balança Dinâmica")
    
    // Aba 4: Teste Estático
    const ws4 = XLSX.utils.json_to_sheet(testeEstaticoData)
    ws4["!cols"] = [ { wch: 18 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 12 } ]
    XLSX.utils.book_append_sheet(wb, ws4, "Teste Estático")

    // =============================================================
    // >>> NOVA ABA PARA DIFERENÇAS ESPECÍFICAS <<<
    // =============================================================
    const ws5 = XLSX.utils.json_to_sheet(diferencasEspecificasData)
    ws5["!cols"] = [ { wch: 18 }, { wch: 10 }, { wch: 18 }, { wch: 25 }, { wch: 22 }, { wch: 26 } ]
    XLSX.utils.book_append_sheet(wb, ws5, "Diferenças Específicas")

    // Salva o arquivo final com 5 abas
    XLSX.writeFile(wb, `confiabilidade_${new Date().toISOString().split("T")[0]}.xlsx`)
  }


  const exportToPDF = () => {
    const entriesToExport = getEntriesToExport()

    if (entriesToExport.length === 0) {
      alert("Nenhum registro para exportar")
      return
    }

    const doc = new jsPDF({ orientation: "landscape" })

    // --- Página 1: Cabeçalho e Tabela DETALHADA de Pesagens ---
    doc.setFontSize(18)
    doc.text("Relatório de Confiabilidade", 14, 20)
    doc.setFontSize(10)
    doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 28)
    doc.text(`Total de registros: ${entriesToExport.length}`, 14, 34)

    const pesagensRows: any[] = []
    entriesToExport.forEach((entry) => {
      if (entry.balancas && Object.keys(entry.balancas).length > 0) {
        Object.entries(entry.balancas).forEach(([balancaName, bal]) => {
          const diff = calculateDiferenca(bal)
          pesagensRows.push([
            entry.dataHora,
            entry.placa,
            entry.nomeAssistente, // <-- COLUNA ADICIONADA
            entry.turnoAssistente,  // <-- COLUNA ADICIONADA
            balancaName,
            bal.pontaMar || 0,
            bal.meio || 0,
            bal.pontaTerra || 0,
            diff.toFixed(1) + " kg",
            diff <= 40 ? "Confiável" : "Não Confiável",
          ])
        })
      } else {
        pesagensRows.push([entry.dataHora, entry.placa, entry.nomeAssistente, entry.turnoAssistente, "-", "-", "-", "-", "-", "-"])
      }
    })

    autoTable(doc, {
      startY: 42,
      head: [["Data/Hora", "Placa", "Assistente", "Turno", "Balança", "Ponta Mar", "Meio", "Ponta Terra", "Diferença", "Status"]],
      body: pesagensRows,
      theme: "grid",
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [41, 128, 185] },
    })

    // --- Página 2: Checklist ---
    const checklistData: any[] = []
    entriesToExport.forEach((entry) => {
      if (entry.checklist) {
        checklistData.push([
          entry.dataHora,
          entry.placa,
          entry.checklist.drenagemBalanca?.sim ? "Sim" : "Não",
          entry.checklist.plataformaLivre?.sim ? "Sim" : "Não",
          entry.checklist.modulosZerados?.sim ? "Sim" : "Não",
          entry.checklist.portasTrancadas?.sim ? "Sim" : "Não",
          entry.checklist.fossosCadeados?.sim ? "Sim" : "Não",
          entry.checklist.caixasJuncaoLacradas?.sim ? "Sim" : "Não",
          entry.checklist.atuacaoCancela?.sim ? "Sim" : "Não",
          entry.checklist.observacoes || "-",
        ])
      }
    })

    if (checklistData.length > 0) {
      doc.addPage()
      doc.setFontSize(14)
      doc.text("Checklist de Aferição", 14, 20)
      autoTable(doc, {
        startY: 28,
        head: [['Data/Hora', 'Placa', 'Drenagem', 'Plat. Livre', 'Módulos Zerados', 'Portas Trancadas', 'Fossos Cadeados', 'Caixas Lacradas', 'Atuação Cancela', 'Observações']],
        body: checklistData,
        theme: "grid",
        styles: { fontSize: 7, cellPadding: 1 },
        headStyles: { fillColor: [41, 128, 185] },
        columnStyles: { 9: { cellWidth: 40 } },
      })
    }

    // --- Página 3: Balança Dinâmica (se houver dados) ---
    const dinamicaData: any[] = []
    entriesToExport.forEach((entry) => {
      if (entry.afericaoBalancaDinamica && entry.afericaoBalancaDinamica.length > 0) {
        entry.afericaoBalancaDinamica.forEach((vagao) => {
          dinamicaData.push([
            entry.dataHora, vagao.prefixo || "-", vagao.bitola || "-", 
            vagao.placaVagoes || "-", vagao.pesoOrigem || "-",
            vagao.primeiraPassagemR300B || "-", vagao.segundaPassagemR300C || "-",
            vagao.terceiraPassagemR300B || "-", (vagao.origemXPrimeira || 0).toFixed(1),
            (vagao.origemXSegunda || 0).toFixed(1), (vagao.origemXTerceira || 0).toFixed(1),
          ])
        })
      }
    })

    if (dinamicaData.length > 0) {
      doc.addPage()
      doc.setFontSize(14)
      doc.text("Aferição da Balança Dinâmica", 14, 20)
      autoTable(doc, {
        startY: 28,
        head: [["Data/Hora", "Prefixo", "Bitola", "Placa Vagões", "Peso Origem", "1ª R300 B", "2ª R300 C", "3ª R300 B", "Orig x 1ª", "Orig x 2ª", "Orig x 3ª"]],
        body: dinamicaData,
        theme: "grid",
        styles: { fontSize: 7 },
        headStyles: { fillColor: [41, 128, 185] },
      })
    }

    // --- Página 4: Teste Estático (se houver dados) ---
    const testeEstaticoData: any[] = []
    entriesToExport.forEach((entry) => {
      if (entry.testeEstatico && Object.keys(entry.testeEstatico).length > 0) {
        Object.entries(entry.testeEstatico).forEach(([balancaName, teste]) => {
          testeEstaticoData.push([
            entry.dataHora, entry.placa, balancaName,
            teste.pesoPadrao || 0, teste.resultado || 0,
            teste.variacaoPeso || 0, teste.variacaoPercentual || "0%",
          ])
        })
      }
    })

    if (testeEstaticoData.length > 0) {
      doc.addPage()
      doc.setFontSize(14)
      doc.text("Teste Estático", 14, 20)
      autoTable(doc, {
        startY: 28,
        head: [['Data/Hora', 'Placa', 'Balança', 'Peso Padrão', 'Resultado', 'Variação (kg)', 'Variação (%)']],
        body: testeEstaticoData,
        theme: "grid",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
      })
    }

    // --- Página 5: Diferenças Específicas (se houver dados) ---
    const diferencasData: any[] = []
    entriesToExport.forEach((entry) => {
      const specificDiffs = calculateSpecificDifferences(entry)
      if (specificDiffs.length > 0) {
        specificDiffs.forEach(diff => {
          diferencasData.push([
            entry.dataHora, entry.placa, diff.pair,
            diff.pontaMarDiff, diff.meioDiff, diff.pontaTerraDiff,
          ])
        })
      }
    })

    if (diferencasData.length > 0) {
      doc.addPage()
      doc.setFontSize(14)
      doc.text("Diferenças Específicas entre Balanças", 14, 20)
      autoTable(doc, {
        startY: 28,
        head: [['Data/Hora', 'Placa', 'Par de Balanças', 'Dif. Ponta Mar (kg)', 'Dif. Meio (kg)', 'Dif. Ponta Terra (kg)']],
        body: diferencasData,
        theme: "grid",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
      })
    }

    // --- Salva o arquivo PDF ---
    doc.save(`confiabilidade_${new Date().toISOString().split("T")[0]}.pdf`)
  }




  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h2 className="text-2xl font-bold">Registros de Confiabilidade</h2>
        <div></div>
      </div>

      {/* Charts Dashboard */}
      <ChartsDashboard />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="startDate">Data Início</Label>
              <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="endDate">Data Fim</Label>
              <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="searchPlaca">Buscar</Label>
              <Input
                id="searchPlaca"
                type="text"
                placeholder="Digite a Placa, Prefixo e Assistente..."
                value={searchPlaca}
                onChange={(e) => setSearchPlaca(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="filterAbove40"
                  checked={filterAbove40}
                  onCheckedChange={(checked) => setFilterAbove40(checked as boolean)}
                />
                <Label htmlFor="filterAbove40" className="cursor-pointer">
                  Diferença {">"} 40kg
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <AIAnalyst dataContext={entries} />

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Selection Controls */}
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="selectAll"
                  checked={selectedEntries.size === filteredEntries.length && filteredEntries.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <Label htmlFor="selectAll" className="cursor-pointer">
                  Selecionar todos
                </Label>
              </div>
              <span className="text-sm text-muted-foreground">
                {selectedEntries.size > 0 ? `${selectedEntries.size} selecionado(s)` : "Nenhum selecionado"}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              {selectedEntries.size > 0 && (
                <Button variant="destructive" onClick={handleDeleteSelected}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir ({selectedEntries.size})
                </Button>
              )}
              <Button onClick={exportToPDF} className="bg-red-600 hover:bg-red-700">
                <FileText className="mr-2 h-4 w-4" />
                Exportar PDF {selectedEntries.size > 0 && `(${selectedEntries.size})`}
              </Button>
              <Button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700">
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Exportar Excel {selectedEntries.size > 0 && `(${selectedEntries.size})`}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Mostrando {filteredEntries.length} de {entries.length} registros
      </div>

      {/* Entries List */}
      {filteredEntries.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">Nenhum registro encontrado</CardContent>
        </Card>
      ) : (
        filteredEntries.map((entry) => {
          const isExpanded = expandedEntries.has(entry.key || entry.dataHora)
          const isSelected = selectedEntries.has(entry.key || entry.dataHora)

          return (
            <Card
              key={entry.key || entry.dataHora}
              className={`overflow-hidden ${isSelected ? "ring-2 ring-primary" : ""}`}
            >
              <CardHeader className="cursor-pointer" onClick={() => toggleExpand(entry.key || entry.dataHora)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelectEntry(entry.key || entry.dataHora)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div>
                      <CardTitle className="text-lg">{entry.dataHora}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Placa: {entry.placa} | Tipo: {entry.tipoVeiculo} | Assistente: {entry.nomeAssistente}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {entry.balancas && Object.values(entry.balancas).some((bal) => calculateDiferenca(bal) > 40) && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                        Diferença {">"} 40kg
                      </span>
                    )}
                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="border-t">
                  <div className="space-y-6 pt-4">
                    {/* Entry Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Data/Hora:</span> {entry.dataHora}
                      </div>
                      <div>
                        <span className="font-medium">Placa:</span> {entry.placa}
                      </div>
                      {entry.placa2 && (
                        <div>
                          <span className="font-medium">Placa 2:</span> {entry.placa2}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Tipo Veículo:</span> {entry.tipoVeiculo}
                      </div>
                      {entry.tipoVeiculo2 && (
                        <div>
                          <span className="font-medium">Tipo Veículo 2:</span> {entry.tipoVeiculo2}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Motorista:</span> {entry.motorista || "-"}
                      </div>
                      <div>
                        <span className="font-medium">Assistente:</span> {entry.nomeAssistente}
                      </div>
                      <div>
                        <span className="font-medium">Turno:</span> {entry.turnoAssistente}
                      </div>
                      <div>
                        <span className="font-medium">Segurança:</span> {entry.nomeSeguranca || "-"}
                      </div>
                    </div>

                    {/* Balances Table */}
                    {entry.balancas && Object.keys(entry.balancas).length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Balanças</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="bg-muted">
                                <th className="border p-2 text-left">Balança</th>
                                <th className="border p-2 text-center">Ponta Mar</th>
                                <th className="border p-2 text-center">Meio</th>
                                <th className="border p-2 text-center">Ponta Terra</th>
                                <th className="border p-2 text-center">Diferença</th>
                                <th className="border p-2 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(entry.balancas).map(([key, bal]) => {
                                const diff = calculateDiferenca(bal)
                                const isConfiavel = diff <= 40
                                return (
                                  <tr key={key}>
                                    <td className="border p-2">{key}</td>
                                    <td className="border p-2 text-center">{bal.pontaMar || 0}</td>
                                    <td className="border p-2 text-center">{bal.meio || 0}</td>
                                    <td className="border p-2 text-center">{bal.pontaTerra || 0}</td>
                                    <td
                                      className={`border p-2 text-center font-medium ${isConfiavel ? "text-green-600" : "text-red-600"}`}
                                    >
                                      {diff.toFixed(1)} kg
                                    </td>
                                    <td className="border p-2 text-center">
                                      <span
                                        className={`px-2 py-1 rounded-full text-xs ${isConfiavel ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                                      >
                                        {isConfiavel ? "Confiável" : "Não Confiável"}
                                      </span>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
{/* Diferenças Específicas */}
{(() => {
  // Só prossiga se houver balanças neste registro
  if (!entry.balancas || Object.keys(entry.balancas).length === 0) {
    return null;
  }

  const specificDiffs = calculateSpecificDifferences(entry);

  // Se houver diferenças específicas calculadas, exiba os cards
  if (specificDiffs.length > 0) {
    return (
      <div>
        <h4 className="font-semibold mb-2">Diferenças Específicas entre Balanças</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {specificDiffs.map(({ pair, pontaMarDiff, meioDiff, pontaTerraDiff }) => (
            <div key={pair} className="p-2 bg-muted rounded-md border">
              <h5 className="font-medium text-center mb-2">{`Balança ${pair}`}</h5>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Ponta Mar:</span>
                  <span className={parseFloat(pontaMarDiff) > 40 ? "text-red-600 font-bold" : "text-green-600"}>
                    {pontaMarDiff} kg
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Meio:</span>
                  <span className={parseFloat(meioDiff) > 40 ? "text-red-600 font-bold" : "text-green-600"}>
                    {meioDiff} kg
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Ponta Terra:</span>
                  <span className={parseFloat(pontaTerraDiff) > 40 ? "text-red-600 font-bold" : "text-green-600"}>
                    {pontaTerraDiff} kg
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Se não houver diferenças, exiba a mensagem informativa
  return (
    <div>
      <h4 className="font-semibold mb-2">Diferenças Específicas entre Balanças</h4>
      <div className="p-4 bg-muted rounded-md border text-sm text-muted-foreground text-center">
        Não há dados para os pares de balanças (10 vs 05, 10 vs 09, 10 vs 01) neste registro.
      </div>
    </div>
  );
})()}


                    {/* Checklist */}
                    {entry.checklist && (
                      <div>
                        <h4 className="font-semibold mb-2">Checklist</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-3 h-3 rounded-full ${entry.checklist.drenagemBalanca?.sim ? "bg-green-500" : "bg-red-500"}`}
                            ></span>
                            Drenagem Balança
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-3 h-3 rounded-full ${entry.checklist.plataformaLivre?.sim ? "bg-green-500" : "bg-red-500"}`}
                            ></span>
                            Plataforma Livre
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-3 h-3 rounded-full ${entry.checklist.modulosZerados?.sim ? "bg-green-500" : "bg-red-500"}`}
                            ></span>
                            Módulos Zerados
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-3 h-3 rounded-full ${entry.checklist.portasTrancadas?.sim ? "bg-green-500" : "bg-red-500"}`}
                            ></span>
                            Portas Trancadas
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-3 h-3 rounded-full ${entry.checklist.fossosCadeados?.sim ? "bg-green-500" : "bg-red-500"}`}
                            ></span>
                            Fossos Cadeados
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-3 h-3 rounded-full ${entry.checklist.caixasJuncaoLacradas?.sim ? "bg-green-500" : "bg-red-500"}`}
                            ></span>
                            Caixas Junção Lacradas
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-3 h-3 rounded-full ${entry.checklist.atuacaoCancela?.sim ? "bg-green-500" : "bg-red-500"}`}
                            ></span>
                            Atuação Cancela
                          </div>
                        </div>
                        {entry.checklist.observacoes && (
                          <p className="mt-2 text-sm">
                            <span className="font-medium">Observações:</span> {entry.checklist.observacoes}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Static Test */}
                    {entry.testeEstatico && Object.keys(entry.testeEstatico).length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Teste Estático</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="bg-muted">
                                <th className="border p-2 text-left">Balança</th>
                                <th className="border p-2 text-center">Peso Padrão</th>
                                <th className="border p-2 text-center">Resultado</th>
                                <th className="border p-2 text-center">Variação Peso</th>
                                <th className="border p-2 text-center">Variação %</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(entry.testeEstatico).map(([key, teste]) => (
                                <tr key={key}>
                                  <td className="border p-2">{key}</td>
                                  <td className="border p-2 text-center">{teste.pesoPadrao || 0}</td>
                                  <td className="border p-2 text-center">{teste.resultado || 0}</td>
                                  <td className="border p-2 text-center">{teste.variacaoPeso || 0} kg</td>
                                  <td className="border p-2 text-center">{teste.variacaoPercentual || "0%"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Dynamic Scale - Aferição da Balança Dinâmica */}
                    {entry.afericaoBalancaDinamica && entry.afericaoBalancaDinamica.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Aferição da Balança Dinâmica</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm border-collapse">
                            <thead>
                              <tr className="bg-muted">
                                <th className="border p-2 text-center">#</th>
                                <th className="border p-2 text-left">Prefixo</th>
                                <th className="border p-2 text-left">bitola</th>
                                <th className="border p-2 text-left">Placa Vagões</th>
                                <th className="border p-2 text-center">Peso Origem</th>
                                <th className="border p-2 text-center">1ª R300 B</th>
                                <th className="border p-2 text-center">2ª R300 C</th>
                                <th className="border p-2 text-center">3ª R300 B</th>
                                <th className="border p-2 text-center">Orig x 1ª</th>
                                <th className="border p-2 text-center">Orig x 2ª</th>
                                <th className="border p-2 text-center">Orig x 3ª</th>
                              </tr>
                            </thead>
                            <tbody>
                            {entry.afericaoBalancaDinamica.map((vagao, index) => (
                                <tr key={vagao.id || index}>
                                  <td className="border p-2 text-center">{index + 1}</td>
                                  <td className="border p-2">{vagao.prefixo || "-"}</td>
                                  <td className="border p-2 capitalize">
                                    {vagao.bitola || "-"} {/* <--- ESSA LINHA SERÁ ADICIONADA/CORRIGIDA */}
                                  </td>
                                  <td className="border p-2">{vagao.placaVagoes || "-"}</td>
                                  <td className="border p-2 text-center">{vagao.pesoOrigem || "-"}</td>
                                  <td className="border p-2 text-center">{vagao.primeiraPassagemR300B || "-"}</td>
                                  <td className="border p-2 text-center">{vagao.segundaPassagemR300C || "-"}</td>
                                  <td className="border p-2 text-center">{vagao.terceiraPassagemR300B || "-"}</td>
                                  <td
                                    className={`border p-2 text-center font-medium ${Math.abs(vagao.origemXPrimeira || 0) <= 40 ? "text-green-600" : "text-red-600"}`}
                                  >
                                    {(vagao.origemXPrimeira || 0).toFixed(1)}
                                  </td>
                                  <td
                                    className={`border p-2 text-center font-medium ${Math.abs(vagao.origemXSegunda || 0) <= 40 ? "text-green-600" : "text-red-600"}`}
                                  >
                                    {(vagao.origemXSegunda || 0).toFixed(1)}
                                  </td>
                                  <td
                                    className={`border p-2 text-center font-medium ${Math.abs(vagao.origemXTerceira || 0) <= 40 ? "text-green-600" : "text-red-600"}`}
                                  >
                                    {(vagao.origemXTerceira || 0).toFixed(1)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t">
                      <Button variant="outline" size="sm" onClick={() => setEditingEntry(entry)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(entry)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })
      )}

      {/* Edit Modal */}
      {editingEntry && (
  <EditEntryModal
    entry={editingEntry}
    onClose={() => setEditingEntry(null)} // Mantenha esta linha
    onSave={() => setEditingEntry(null)}   // Adicione esta linha
  />
)}

    </div>
  )
}
