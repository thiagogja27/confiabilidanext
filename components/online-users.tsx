'use client'

import { useState, useEffect } from "react"
import { auth, database } from "@/lib/firebase"
import { ref, onValue, off, onDisconnect, set, serverTimestamp } from "firebase/database"
import { Users, Wifi, WifiOff } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface OnlineUser {
  email: string;
  lastOnline: number;
  isOnline: boolean;
}

export function OnlineUsers() {
  const [onlineUsers, setOnlineUsers] = useState<Record<string, OnlineUser>>({});
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    // Referência para o status do usuário atual
    const userStatusRef = ref(database, `/status/${currentUser.uid}`);

    // Referência para a lista de todos os usuários online
    const statusRef = ref(database, '/status');

    // Definir status online e registrar o tempo
    set(userStatusRef, {
      isOnline: true,
      lastOnline: serverTimestamp(),
      email: currentUser.email,
    });

    // Definir o que acontece quando o usuário desconecta
    onDisconnect(userStatusRef).set({
      isOnline: false,
      lastOnline: serverTimestamp(),
      email: currentUser.email, // Mantém o email para referência
    });

    // Ouvir mudanças na lista de status
    const onStatusChange = onValue(statusRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setOnlineUsers(data);
      }
    });

    // Limpeza ao desmontar o componente
    return () => {
      off(statusRef, 'value', onStatusChange);
      // Não removemos o status ao sair, apenas marcamos como offline
      // para saber a última vez que esteve online.
    };
  }, [currentUser]);

  const activeUsers = Object.values(onlineUsers).filter(user => user.isOnline);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-full hover:bg-gray-200">
          <Users className="h-6 w-6 text-gray-700" />
          {activeUsers.length > 0 && (
            <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
              {activeUsers.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Usuários Online</h4>
            <p className="text-sm text-muted-foreground">
              Usuários ativos no momento.
            </p>
          </div>
          <div className="grid gap-2">
            {activeUsers.length > 0 ? (
              activeUsers.map(user => (
                <div key={user.email} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{user.email.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{user.email}</span>
                  </div>
                  <Wifi className="h-5 w-5 text-green-500" />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum usuário online.</p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
