"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, LogOut, Save, FileText, Settings, Bell, Wrench } from "lucide-react"
import { AdjustmentModal } from "@/components/adjustment-modal"
import { NotificationsPanel } from "@/components/notifications-panel"

interface MainMenuProps {
  onLogout: () => void
  onShowDashboard: () => void
  onSaveData: (data?: any) => void
  showDashboard: boolean
}

export function MainMenu({ onLogout, onShowDashboard, onSaveData, showDashboard }: MainMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const simulateWeights = () => {
    alert("Função de simulação de pesos - implementar lógica de teste")
  }

  return (
    <>
      <nav className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <Button variant="outline" size="sm" onClick={() => setIsOpen(!isOpen)}>
              <Menu className="mr-2 h-4 w-4" />
              Menu
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setShowNotifications(true)} title="Ver notificações">
                <Bell className="h-4 w-4" />
              </Button>
            </div>

            {isOpen && (
              <div className="absolute left-0 top-16 z-50 w-full border-b bg-white shadow-lg">
                <div className="container mx-auto flex flex-wrap gap-2 px-4 py-4">
                  {!showDashboard && (
                    <>
                      <Button variant="outline" size="sm" onClick={simulateWeights}>
                        <Settings className="mr-2 h-4 w-4" />
                        Simular Pesos
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => onSaveData()}>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Dados
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setShowAdjustmentModal(true)}>
                        <Wrench className="mr-2 h-4 w-4" />
                        Ajuste
                      </Button>
                    </>
                  )}
                  <Button variant="outline" size="sm" onClick={onShowDashboard}>
                    <FileText className="mr-2 h-4 w-4" />
                    {showDashboard ? "Voltar ao Formulário" : "Consultar Dados"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={onLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      <AdjustmentModal open={showAdjustmentModal} onClose={() => setShowAdjustmentModal(false)} />
      <NotificationsPanel open={showNotifications} onClose={() => setShowNotifications(false)} />
    </>
  )
}
