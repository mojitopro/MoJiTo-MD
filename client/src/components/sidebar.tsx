import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Terminal, 
  Puzzle, 
  Users, 
  Download, 
  Bot, 
  BarChart3, 
  Settings,
  X 
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location] = useLocation();

  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      current: location === "/",
    },
    {
      name: "Comandos",
      href: "/commands",
      icon: Terminal,
      current: location === "/commands",
    },
    {
      name: "Plugins",
      href: "/plugins",
      icon: Puzzle,
      current: location === "/plugins",
    },
    {
      name: "Grupos",
      href: "/groups",
      icon: Users,
      current: location === "/groups",
    },
    {
      name: "Descargas",
      href: "/downloads",
      icon: Download,
      current: location === "/downloads",
    },
    {
      name: "IA ChatGPT",
      href: "/ai",
      icon: Bot,
      current: location === "/ai",
    },
    {
      name: "Estadísticas",
      href: "/stats",
      icon: BarChart3,
      current: location === "/stats",
    },
    {
      name: "Configuración",
      href: "/settings",
      icon: Settings,
      current: location === "/settings",
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-dark-card border-r border-dark-border transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="p-6 border-b border-dark-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-whatsapp rounded-lg flex items-center justify-center">
                  <span className="text-dark-surface text-xl font-bold">M</span>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-white">MoJiTo-MD</h1>
                  <p className="text-sm text-gray-400">Bailalo Rocky 🎶</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-white"
                onClick={onClose}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start space-x-3 text-white hover:bg-gray-700 transition-colors",
                      item.current && "bg-whatsapp/20 text-whatsapp hover:bg-whatsapp/30"
                    )}
                    onClick={onClose}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-dark-border">
            <div className="text-xs text-gray-400 text-center">
              <p>MoJiTo-MD v2.1.5</p>
              <p>© 2024 mojitopro</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
