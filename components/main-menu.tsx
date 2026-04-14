'use client'

import { useState, useEffect } from "react"
import { ref, onValue, remove } from "firebase/database"
import { auth, database } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Menu, LogOut, Save, FileText, Settings, Bell } from "lucide-react"
import { NotificationsPanel } from "@/components/notifications-panel"
import { OnlineUsers } from "@/components/online-users"

interface MainMenuProps {
  onLogout: () => void
  onShowDashboard: () => void
  onSaveData: (data?: any) => void
  showDashboard: boolean
}

export function MainMenu({ onLogout, onShowDashboard, onSaveData, showDashboard }: MainMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Record<string, any>>({})
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const notificationsRef = ref(database, "dashboardNotifications")
    const unsubscribeNotifications = onValue(notificationsRef, (snapshot) => {
      const data = snapshot.val()
      setNotifications(data || {})
    })

    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (user) {
        setCurrentUserEmail(user.email)
      } else {
        setCurrentUserEmail(null)
      }
    })

    return () => {
      unsubscribeNotifications()
      unsubscribeAuth()
    }
  }, [])

  const simulateWeights = () => {
    alert("Função de simulação de pesos - implementar lógica de teste")
  }

  const handleClearAllNotifications = async () => {
    if (confirm("Deseja realmente apagar todas as notificações?")) {
      const notificationsRef = ref(database, "dashboardNotifications")
      await remove(notificationsRef)
    }
  }

  const notificationCount = Object.keys(notifications).length

  return (
    <>
      <nav className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <Button variant="outline" size="sm" onClick={() => setIsOpen(!isOpen)}>
              <Menu className="mr-2 h-4 w-4" />
              Menu
            </Button>

            <div className="flex items-center gap-2">
              {currentUserEmail === 'thiago_gja27@hotmail.com' && <OnlineUsers />}

              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowNotifications(true)}
                title="Ver notificações"
                className="relative"
              >
                {notificationCount > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                    {notificationCount}
                  </span>
                )}
                <Bell
                  className={`h-4 w-4 ${
                    notificationCount > 0 ? "animate-pulse text-red-500" : ""
                  }`}
                />
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
      
      <NotificationsPanel
        open={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        onClearAll={handleClearAllNotifications}
      />
    </>
  )
}
