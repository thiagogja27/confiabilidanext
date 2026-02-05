'use client'

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Alert {
  message: string;
  type: 'info' | 'warning' | 'error';
}

interface FloatingAlertProps {
  alerts: Alert[];
}

export function FloatingAlert({ alerts }: FloatingAlertProps) {
  const hasAlerts = alerts.length > 0;

  return (
    <TooltipProvider>
      {/* Se houver alertas, mantém o tooltip aberto. Caso contrário, deixa o comportamento padrão de hover. */}
      <Tooltip open={hasAlerts ? true : undefined} defaultOpen={false}>
        <TooltipTrigger asChild>
          <div
            // AQUI ESTÁ A ALTERAÇÃO DE POSIÇÃO
            className={`fixed top-8 right-8 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-colors duration-300 z-50 ${hasAlerts ? 'animate-pulse' : 'animate-pulse-slow'}`}
            style={{ backgroundColor: hasAlerts ? '#ef4444' : '#22c55e' }} // red-500 or green-500
          ></div>
        </TooltipTrigger>
        {/* AQUI ESTÁ A ALTERAÇÃO DO LADO DO BALÃO */}
        <TooltipContent side="bottom" align="end" className="bg-background border shadow-lg p-4 rounded-md max-w-xs">
          {hasAlerts ? (
            <div>
              <h4 className="font-bold mb-2 text-lg text-red-700">Alertas:</h4>
              <ul className="space-y-1">
                {alerts.map((alert, index) => (
                  <li key={index} className="text-sm text-red-600 font-semibold">
                    {alert.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aguardando entrada de dados</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
