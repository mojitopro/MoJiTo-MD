import { Sidebar } from "@/components/sidebar";
import { StatsCards } from "@/components/stats-cards";
import { SystemStatus } from "@/components/system-status";
import { FeaturesGrid } from "@/components/features-grid";
import { useBotStatus } from "@/hooks/use-bot-status";
import { useQuery } from "@tanstack/react-query";
import { Bell, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: botStatus, isLoading } = useBotStatus();

  const { data: popularCommands } = useQuery({
    queryKey: ['/api/commands/popular'],
  });

  const { data: activity } = useQuery({
    queryKey: ['/api/activity'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: systemInfo } = useQuery({
    queryKey: ['/api/system/info'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-surface flex items-center justify-center">
        <div className="text-white">Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-dark-surface">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="flex-1 overflow-y-auto">
        {/* Top Bar */}
        <header className="bg-dark-card border-b border-dark-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-white"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h2 className="text-xl font-semibold text-white">Dashboard Principal</h2>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${(botStatus as any)?.connected ? 'bg-whatsapp animate-pulse' : 'bg-red-400'}`} />
                <span className={`text-sm ${(botStatus as any)?.connected ? 'text-whatsapp' : 'text-red-400'}`}>
                  {(botStatus as any)?.connected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
              <Button variant="ghost" size="icon" className="text-white">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white">
                <User className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-6 space-y-6">
          <StatsCards stats={(botStatus as any)?.stats} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Popular Commands */}
            <div className="bg-dark-card rounded-xl p-6 border border-dark-border">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">Comandos Populares</h3>
                <Button variant="link" className="text-whatsapp hover:text-whatsapp/80 text-sm p-0">
                  Ver todos
                </Button>
              </div>
              <div className="space-y-4">
                {(popularCommands as any)?.slice(0, 3).map((command: any) => (
                  <div key={command.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <span className="text-blue-400 text-sm">/{command.name.slice(0, 2)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-white">/{command.name}</p>
                        <p className="text-xs text-gray-400">{command.description}</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-400">{command.usageCount} usos</span>
                  </div>
                ))}
              </div>
            </div>

            <SystemStatus systemInfo={systemInfo as any} botStatus={botStatus as any} />
          </div>

          <FeaturesGrid />

          {/* Activity Log */}
          <div className="bg-dark-card rounded-xl p-6 border border-dark-border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Actividad Reciente</h3>
              <Button variant="link" className="text-whatsapp hover:text-whatsapp/80 text-sm p-0">
                Ver historial completo
              </Button>
            </div>
            <div className="space-y-4">
              {(activity as any)?.slice(0, 5).map((item: any, index: number) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-800/50">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">
                      <span className="font-medium">{item.user}</span> {item.action}
                    </p>
                    <p className="text-xs text-gray-400">
                      Hace {Math.floor(Math.random() * 30) + 1} minutos • Grupo: {item.group}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-dark-card rounded-xl p-6 border border-dark-border">
            <h3 className="text-lg font-semibold mb-6 text-white">Acciones Rápidas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                className="p-4 h-auto flex-col bg-whatsapp/20 hover:bg-whatsapp/30 border border-whatsapp/30 text-whatsapp"
                variant="outline"
              >
                <div className="text-xl mb-2">🔄</div>
                <div className="font-medium">Reiniciar Bot</div>
                <div className="text-xs opacity-70">Reinicio completo</div>
              </Button>
              
              <Button
                className="p-4 h-auto flex-col bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400"
                variant="outline"
              >
                <div className="text-xl mb-2">🔄</div>
                <div className="font-medium">Actualizar Plugins</div>
                <div className="text-xs opacity-70">Últimas versiones</div>
              </Button>
              
              <Button
                className="p-4 h-auto flex-col bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400"
                variant="outline"
              >
                <div className="text-xl mb-2">💾</div>
                <div className="font-medium">Crear Backup</div>
                <div className="text-xs opacity-70">Respaldo de datos</div>
              </Button>
              
              <Button
                className="p-4 h-auto flex-col bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-400"
                variant="outline"
              >
                <div className="text-xl mb-2">📄</div>
                <div className="font-medium">Ver Logs</div>
                <div className="text-xs opacity-70">Archivos de sistema</div>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
