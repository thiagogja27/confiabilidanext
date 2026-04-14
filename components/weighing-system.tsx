'use client'

import { useState, useEffect, useCallback } from "react"
import { signOut } from "firebase/auth"
import { ref, push, serverTimestamp } from "firebase/database"
import { auth, database } from "@/lib/firebase"
import { MainMenu } from "@/components/main-menu"
import { Checklist } from "@/components/checklist"
import { VehicleForm } from "@/components/vehicle-form"
import { ScaleInputs } from "@/components/scale-inputs"
import { StaticTest } from "@/components/static-test"
import { AdvancedDashboard } from "@/components/advanced-dashboard"
import { DynamicScaleInputs, type DynamicScaleEntry } from "@/components/dynamic-scale-inputs"
import { FloatingAlert } from "@/components/floating-alert"

// --- NOVAS IMPORTAÇÕES PARA RESEND E UTILS ---
import { sendAlertEmail } from "@/app/actions/send-alert";
import { sendSummaryEmail } from "@/app/actions/send-summary";
import {
  calculateDiferenca,
  type WeighingEntry,
  type BalanceReading,
} from "@/lib/utils";

interface WeighingSystemProps {
  user: any
}

interface Alert {
  message: string;
  type: 'info' | 'warning' | 'error';
}

const roadScales = ['3', '6', '7', '8'];
const railScales = ['1', '2', '5', '9', '10'];

export function WeighingSystem({ user }: WeighingSystemProps) {
  const [showDashboard, setShowDashboard] = useState(false)
  const [vehicleType, setVehicleType] = useState("pc")
  const [vehicleType2, setVehicleType2] = useState("pc")
  const [scaleData, setScaleData] = useState<Record<string, BalanceReading>>({})
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

  const speakAlerts = useCallback((alertsToSpeak: Alert[]) => {
    if (typeof window !== 'undefined' && voiceEnabled && alertsToSpeak.length > 0) {
      speechSynthesis.cancel(); 
      const uniqueMessages = [...new Set(alertsToSpeak.map(a => a.message))];
      const utteranceText = `Atenção: ${uniqueMessages.join('. ')}`;
      const utterance = new SpeechSynthesisUtterance(utteranceText);
      utterance.lang = 'pt-BR';
      speechSynthesis.speak(utterance);
    }
  }, [voiceEnabled]);

  useEffect(() => {
    const newAlerts: Alert[] = [];
    const scaleEntries = Object.entries(scaleData);
    
    const fieldNameMap: { [key: string]: string } = {
       pontaMar: 'Ponta Mar',
       meio: 'Meio',
       pontaTerra: 'Ponta Terra'
    };

    for (let i = 0; i < scaleEntries.length; i++) {
       for (let j = i + 1; j < scaleEntries.length; j++) {
           const [balancaA_Num, dataA] = scaleEntries[i];
           const [balancaB_Num, dataB] = scaleEntries[j];

           const isTypeARail = railScales.includes(balancaA_Num);
           const isTypeBRail = railScales.includes(balancaB_Num);
           const isTypeARoad = roadScales.includes(balancaA_Num);
           const isTypeBRoad = roadScales.includes(balancaB_Num);

           if (!((isTypeARail && isTypeBRail) || (isTypeARoad && isTypeBRoad))) {
               continue;
           }

           if (dataA && dataB) {
               Object.keys(fieldNameMap).forEach(field => {
                   const valA = parseFloat(dataA[field as keyof BalanceReading] as string) || 0;
                   const valB = parseFloat(dataB[field as keyof BalanceReading] as string) || 0;

                   if (valA > 0 || valB > 0) {
                       const diff = Math.abs(valA - valB);

                       if (diff > 40) {
                           const fieldName = fieldNameMap[field];
                           const message = `Divergência de ${diff.toFixed(1)}kg em '${fieldName}' entre Balança ${balancaA_Num} e ${balancaB_Num}`;
                           newAlerts.push({ message, type: 'error' });
                       }
                   }
               });
           }
       }
    }

    setAlerts(newAlerts);
    speakAlerts(newAlerts);

  }, [scaleData, speakAlerts]);

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Erro ao fazer logout:", error)
    }
  }

  const handleSaveData = async (formDataParam?: any) => {
    const vehicleData = formDataParam || {
      ...formData,
      tipoVeiculo: vehicleType,
      tipoVeiculo2: vehicleType2,
    };
    
    const { placa, placa2, motorista, nomeAssistente, nomeSeguranca } = vehicleData;
    
    if (!placa || !placa2 || !motorista || !nomeAssistente || !nomeSeguranca) {
      alert("Por favor, preencha todos os campos obrigatórios: Placa, Placa 2, Motorista, Nome do Assistente e Nome do Segurança.");
      return;
    }

    try {
        const pesagemData: WeighingEntry = {
            ...vehicleData,
            balancas: scaleData,
            checklist: checklistData,
            testeEstatico: staticTestData,
            afericaoBalancaDinamica: dynamicScaleEntries,
            userId: user.uid,
            timestamp: serverTimestamp(),
            dataHora: vehicleData.dataHora || new Date().toISOString().slice(0, 16),
        };

        await push(ref(database, "pesagens"), pesagemData);
        alert("Dados salvos com sucesso!");

        const emailRecipient = process.env.NEXT_PUBLIC_RECIPIENT_EMAIL || 'thiagogja26@gmail.com';

        const problematicBalances = Object.entries(pesagemData.balancas ?? {})
            .map(([id, bal]) => ({ id, diferenca: calculateDiferenca(bal as BalanceReading) }))
            .filter(b => b.diferenca > 40);

        if (problematicBalances.length > 0) {
            console.log(`[ALERTA] ${problematicBalances.length} balança(s) com anomalia. Enviando e-mail(s)...`);
            for (const bal of problematicBalances) {
                const alertResult = await sendAlertEmail({
                    toEmail: emailRecipient,
                    entry: pesagemData,
                    problematicBalance: bal,
                });
                if (alertResult.success) {
                    console.log(`E-mail de alerta para balança ${bal.id} enviado.`);
                } else {
                    console.error(`Falha no envio do alerta para balança ${bal.id}:`, alertResult.message);
                    alert(`Falha no envio do e-mail de alerta para ${bal.id}: ${alertResult.message}`);
                }
            }
        } else {
            console.log("[NORMAL] Nenhuma anomalia. Enviando relatório...");
            const summaryResult = await sendSummaryEmail({
                toEmail: emailRecipient,
                entry: pesagemData,
            });

            if (summaryResult.success) {
                console.log("E-mail de relatório enviado com sucesso.");
            } else {
                console.error("Falha no envio do relatório:", summaryResult.message);
                alert(`Falha no envio do e-mail: ${summaryResult.message}`);
            }
        }

        // Reset states
        const clearedScaleData = Object.keys(scaleData).reduce((acc, key) => {
            acc[key] = { pontaMar: '', meio: '', pontaTerra: '' };
            return acc;
        }, {} as Record<string, BalanceReading>);
        setScaleData(clearedScaleData);
        
        setChecklistData({});
        setStaticTestData({});
        setDynamicScaleEntries([]);
        setFormData({
            dataHora: new Date().toISOString().slice(0, 16),
            placa: "",
            placa2: "",
            motorista: "",
            nomeAssistente: "",
            turnoAssistente: "turnoA",
            nomeSeguranca: "",
        });

    } catch (error) {
        console.error("Erro ao salvar dados:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        alert(`Erro ao salvar dados: ${errorMessage}`);
    }
  };

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
