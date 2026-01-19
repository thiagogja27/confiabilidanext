"use client"

import { useEffect, useState } from "react"
import { ref, onValue, query, orderByChild } from "firebase/database"
import { database } from "@/lib/firebase"
import { Card } from "@/components/ui/card"

export function Dashboard() {
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const pesagensRef = ref(database, "pesagens")
    const pesagensQuery = query(pesagensRef, orderByChild("timestamp"))

    const unsubscribe = onValue(pesagensQuery, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const entriesArray = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }))
        setEntries(entriesArray.reverse())
      } else {
        setEntries([])
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center">Carregando dados...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="mb-6 text-3xl font-bold text-gray-900">Dashboard de Pesagens</h2>

      <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
        <p className="text-lg">
          Total de Registros: <span className="font-bold">{entries.length}</span>
        </p>
      </div>

      <div className="space-y-4">
        {entries.map((entry) => (
          <Card key={entry.id} className="p-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-sm text-gray-600">Data/Hora</p>
                <p className="font-medium">{entry.dataHora}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tipo de Veículo</p>
                <p className="font-medium">{entry.tipoVeiculo}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Placa</p>
                <p className="font-medium">{entry.placa}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Motorista</p>
                <p className="font-medium">{entry.motorista}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Assistente</p>
                <p className="font-medium">{entry.nomeAssistente}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Turno</p>
                <p className="font-medium">{entry.turnoAssistente}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {entries.length === 0 && <p className="text-center text-gray-500">Nenhum registro encontrado.</p>}
    </div>
  )
}
