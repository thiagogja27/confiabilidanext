'use client'

import { useState, useEffect } from "react"
import { signOut } from "firebase/auth"
import { ref, push } from "firebase/database"
import { auth, database } from "@/lib/firebase"
import { MainMenu } from "@/components/main-menu"
import { Checklist } from "@/components/checklist"
import { VehicleForm } from "@/components/vehicle-form"
import { ScaleInputs } from "@/components/scale-inputs"
import { StaticTest } from "@/components/static-test"
import { AdvancedDashboard } from "@/components/advanced-dashboard"
import { DynamicScaleInputs, type DynamicScaleEntry } from "@/components/dynamic-scale-inputs"
import { FloatingAlert } from "@/components/floating-alert"

interface WeighingSystemProps {
  user: any
}

interface Alert {
  message: string;
  type: 'info' | 'warning' | 'error';
}

export function WeighingSystem({ user }: WeighingSystemProps) {
  const [showDashboard, setShowDashboard] = useState(false)
  const [vehicleType, setVehicleType] = useState("pc")
  const [vehicleType2, setVehicleType2] = useState("pc")
  const [scaleData, setScaleData] = useState<Record<number, any>>({})
  const [checklistData, setChecklistData] = useState<any>({})
  const [voiceEnabled, setVoiceEnabled] = useState(true)
  const [selectedScale, setSelectedScale] = useState<string>("all")
  const [staticTestData, setStaticTestData] = useState<any>({})
  const [dynamicScaleEntries, setDynamicScaleEntries] = useState<DynamicScaleEntry[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [formData, setFormData] = useState({
    dataHora: new Date().toISOString().slice(0, 16),
    placa: "",
    placa2: "",
    motorista: "",
    nomeAssistente: "",
    turnoAssistente: "turnoA",
    nomeSeguranca: "",
  })

  useEffect(() => {
    const newAlerts: Alert[] = [];
    const scaleEntries = Object.entries(scaleData);

    // Intra-scale difference check
    scaleEntries.forEach(([scaleNum, data]) => {
        const { pontaMar = 0, meio = 0, pontaTerra = 0 } = data || {};
        const values = [
            { name: 'Ponta Mar', value: pontaMar },
            { name: 'Meio', value: meio },
            { name: 'Ponta Terra', value: pontaTerra }
        ].filter(v => v.value > 0); 

        if (values.length > 1) {
            for (let i = 0; i < values.length; i++) {
                for (let j = i + 1; j < values.length; j++) {
                    const diff = Math.abs(values[i].value - values[j].value);
                    if (diff > 40) { // Threshold
                        const message = `Balança ${scaleNum}: Diferença de ${diff.toFixed(1)}kg entre ${values[i].name} e ${values[j].name}`;
                        newAlerts.push({ message, type: 'error' });
                    }
                }
            }
        }
    });

    // Inter-scale difference check
    const pairsToCompare = [['10', '5'], ['10', '9'], ['10', '1'], ['3', '6']];
    pairsToCompare.forEach(([balancaA, balancaB]) => {
        const dataA = scaleData[balancaA];
        const dataB = scaleData[balancaB];

        if (dataA && dataB) {
            const fields = ['pontaMar', 'meio', 'pontaTerra'];
            fields.forEach(field => {
                const valA = dataA[field] || 0;
                const valB = dataB[field] || 0;
                const diff = valA - valB;

                if (Math.abs(diff) > 40) { // Threshold
                    const fieldName = field.replace('pontaMar', 'Ponta Mar').replace('pontaTerra', 'Ponta Terra');
                    const message = `Balanças ${balancaA} e ${balancaB}: Diferença de ${Math.abs(diff).toFixed(1)}kg no ${fieldName}`;
                    newAlerts.push({ message, type: 'error' });
                }
            });
        }
    });

    setAlerts(newAlerts);

    if (voiceEnabled && newAlerts.length > 0) {
        const uniqueMessages = [...new Set(newAlerts.map(a => a.message))];
        const utteranceText = `Atenção: ${uniqueMessages.join('. ')}`;
        const utterance = new SpeechSynthesisUtterance(utteranceText);
        utterance.lang = 'pt-BR';
        speechSynthesis.speak(utterance);
    }

  }, [scaleData, voiceEnabled]);

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
    }
  }

  const handleSaveData = async (formDataParam?: any) => {
    try {
      const vehicleData = formDataParam || {
        ...formData,
        tipoVeiculo: vehicleType,
        tipoVeiculo2: vehicleType2,
      }

      const pesagemData = {
        ...vehicleData,
        balancas: scaleData,
        checklist: checklistData,
        testeEstatico: staticTestData,
        afericaoBalancaDinamica: dynamicScaleEntries,
        userId: user.uid,
        timestamp: Date.now(),
        dataHora: vehicleData.dataHora || new Date().toISOString().slice(0, 16),
      }

      await push(ref(database, "pesagens"), pesagemData)
      alert("Dados salvos com sucesso!")

      // Reset states
      setScaleData({})
      setChecklistData({})
      setStaticTestData({})
      setDynamicScaleEntries([])
      setFormData({
        dataHora: new Date().toISOString().slice(0, 16),
        placa: "",
        placa2: "",
        motorista: "",
        nomeAssistente: "",
        turnoAssistente: "turnoA",
        nomeSeguranca: "",
      })
    } catch (error) {
      console.error("Erro ao salvar dados:", error)
      alert("Erro ao salvar dados")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MainMenu
        onLogout={handleLogout}
        onShowDashboard={() => setShowDashboard(!showDashboard)}
        onSaveData={handleSaveData}
        showDashboard={showDashboard}
      />

      {showDashboard ? (
        <div className="p-6">
          <AdvancedDashboard onBack={() => setShowDashboard(false)} />
        </div>
      ) : (
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-gray-900">
              Sistema de Registro de Pesagem Ferroviária e Rodoviária
            </h1>
            <p className="mt-2 text-gray-600">Bem-vindo, {user.email}</p>
          </div>

          <div className="mb-6 flex items-center justify-center gap-4">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={voiceEnabled}
                onChange={(e) => setVoiceEnabled(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">Ativar voz</span>
            </label>
            <span className="text-sm text-gray-500">{voiceEnabled ? "Voz Ativada" : "Voz Desativada"}</span>
          </div>

          <Checklist data={checklistData} onChange={setChecklistData} />

          <VehicleForm
            vehicleType={vehicleType}
            vehicleType2={vehicleType2}
            onVehicleTypeChange={setVehicleType}
            onVehicleType2Change={setVehicleType2}
            onSubmit={handleSaveData}
            selectedScale={selectedScale}
            onScaleChange={setSelectedScale}
            formData={formData}
            onFormDataChange={setFormData}
          />

          <StaticTest data={staticTestData} onChange={setStaticTestData} />

          <DynamicScaleInputs entries={dynamicScaleEntries} onEntriesChange={setDynamicScaleEntries} />

          <ScaleInputs
            vehicleType={vehicleType}
            scaleData={scaleData}
            onScaleDataChange={setScaleData}
            selectedScale={selectedScale}
            voiceEnabled={voiceEnabled}
          />
        </div>
      )}
      <FloatingAlert alerts={alerts} />
    </div>
  )
}
