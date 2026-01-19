"use client"

import { useEffect } from "react"

interface StaticTestProps {
  data: any
  onChange: (data: any) => void
}

export function StaticTest({ data, onChange }: StaticTestProps) {
  useEffect(() => {
    if (!data.TEG && !data.TEAG) {
      onChange({
        TEG: {
          pesoPadrao: 9010,
          resultado: 9015,
        },
        TEAG: {
          pesoPadrao: 8270,
          resultado: 0,
        },
      })
    }
  }, [])

  const calcVariacao = (pesoPadrao: number, resultado: number) => {
    const variacao = resultado - pesoPadrao
    const percentual = pesoPadrao !== 0 ? (variacao / pesoPadrao) * 100 : 0
    return { variacao, percentual }
  }

  const tegData = data.TEG || { pesoPadrao: 9010, resultado: 9015 }
  const teagData = data.TEAG || { pesoPadrao: 8270, resultado: 0 }

  const teg = calcVariacao(tegData.pesoPadrao, tegData.resultado)
  const teag = calcVariacao(teagData.pesoPadrao, teagData.resultado)

  const updateData = (type: string, field: string, value: number) => {
    const updatedTypeData = { ...data[type], [field]: value }
    const calc = calcVariacao(updatedTypeData.pesoPadrao, updatedTypeData.resultado)

    onChange({
      ...data,
      [type]: {
        ...updatedTypeData,
        variacaoPeso: calc.variacao,
        percentualVariacao: `${calc.percentual.toFixed(2)}%`,
      },
    })
  }

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
                  value={tegData.pesoPadrao}
                  onChange={(e) => updateData("TEG", "pesoPadrao", Number.parseFloat(e.target.value) || 0)}
                />
              </td>
              <td className="p-3">
                <input
                  type="number"
                  className="w-full rounded border p-1"
                  value={tegData.resultado}
                  onChange={(e) => updateData("TEG", "resultado", Number.parseFloat(e.target.value) || 0)}
                />
              </td>
              <td className="p-3">{teg.variacao.toFixed(2)}</td>
              <td className={`p-3 ${teg.percentual >= 0 ? "text-green-600" : "text-red-600"}`}>
                {teg.percentual.toFixed(2)}%
              </td>
            </tr>
            <tr className="border-b">
              <td className="p-3 font-medium">TEAG</td>
              <td className="p-3">
                <input
                  type="number"
                  className="w-full rounded border p-1"
                  value={teagData.pesoPadrao}
                  onChange={(e) => updateData("TEAG", "pesoPadrao", Number.parseFloat(e.target.value) || 0)}
                />
              </td>
              <td className="p-3">
                <input
                  type="number"
                  className="w-full rounded border p-1"
                  value={teagData.resultado}
                  onChange={(e) => updateData("TEAG", "resultado", Number.parseFloat(e.target.value) || 0)}
                />
              </td>
              <td className="p-3">{teag.variacao.toFixed(2)}</td>
              <td className={`p-3 ${teag.percentual >= 0 ? "text-green-600" : "text-red-600"}`}>
                {teag.percentual.toFixed(2)}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
