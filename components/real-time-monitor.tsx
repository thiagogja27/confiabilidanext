"use client"

import { useEffect, useState } from "react"
import { ref, onValue, set, onDisconnect, serverTimestamp } from "firebase/database"
import { database, auth } from "@/lib/firebase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff } from "lucide-react"

interface OnlineUser {
  email: string
  timestamp: number
}

interface Alert {
  message: string
  timestamp: number
  severity: "warning" | "error" | "info"
}

export function RealTimeMonitor() {
  const [onlineUsers, setOnlineUsers] = useState<Record<string, OnlineUser>>({})
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [showDisplay, setShowDisplay] = useState(false)
  const [tickerMessage, setTickerMessage] = useState("")

  useEffect(() => {
    const user = auth.currentUser
    if (!user) return

    // Set user as online
    const userStatusRef = ref(database, `onlineUsers/${user.uid}`)
    set(userStatusRef, {
      email: user.email,
      timestamp: serverTimestamp(),
    })

    // Remove user on disconnect
    onDisconnect(userStatusRef).remove()

    // Listen to online users
    const onlineUsersRef = ref(database, "onlineUsers")
    const unsubscribeUsers = onValue(onlineUsersRef, (snapshot) => {
      const data = snapshot.val()
      setOnlineUsers(data || {})
    })

    // Listen to alerts
    const alertsRef = ref(database, "realTimeAlerts")
    const unsubscribeAlerts = onValue(alertsRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const alertsArray = Object.values(data) as Alert[]
        setAlerts(alertsArray.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20))
      }
    })

    // Listen to weighing data for ticker
    const pesagensRef = ref(database, "pesagens")
    const unsubscribePesagens = onValue(pesagensRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const entries = Object.values(data) as any[]
        const recentEntry = entries[entries.length - 1]
        if (recentEntry) {
          updateTicker(recentEntry)
        }
      }
    })

    return () => {
      unsubscribeUsers()
      unsubscribeAlerts()
      unsubscribePesagens()
      set(userStatusRef, null)
    }
  }, [])

  const updateTicker = (entry: any) => {
    const alerts: string[] = []

    Object.entries(entry.balancas || {}).forEach(([balancaId, balancaInfo]: [string, any]) => {
      const { pontaMar = 0, meio = 0, pontaTerra = 0 } = balancaInfo
      const weights = [pontaMar, meio, pontaTerra].filter((w) => w !== 0)
      if (weights.length >= 2) {
        const maxDiff = Math.max(...weights) - Math.min(...weights)
        if (maxDiff > 40) {
          alerts.push(
            `Balança ${balancaId}: Diferença de ${maxDiff.toFixed(1)}kg - Veículo ${entry.placa || "N/A"} - ${entry.dataHora || "N/A"}`,
          )
        }
      }
    })

    if (alerts.length > 0) {
      setTickerMessage(alerts.join(" | "))
    }
  }

  const userCount = Object.keys(onlineUsers).length

  return (
    <div className="space-y-4">
      {/* Ticker de alertas */}
      {tickerMessage && (
        <div className="bg-red-600 text-white py-2 overflow-hidden">
          <div className="animate-marquee whitespace-nowrap">
            <span className="mx-4 font-semibold">ALERTA:</span>
            <span>{tickerMessage}</span>
          </div>
        </div>
      )}

      {/* Botão de display */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setShowDisplay(!showDisplay)}>
          {showDisplay ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
          {showDisplay ? "Ocultar" : "Mostrar"} Display em Tempo Real
        </Button>
      </div>

      {showDisplay && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-foreground">
                <span>Usuários Online</span>
                <Badge variant="secondary" className="bg-green-500 text-white">
                  {userCount}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48">
                {userCount === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Nenhum usuário online</p>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(onlineUsers).map(([uid, user]) => (
                      <div key={uid} className="flex items-center justify-between p-2 bg-accent rounded">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-foreground text-sm">{user.email}</span>
                        </div>
                        <span className="text-muted-foreground text-xs">
                          {new Date(user.timestamp).toLocaleTimeString("pt-BR")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Alertas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-48">
                {alerts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Nenhum alerta registrado</p>
                ) : (
                  <div className="space-y-2">
                    {alerts.map((alert, index) => (
                      <div
                        key={index}
                        className={`p-2 rounded text-sm ${
                          alert.severity === "error"
                            ? "bg-red-500/20 text-red-700 dark:text-red-200"
                            : alert.severity === "warning"
                              ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-200"
                              : "bg-blue-500/20 text-blue-700 dark:text-blue-200"
                        }`}
                      >
                        <p>{alert.message}</p>
                        <p className="text-xs opacity-60 mt-1">{new Date(alert.timestamp).toLocaleString("pt-BR")}</p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
        .animate-marquee {
          display: inline-block;
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  )
}
