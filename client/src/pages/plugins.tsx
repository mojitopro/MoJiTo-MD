import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Menu, Puzzle, Search, Plus, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Plugins() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: plugins, isLoading } = useQuery({
    queryKey: ['/api/plugins'],
  });

  const filteredPlugins = (plugins as any)?.filter((plugin: any) => {
    return plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           plugin.description.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getPluginIcon = (name: string) => {
    switch (name) {
      case "youtube-downloader": return "📺";
      case "sticker-maker": return "🎨";
      case "ai-chatgpt": return "🤖";
      case "anti-spam": return "🛡️";
      case "welcome-message": return "👋";
      case "auto-responder": return "🔄";
      case "media-converter": return "🔄";
      case "weather-info": return "🌤️";
      case "translator": return "🌐";
      case "meme-generator": return "😂";
      default: return "🧩";
    }
  };

  const getStatusColor = (enabled: boolean) => {
    return enabled ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-surface flex items-center justify-center">
        <div className="text-white">Cargando plugins...</div>
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
              <div className="flex items-center space-x-2">
                <Puzzle className="h-6 w-6 text-whatsapp" />
                <h2 className="text-xl font-semibold text-white">Gestión de Plugins</h2>
              </div>
            </div>
            <Button className="bg-whatsapp hover:bg-whatsapp/80 text-black">
              <Plus className="h-4 w-4 mr-2" />
              Instalar Plugin
            </Button>
          </div>
        </header>

        {/* Plugins Content */}
        <div className="p-6 space-y-6">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar plugins..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-dark-card border-dark-border text-white"
            />
          </div>

          {/* Plugins Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlugins?.map((plugin: any) => (
              <Card key={plugin.id} className="bg-dark-card border-dark-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      <span className="text-xl">{getPluginIcon(plugin.name)}</span>
                      {plugin.name}
                    </CardTitle>
                    <Badge className={getStatusColor(plugin.isEnabled)}>
                      {plugin.isEnabled ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-400 text-sm">{plugin.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Versión:</span>
                      <span className="text-white font-mono">{plugin.version}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Instalado:</span>
                      <span className="text-white">
                        {new Date(plugin.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Estado:</span>
                      <span className={plugin.isEnabled ? "text-green-400" : "text-red-400"}>
                        {plugin.isEnabled ? "Funcionando" : "Desactivado"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-dark-border text-gray-400 hover:text-white hover:border-gray-300"
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Config
                    </Button>
                    <Button
                      size="sm"
                      variant={plugin.isEnabled ? "destructive" : "default"}
                      className={plugin.isEnabled 
                        ? "flex-1" 
                        : "flex-1 bg-whatsapp text-black hover:bg-whatsapp/80"
                      }
                    >
                      {plugin.isEnabled ? "Desactivar" : "Activar"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredPlugins?.length === 0 && (
            <div className="text-center py-12">
              <Puzzle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No se encontraron plugins</h3>
              <p className="text-gray-400">Intenta cambiar el término de búsqueda</p>
            </div>
          )}

          {/* Plugin Store Section */}
          <div className="bg-dark-card rounded-xl p-6 border border-dark-border">
            <h3 className="text-lg font-semibold text-white mb-4">Tienda de Plugins</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">🎵</span>
                  <h4 className="font-medium text-white">Music Bot Pro</h4>
                  <Badge className="bg-blue-500/20 text-blue-400">Nuevo</Badge>
                </div>
                <p className="text-sm text-gray-400 mb-3">Plugin avanzado para música con Spotify integration</p>
                <Button size="sm" className="bg-whatsapp text-black hover:bg-whatsapp/80">
                  Instalar
                </Button>
              </div>

              <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">📊</span>
                  <h4 className="font-medium text-white">Analytics Plus</h4>
                  <Badge className="bg-purple-500/20 text-purple-400">Popular</Badge>
                </div>
                <p className="text-sm text-gray-400 mb-3">Estadísticas avanzadas y reportes detallados</p>
                <Button size="sm" className="bg-whatsapp text-black hover:bg-whatsapp/80">
                  Instalar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
