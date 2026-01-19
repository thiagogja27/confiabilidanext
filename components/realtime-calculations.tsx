"use client"

import { useEffect, useState } from "react"

interface RealtimeCalculationsProps {
  scaleData: Record<number, any>
}

export function RealtimeCalculations({ scaleData }: RealtimeCalculationsProps) {
  const [calculations, setCalculations] = useState<any>({})

  useEffect(() => {
    const newCalcs: any = {}
    let maxDiff = 0
    let maxScale = null

    Object.keys(scaleData).forEach((scaleId) => {
      const data = scaleData[Number.parseInt(scaleId)]
      if (data) {
        const pontaMar = Number.parseFloat(data.pontaMar) || 0
        const meio = Number.parseFloat(data.meio) || 0
        const pontaTerra = Number.parseFloat(data.pontaTerra) || 0

        const diff1 = Math.abs(pontaMar - meio)
        const diff2 = Math.abs(pontaMar - pontaTerra)
        const diff3 = Math.abs(meio - pontaTerra)
        const max = Math.max(diff1, diff2, diff3)

        newCalcs[scaleId] = {
          diff1: diff1.toFixed(1),
          diff2: diff2.toFixed(1),
          diff3: diff3.toFixed(1),
          max: max.toFixed(1),
        }

        if (max > maxDiff) {
          maxDiff = max
          maxScale = scaleId
        }
      }
    })

    newCalcs.global = {
      maxDiff: maxDiff.toFixed(1),
      maxScale,
    }

    setCalculations(newCalcs)
  }, [scaleData])

  return (
    <div className="mb-8 rounded-lg border bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-2xl font-bold text-gray-900">Cálculos em Tempo Real</h3>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.keys(calculations).map((scaleId) => {
          if (scaleId === "global") return null
          const calc = calculations[scaleId]

          return (
            <div key={scaleId} className="rounded-lg border bg-gray-50 p-4">
              <h4 className="mb-3 font-bold text-gray-900">Balança {scaleId}</h4>
              <div className="space-y-2 text-sm">
                <p>Diferença Ponta Mar - Meio: {calc.diff1} kg</p>
                <p>Diferença Ponta Mar - Ponta Terra: {calc.diff2} kg</p>
                <p>Diferença Meio - Ponta Terra: {calc.diff3} kg</p>
                <p className="font-semibold text-blue-600">Diferença Máxima: {calc.max} kg</p>
              </div>
            </div>
          )
        })}
      </div>

      {calculations.global && (
        <div className="mt-6 rounded-lg border-2 border-blue-500 bg-blue-50 p-4">
          <h4 className="mb-2 font-bold text-gray-900">Resultado Global</h4>
          <p className="text-lg">
            Maior diferença encontrada: {calculations.global.maxDiff} kg na Balança{" "}
            {calculations.global.maxScale || "N/A"}
          </p>
        </div>
      )}
    </div>
  )
}
