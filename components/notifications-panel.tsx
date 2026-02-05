"use client"

import { useState } from "react"
import { ref, remove } from "firebase/database"
import { database } from "@/lib/firebase"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X } from "lucide-react"

interface Notification {
  date: string
  message: string
  pontaTerra?: number
  meio?: number
  pontaMar?: number
  observations?: string
}

interface NotificationsPanelProps {
  open: boolean
  onClose: () => void
  notifications: Record<string, Notification>
  onClearAll: () => void
}

export function NotificationsPanel({ open, onClose, notifications, onClearAll }: NotificationsPanelProps) {
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const viewDetails = (notification: Notification) => {
    setSelectedNotification(notification)
    setShowDetails(true)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Notificações de Ajustes</DialogTitle>
              <Button variant="outline" size="sm" onClick={onClearAll}>
                Apagar Todas
              </Button>
            </div>
          </DialogHeader>

          <ScrollArea className="h-[500px] pr-4">
            {Object.entries(notifications).length === 0 ? (
              <p className="text-center text-gray-500 py-8">Nenhuma notificação</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(notifications).map(([key, notification]) => (
                  <Card
                    key={key}
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => viewDetails(notification)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{notification.message}</p>
                          <p className="text-sm text-gray-500">{notification.date}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            remove(ref(database, `dashboardNotifications/${key}`))
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes do Ajuste</DialogTitle>
          </DialogHeader>

          {selectedNotification && (
            <div className="space-y-4 pt-4">
                <div>
                    <h4 className="font-semibold text-gray-800">Mensagem:</h4>
                    <p className="text-gray-600">{selectedNotification.message}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-gray-800">Data:</h4>
                    <p className="text-gray-600">{selectedNotification.date}</p>
                </div>
                
                <div className="grid grid-cols-3 gap-4 rounded-md border p-4">
                    <div>
                        <h4 className="font-semibold text-gray-800">Ponta Mar</h4>
                        <p className="text-lg font-mono text-blue-600">{selectedNotification.pontaMar ?? 'N/A'} kg</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-800">Meio</h4>
                        <p className="text-lg font-mono text-blue-600">{selectedNotification.meio ?? 'N/A'} kg</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-800">Ponta Terra</h4>
                        <p className="text-lg font-mono text-blue-600">{selectedNotification.pontaTerra ?? 'N/A'} kg</p>
                    </div>
                </div>

                {selectedNotification.observations && (
                    <div>
                        <h4 className="font-semibold text-gray-800">Observações:</h4>
                        <p className="text-gray-600 p-2 border rounded-md bg-gray-50">{selectedNotification.observations}</p>
                    </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
