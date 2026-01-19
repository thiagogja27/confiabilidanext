"use client"

import type React from "react"

import { Input } from "@/components/ui/input"

interface VehicleFormProps {
  vehicleType: string
  vehicleType2: string
  onVehicleTypeChange: (type: string) => void
  onVehicleType2Change: (type: string) => void
  onSubmit: (data: any) => void
  selectedScale: string
  onScaleChange: (scale: string) => void
  formData: any
  onFormDataChange: (data: any) => void
}

export function VehicleForm({
  vehicleType,
  vehicleType2,
  onVehicleTypeChange,
  onVehicleType2Change,
  onSubmit,
  selectedScale,
  onScaleChange,
  formData,
  onFormDataChange,
}: VehicleFormProps) {
  // formData is now properly initialized in parent component (weighing-system.tsx)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
      tipoVeiculo: vehicleType,
      tipoVeiculo2: vehicleType2,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="mb-8 rounded-lg border bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Data e Hora: <span className="text-red-500">*</span>
          </label>
          <Input
            type="datetime-local"
            value={formData.dataHora}
            onChange={(e) => onFormDataChange({ ...formData, dataHora: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Tipo de Veículo: <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full rounded-md border border-gray-300 p-2"
            value={vehicleType}
            onChange={(e) => onVehicleTypeChange(e.target.value)}
          >
            <option value="pc">PC</option>
            <option value="caminhao">Caminhão</option>
            <option value="vagao">Vagão</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Tipo de Veículo 2: <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full rounded-md border border-gray-300 p-2"
            value={vehicleType2}
            onChange={(e) => onVehicleType2Change(e.target.value)}
          >
            <option value="pc">PC</option>
            <option value="caminhao">Caminhão</option>
            <option value="vagao">Vagão</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Placa: <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={formData.placa}
            onChange={(e) => onFormDataChange({ ...formData, placa: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Placa 2: <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={formData.placa2}
            onChange={(e) => onFormDataChange({ ...formData, placa2: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Motorista: <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={formData.motorista}
            onChange={(e) => onFormDataChange({ ...formData, motorista: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Nome do Assistente: <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={formData.nomeAssistente}
            onChange={(e) => onFormDataChange({ ...formData, nomeAssistente: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Turno do Assistente: <span className="text-red-500">*</span>
          </label>
          <select
            className="w-full rounded-md border border-gray-300 p-2"
            value={formData.turnoAssistente}
            onChange={(e) => onFormDataChange({ ...formData, turnoAssistente: e.target.value })}
          >
            <option value="turnoA">Turno A</option>
            <option value="turnoB">Turno B</option>
            <option value="turnoC">Turno C</option>
            <option value="turnoD">Turno D</option>
            <option value="turnoE">Turno E</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Nome do Segurança: <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            value={formData.nomeSeguranca}
            onChange={(e) => onFormDataChange({ ...formData, nomeSeguranca: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Mostrar balança:</label>
          <select
            className="w-full rounded-md border border-gray-300 p-2"
            value={selectedScale}
            onChange={(e) => onScaleChange(e.target.value)}
          >
            <option value="all">Todas</option>
            <option value="1">Balança 1</option>
            <option value="2">Balança 2</option>
            <option value="9">Balança 9</option>
            <option value="10">Balança 10</option>
            <option value="5">Balança 5</option>
            <option value="7">Balança 7</option>
            <option value="8">Balança 8</option>
            <option value="3">Balança 3</option>
            <option value="6">Balança 6</option>
          </select>
        </div>
      </div>
    </form>
  )
}
