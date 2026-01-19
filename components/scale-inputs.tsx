"use client"

import { useEffect, useRef } from "react"

interface ScaleInputsProps {
  vehicleType: string
  scaleData: Record<number, any>
  onScaleDataChange: (data: Record<number, any>) => void
  selectedScale: string
  voiceEnabled?: boolean
}

const scales = [
  { id: 1, type: "ferroviaria", name: "Balança 1" },
  { id: 2, type: "ferroviaria", name: "Balança 2" },
  { id: 9, type: "ferroviaria", name: "Balança 9" },
  { id: 10, type: "ferroviaria", name: "Balança 10" },
  { id: 5, type: "ferroviaria", name: "Balança 5" },
  { id: 7, type: "rodoviaria", name: "Balança 7" },
  { id: 8, type: "rodoviaria", name: "Balança 8" },
  { id: 3, type: "rodoviaria", name: "Balança 3" },
  { id: 6, type: "rodoviaria", name: "Balança 6" },
]

export function ScaleInputs({
  vehicleType,
  scaleData,
  onScaleDataChange,
  selectedScale,
  voiceEnabled = true,
}: ScaleInputsProps) {
  const spokenAlertsRef = useRef<Set<string>>(new Set())

  const speakAlert = (message: string, alertKey: string) => {
    if (!voiceEnabled || spokenAlertsRef.current.has(alertKey)) return

    spokenAlertsRef.current.add(alertKey)
    const utterance = new SpeechSynthesisUtterance(message)
    utterance.lang = "pt-BR"
    speechSynthesis.speak(utterance)
  }

  useEffect(() => {
    const relevantScales = [1, 2, 3, 5, 6, 7, 8, 9, 10]

    for (let i = 0; i < relevantScales.length; i++) {
      for (let j = i + 1; j < relevantScales.length; j++) {
        const scale1 = relevantScales[i]
        const scale2 = relevantScales[j]
        const data1 = scaleData[scale1]
        const data2 = scaleData[scale2]

        if (data1 && data2) {
          const pm1 = Number.parseFloat(data1.pontaMar) || 0
          const pm2 = Number.parseFloat(data2.pontaMar) || 0
          const m1 = Number.parseFloat(data1.meio) || 0
          const m2 = Number.parseFloat(data2.meio) || 0
          const pt1 = Number.parseFloat(data1.pontaTerra) || 0
          const pt2 = Number.parseFloat(data2.pontaTerra) || 0

          const diffs = [
            { name: "Ponta Mar", diff: Math.abs(pm1 - pm2) },
            { name: "Meio", diff: Math.abs(m1 - m2) },
            { name: "Ponta Terra", diff: Math.abs(pt1 - pt2) },
          ]

          diffs.forEach(({ name, diff }) => {
            if (diff > 40) {
              const alertKey = `${scale1}-${scale2}-${name}`
              speakAlert(
                `Alerta, diferença detectada entre as balanças ${scale1} e ${scale2}: ${diff.toFixed(1)} quilos na parte ${name}`,
                alertKey,
              )
            }
          })
        }
      }
    }
  }, [scaleData, voiceEnabled])

  const handleInputChange = (scaleId: number, field: string, value: string) => {
    onScaleDataChange({
      ...scaleData,
      [scaleId]: {
        ...scaleData[scaleId],
        [field]: value,
      },
    })
  }

  const filteredScales = scales.filter(
    (scale) => selectedScale === "all" || scale.id === Number.parseInt(selectedScale),
  )

  return (
    <div className="mb-8 space-y-6">
      {filteredScales.map((scale) => {
        const isRodoviaria = scale.type === "rodoviaria"
        const data = scaleData[scale.id] || {}
        const pm = Number.parseFloat(data.pontaMar) || 0
        const m = Number.parseFloat(data.meio) || 0
        const pt = Number.parseFloat(data.pontaTerra) || 0

        const diff1 = Math.abs(pm - m)
        const diff2 = Math.abs(pm - pt)
        const diff3 = Math.abs(m - pt)
        const maxDiff = Math.max(diff1, diff2, diff3)
        const isInTolerance = maxDiff <= 40

        return (
          <div key={scale.id} className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              {scale.name} ({scale.type})
            </h3>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Ponta Mar (kg):</label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={data.pontaMar || ""}
                  onChange={(e) => handleInputChange(scale.id, "pontaMar", e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Meio (kg):</label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={data.meio || ""}
                  onChange={(e) => handleInputChange(scale.id, "meio", e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Ponta Terra (kg):</label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full rounded-md border border-gray-300 p-2"
                  value={data.pontaTerra || ""}
                  onChange={(e) => handleInputChange(scale.id, "pontaTerra", e.target.value)}
                />
              </div>
            </div>

            {isRodoviaria && (
              <p className="mt-4 text-sm font-semibold text-orange-600">
                Esta balança requer acompanhamento do segurança.
              </p>
            )}

            <div className="mt-4 flex items-center gap-4">
              <div className="flex gap-2">
                <div
                  className={`h-6 w-6 rounded-full ${!isInTolerance ? "bg-red-500 shadow-lg shadow-red-500/50" : "bg-gray-300"}`}
                  title="Fora de tolerância"
                />
                <div
                  className={`h-6 w-6 rounded-full ${isInTolerance ? "bg-green-500 shadow-lg shadow-green-500/50" : "bg-gray-300"}`}
                  title="Dentro da tolerância"
                />
              </div>
              <span className="text-sm text-gray-600">
                Diferença máxima:{" "}
                <span className={maxDiff > 40 ? "font-bold text-red-600" : "font-bold text-green-600"}>
                  {maxDiff.toFixed(1)} kg
                </span>
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
