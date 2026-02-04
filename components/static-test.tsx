"use client"

import { useEffect } from "react"

interface StaticTestProps {
  data: any
  onChange: (data: any) => void
}

export function StaticTest({ data, onChange }: StaticTestProps) {
  
  const calcVariacao = (pesoPadrao: number, resultado: number) => {
    const variacao = resultado - pesoPadrao
    const percentual = pesoPadrao !== 0 ? (variacao / pesoPadrao) * 100 : 0
    return { variacao, percentual }
  }

  // Initialize data on mount if it's empty
  useEffect(() => {
    if (!data || Object.keys(data).length === 0) {
      const initialTEG = { pesoPadrao: 9010, resultado: 9015 }
      const initialTEAG = { pesoPadrao: 8270, resultado: 0 }
      const calcTeg = calcVariacao(initialTEG.pesoPadrao, initialTEG.resultado)
      const calcTeag = calcVariacao(initialTEAG.pesoPadrao, initialTEAG.resultado)

      onChange({
        TEG: {
          ...initialTEG,
          variacaoPeso: calcTeg.variacao,
          percentualVariacao: `${calcTeg.percentual.toFixed(2)}%`,
        },
        TEAG: {
          ...initialTEAG,
          variacaoPeso: calcTeag.variacao,
          percentualVariacao: `${calcTeag.percentual.toFixed(2)}%`,
        },
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const updateData = (type: string, field: string, value: number) => {
    const currentData = data[type] || {}
    const updatedTypeData = { ...currentData, [field]: value }
    
    const pesoPadrao = updatedTypeData.pesoPadrao || 0
    const resultado = updatedTypeData.resultado || 0

    const calc = calcVariacao(pesoPadrao, resultado)

    onChange({
      ...data,
      [type]: {
        ...updatedTypeData,
        variacaoPeso: calc.variacao,
        percentualVariacao: `${calc.percentual.toFixed(2)}%`,
      },
    })
  }

  const tegData = data.TEG || { pesoPadrao: 0, resultado: 0, variacaoPeso: 0, percentualVariacao: '0.00%' }
  const teagData = data.TEAG || { pesoPadrao: 0, resultado: 0, variacaoPeso: 0, percentualVariacao: '0.00%' }

  // Re-calculate here to ensure consistency, though it's already in the state
  const teg = calcVariacao(tegData.pesoPadrao, tegData.resultado)
  const teag = calcVariacao(teagData.pesoPadrao, teagData.resultado)

  return (
    <div className="mb-8 rounded-lg border bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-2xl font-bold text-gray-900">Teste Estático</h2>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-3 text-left">BAL/FLUXO</th>
              <th className="p-3 text-left">PESO PADRÃO (kg)</th>
              <th className="p-3 text-left">RESULTADO (kg)</th>
              <th className="p-3 text-left">VARIAÇÃO PESO (kg)</th>
              <th className="p-3 text-left">PORCENTUAL VARIAÇÃO (%)</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="p-3 font-medium">TEG</td>
              <td className="p-3">
                <input
                  type="number"
                  className="w-full rounded border p-1"
                  value={tegData.pesoPadrao || ""}
                  onChange={(e) => updateData("TEG", "pesoPadrao", Number.parseFloat(e.target.value) || 0)}
                />
              </td>
              <td className="p-3">
                <input
                  type="number"
                  className="w-full rounded border p-1"
                  value={tegData.resultado || ""}
                  onChange={(e) => updateData("TEG", "resultado", Number.parseFloat(e.target.value) || 0)}
                />
              </td>
              <td
                className={`p-3 font-medium ${
                  Math.abs(teg.variacao) >= 15 ? "text-red-600" : ""
                }`}
              >
                {teg.variacao.toFixed(2)}
              </td>
              <td
                className={`p-3 font-medium ${
                  Math.abs(teg.percentual) >= 15 ? "text-red-600" : ""
                }`}
              >
                {teg.percentual.toFixed(2)}%
              </td>
            </tr>
            <tr className="border-b">
              <td className="p-3 font-medium">TEAG</td>
              <td className="p-3">
                <input
                  type="number"
                  className="w-full rounded border p-1"
                  value={teagData.pesoPadrao || ""}
                  onChange={(e) => updateData("TEAG", "pesoPadrao", Number.parseFloat(e.target.value) || 0)}
                />
              </td>
              <td className="p-3">
                <input
                  type="number"
                  className="w-full rounded border p-1"
                  value={teagData.resultado || ""}
                  onChange={(e) => updateData("TEAG", "resultado", Number.parseFloat(e.target.value) || 0)}
                />
              </td>
              <td
                className={`p-3 font-medium ${
                  Math.abs(teag.variacao) >= 15 ? "text-red-600" : ""
                }`}
              >
                {teag.variacao.toFixed(2)}
              </td>
              <td
                className={`p-3 font-medium ${
                  Math.abs(teag.percentual) >= 15 ? "text-red-600" : ""
                }`}
              >
                {teag.percentual.toFixed(2)}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
