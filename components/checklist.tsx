"use client"

interface ChecklistProps {
  data: any
  onChange: (data: any) => void
}

export function Checklist({ data, onChange }: ChecklistProps) {
  const items = [
    { id: "drenagemBalanca", label: "DRENAGEM DA BALANÇA" },
    { id: "plataformaLivre", label: "PLATAFORMA LIVRE (AO REDOR)" },
    { id: "modulosZerados", label: "MÓDULOS ZERADOS, TRANCADOS e IMPRIMINDO" },
    { id: "portasTrancadas", label: "PORTAS/JANELAS TRANCADAS" },
    { id: "fossosCadeados", label: "FOSSOS COM CADEADOS" },
    { id: "caixasJuncaoLacradas", label: "CAIXAS DE JUNÇÃO LACRADAS" },
    { id: "atuacaoCancela", label: "ATUAÇÃO DA CANCELA COM 60 Kg." },
  ]

  const handleChange = (itemId: string, value: string) => {
    onChange({
      ...data,
      [itemId]: {
        sim: value === "sim",
        nao: value === "nao",
      },
    })
  }

  return (
    <div className="mb-8 rounded-lg border bg-white p-6 shadow-sm">
      <h2 className="mb-6 text-2xl font-bold text-gray-900">CHECK LIST DAS BALANÇAS</h2>

      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between border-b pb-4">
            <label className="font-medium text-gray-700">{item.label}</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name={item.id}
                  value="sim"
                  checked={data[item.id]?.sim || false}
                  onChange={() => handleChange(item.id, "sim")}
                  className="h-4 w-4"
                />
                <span>SIM</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name={item.id}
                  value="nao"
                  checked={data[item.id]?.nao || false}
                  onChange={() => handleChange(item.id, "nao")}
                  className="h-4 w-4"
                />
                <span>NÃO</span>
              </label>
            </div>
          </div>
        ))}

        <div className="mt-6">
          <label className="mb-2 block font-medium text-gray-700">Observações:</label>
          <textarea
            className="w-full rounded-md border border-gray-300 p-2"
            rows={3}
            value={data.observacoes || ""}
            onChange={(e) => onChange({ ...data, observacoes: e.target.value })}
          />
        </div>
      </div>
    </div>
  )
}
