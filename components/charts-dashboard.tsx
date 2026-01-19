"use client"

import { useEffect, useRef, useState } from "react"
import { database } from "@/lib/firebase"
import { ref, onValue, off } from "firebase/database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle, XCircle, TrendingUp, TrendingDown } from "lucide-react"
import Chart from "chart.js/auto"

interface WeighingEntry {
  dataHora: string
  balancas: Record<
    string,
    {
      pontaMar: number
      meio: number
      pontaTerra: number
    }
  >
}

export function ChartsDashboard() {
  const [entries, setEntries] = useState<Record<string, WeighingEntry>>({})
  const [selectedInterval, setSelectedInterval] = useState(7)
  const weightDiffChartRef = useRef<HTMLCanvasElement>(null)
  const monthlyEntriesChartRef = useRef<HTMLCanvasElement>(null)
  const monthlyVariationsChartRef = useRef<HTMLCanvasElement>(null)
  const weightDiffChart = useRef<Chart | null>(null)
  const monthlyEntriesChart = useRef<Chart | null>(null)
  const monthlyVariationsChart = useRef<Chart | null>(null)

  const [stats, setStats] = useState({
    total: 0,
    confiaveis: 0,
    naoConfiaveis: 0,
    percentualConfiavel: 0,
    variacaoMedia: 0,
  })

  useEffect(() => {
    const pesagensRef = ref(database, "pesagens")

    const unsubscribe = onValue(pesagensRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setEntries(data)
        calculateStats(data)
      }
    })

    return () => off(pesagensRef)
  }, [])

  const calculateStats = (data: Record<string, WeighingEntry>) => {
    let totalBalancas = 0
    let confiaveisCount = 0
    let totalVariacao = 0
    let variacaoCount = 0

    Object.values(data).forEach((entry) => {
      if (entry.balancas) {
        Object.values(entry.balancas).forEach((balance) => {
          const valores = [balance.pontaMar, balance.meio, balance.pontaTerra].filter(
            (v) => v !== undefined && v !== null && !isNaN(Number(v)),
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
      total: Object.keys(data).length,
      confiaveis: confiaveisCount,
      naoConfiaveis: totalBalancas - confiaveisCount,
      percentualConfiavel: percentual,
      variacaoMedia: mediaVariacao,
    })
  }

  useEffect(() => {
    if (Object.keys(entries).length > 0) {
      createCharts()
    }
  }, [entries, selectedInterval])

  const createCharts = () => {
    // Weight Difference Chart
    if (weightDiffChartRef.current) {
      const ctx = weightDiffChartRef.current.getContext("2d")
      if (ctx) {
        if (weightDiffChart.current) {
          weightDiffChart.current.destroy()
        }

        const balanceDiffs = calculateBalanceDifferences()

        weightDiffChart.current = new Chart(ctx, {
          type: "bar",
          data: {
            labels: balanceDiffs.map((d) => `Balança ${d.balanca}`),
            datasets: [
              {
                label: "Diferença de Peso (kg)",
                data: balanceDiffs.map((d) => d.diferenca),
                backgroundColor: "rgba(75, 192, 192, 0.6)",
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: "Diferença (kg)",
                },
              },
            },
          },
        })
      }
    }

    // Monthly Entries Chart
    if (monthlyEntriesChartRef.current) {
      const ctx = monthlyEntriesChartRef.current.getContext("2d")
      if (ctx) {
        if (monthlyEntriesChart.current) {
          monthlyEntriesChart.current.destroy()
        }

        const monthlyReliability = calculateMonthlyReliabilityCount()

        monthlyEntriesChart.current = new Chart(ctx, {
          type: "bar",
          data: {
            labels: Object.keys(monthlyReliability),
            datasets: [
              {
                label: "Confiabilidade",
                data: Object.values(monthlyReliability),
                backgroundColor: "rgba(75, 192, 192, 0.6)",
                borderColor: "rgba(75, 192, 192, 1)",
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: "Número de registros",
                },
              },
              x: {
                title: {
                  display: true,
                  text: "Mês",
                },
              },
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: (context) => {
                    return `Confiabilidades por mês: ${context.parsed.y}`
                  },
                },
              },
            },
          },
        })
      }
    }

    // Monthly Variations Chart
    if (monthlyVariationsChartRef.current) {
      const ctx = monthlyVariationsChartRef.current.getContext("2d")
      if (ctx) {
        if (monthlyVariationsChart.current) {
          monthlyVariationsChart.current.destroy()
        }

        const variationsData = calculateMonthlyVariations()

        monthlyVariationsChart.current = new Chart(ctx, {
          type: "bar",
          data: {
            labels: Object.keys(variationsData),
            datasets: [
              {
                label: "Variações > 40kg por Mês",
                data: Object.values(variationsData),
                backgroundColor: "rgba(255, 99, 132, 0.6)",
                borderColor: "rgba(255, 99, 132, 1)",
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: "Quantidade de Variações",
                },
              },
            },
          },
        })
      }
    }
  }

  const calculateBalanceDifferences = () => {
    const balanceDiffs: { balanca: string; diferenca: number }[] = []
    const balanceAggregates: Record<string, number[]> = {}

    Object.values(entries).forEach((entry) => {
      Object.entries(entry.balancas || {}).forEach(([balancaId, balancaInfo]) => {
        const pontaMar = Number.parseFloat(String(balancaInfo.pontaMar)) || 0
        const meio = Number.parseFloat(String(balancaInfo.meio)) || 0
        const pontaTerra = Number.parseFloat(String(balancaInfo.pontaTerra)) || 0

        const weights = [pontaMar, meio, pontaTerra].filter((w) => w !== 0)
        if (weights.length >= 2) {
          const diff = Math.max(...weights) - Math.min(...weights)
          if (!balanceAggregates[balancaId]) {
            balanceAggregates[balancaId] = []
          }
          balanceAggregates[balancaId].push(diff)
        }
      })
    })

    Object.entries(balanceAggregates).forEach(([balancaId, diffs]) => {
      const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length
      balanceDiffs.push({ balanca: balancaId, diferenca: avgDiff })
    })

    return balanceDiffs.sort((a, b) => Number.parseInt(a.balanca) - Number.parseInt(b.balanca))
  }

  const calculateMonthlyReliabilityCount = () => {
    const monthlyCount: Record<string, number> = {}

    Object.values(entries).forEach((entry) => {
      if (entry.dataHora) {
        const date = new Date(entry.dataHora)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

        Object.values(entry.balancas || {}).forEach((balancaInfo) => {
          const pontaMar = Number.parseFloat(String(balancaInfo.pontaMar)) || 0
          const meio = Number.parseFloat(String(balancaInfo.meio)) || 0
          const pontaTerra = Number.parseFloat(String(balancaInfo.pontaTerra)) || 0

          const weights = [pontaMar, meio, pontaTerra].filter((w) => w !== 0)

          if (weights.length >= 2) {
            const diff = Math.max(...weights) - Math.min(...weights)
            if (diff <= 40) {
              monthlyCount[monthKey] = (monthlyCount[monthKey] || 0) + 1
            }
          }
        })
      }
    })

    return monthlyCount
  }

  const calculateMonthlyVariations = () => {
    const variationsData: Record<string, number> = {}

    Object.values(entries).forEach((entry) => {
      if (entry.dataHora) {
        const date = new Date(entry.dataHora)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

        Object.values(entry.balancas || {}).forEach((balancaInfo) => {
          const pontaMar = Number.parseFloat(String(balancaInfo.pontaMar)) || 0
          const meio = Number.parseFloat(String(balancaInfo.meio)) || 0
          const pontaTerra = Number.parseFloat(String(balancaInfo.pontaTerra)) || 0

          const weights = [pontaMar, meio, pontaTerra].filter((w) => w !== 0)
          if (weights.length >= 2) {
            const diff = Math.max(...weights) - Math.min(...weights)
            if (diff > 40) {
              variationsData[monthKey] = (variationsData[monthKey] || 0) + 1
            }
          }
        })
      }
    })

    return variationsData
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-blue-600 text-white">
          <CardContent className="p-4 text-center">
            <h3 className="text-sm font-medium opacity-90">Total de Registros</h3>
            <p className="text-3xl font-bold mt-2">{stats.total}</p>
          </CardContent>
        </Card>

        <Card className="bg-green-600 text-white">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <h3 className="text-sm font-medium opacity-90">Confiabilidades</h3>
            </div>
            <p className="text-3xl font-bold mt-2">{stats.confiaveis}</p>
            <p className="text-sm opacity-80">{stats.percentualConfiavel.toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card className="bg-red-600 text-white">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              <XCircle className="h-5 w-5" />
              <h3 className="text-sm font-medium opacity-90">taxa de variações acima 40KG</h3>
            </div>
            <p className="text-3xl font-bold mt-2">{stats.naoConfiaveis}</p>
            <p className="text-sm opacity-80">{(100 - stats.percentualConfiavel).toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-600 text-white">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2">
              {stats.variacaoMedia <= 40 ? <TrendingDown className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}
              <h3 className="text-sm font-medium opacity-90">Variação Média</h3>
            </div>
            <p className="text-3xl font-bold mt-2">{stats.variacaoMedia.toFixed(1)} kg</p>
            <p className="text-sm opacity-80">{stats.variacaoMedia <= 40 ? "Dentro do limite" : "Acima do limite"}</p>
          </CardContent>
        </Card>
      </div>

      

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Diferenças de Peso por Balança</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <canvas ref={weightDiffChartRef}></canvas>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Confiabilidade por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <canvas ref={monthlyEntriesChartRef}></canvas>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-md border-white/20 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Variações Acima de 40kg por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <canvas ref={monthlyVariationsChartRef}></canvas>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
