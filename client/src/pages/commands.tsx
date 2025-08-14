import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Menu, Terminal, Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Commands() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: commands, isLoading } = useQuery({
    queryKey: ['/api/commands'],
  });

  const categories = ["all", "downloads", "media", "ai", "utility", "entertainment", "games"];

  const filteredCommands = (commands as any)?.filter((command: any) => {
    const matchesSearch = command.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         command.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || command.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "downloads": return "📥";
      case "media": return "🎨";
      case "ai": return "🤖";
      case "utility": return "🔧";
      case "entertainment": return "🎭";
      case "games": return "🎮";
      default: return "⚡";
    }
  };

  const getStatusColor = (enabled: boolean) => {
    return enabled ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-surface flex items-center justify-center">
        <div className="text-white">Cargando comandos...</div>
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
                <Terminal className="h-6 w-6 text-whatsapp" />
                <h2 className="text-xl font-semibold text-white">Gestión de Comandos</h2>
              </div>
            </div>
            <Button className="bg-whatsapp hover:bg-whatsapp/80 text-black">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Comando
            </Button>
          </div>
        </header>

        {/* Commands Content */}
        <div className="p-6 space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar comandos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-dark-card border-dark-border text-white"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category 
                    ? "bg-whatsapp text-black hover:bg-whatsapp/80" 
                    : "border-dark-border text-gray-400 hover:text-white hover:border-gray-300"
                  }
                >
                  {category === "all" ? "Todos" : category}
                </Button>
              ))}
            </div>
          </div>

          {/* Commands Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCommands?.map((command: any) => (
              <Card key={command.id} className="bg-dark-card border-dark-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-white flex items-center gap-2">
                      <span className="text-xl">{getCategoryIcon(command.category)}</span>
                      /{command.name}
                    </CardTitle>
                    <Badge className={getStatusColor(command.isEnabled)}>
                      {command.isEnabled ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-400 text-sm">{command.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Categoría:</span>
                      <span className="text-white capitalize">{command.category}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Uso:</span>
                      <code className="text-whatsapp bg-dark-surface px-2 py-1 rounded text-xs">
                        {command.usage}
                      </code>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Usos totales:</span>
                      <span className="text-white font-semibold">{command.usageCount || 0}</span>
                    </div>
                    {command.plugin && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Plugin:</span>
                        <span className="text-purple-400">{command.plugin}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-dark-border text-gray-400 hover:text-white hover:border-gray-300"
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant={command.isEnabled ? "destructive" : "default"}
                      className={command.isEnabled 
                        ? "flex-1" 
                        : "flex-1 bg-whatsapp text-black hover:bg-whatsapp/80"
                      }
                    >
                      {command.isEnabled ? "Desactivar" : "Activar"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCommands?.length === 0 && (
            <div className="text-center py-12">
              <Terminal className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No se encontraron comandos</h3>
              <p className="text-gray-400">Intenta cambiar los filtros de búsqueda</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
