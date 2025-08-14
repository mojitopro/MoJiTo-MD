import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, Terminal, Users, Puzzle, TrendingUp } from "lucide-react";

interface StatsCardsProps {
  stats?: {
    messagesReceived?: number;
    commandsExecuted?: number;
    activeGroups?: number;
    activePlugins?: number;
  };
}

export function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: "Mensajes Hoy",
      value: stats?.messagesReceived?.toLocaleString() || "0",
      icon: MessageCircle,
      color: "blue",
      change: "+12%",
      changeText: "vs ayer",
    },
    {
      title: "Comandos Ejecutados",
      value: stats?.commandsExecuted?.toLocaleString() || "0",
      icon: Terminal,
      color: "purple",
      change: "+8%",
      changeText: "vs ayer",
    },
    {
      title: "Grupos Activos",
      value: stats?.activeGroups?.toString() || "0",
      icon: Users,
      color: "green",
      change: "+3",
      changeText: "nuevos",
    },
    {
      title: "Plugins Activos",
      value: stats?.activePlugins?.toString() || "0",
      icon: Puzzle,
      color: "orange",
      change: "100%",
      changeText: "funcionando",
    },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue":
        return "bg-blue-500/20 text-blue-400";
      case "purple":
        return "bg-purple-500/20 text-purple-400";
      case "green":
        return "bg-whatsapp/20 text-whatsapp";
      case "orange":
        return "bg-orange-500/20 text-orange-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="bg-dark-card border-dark-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{card.title}</p>
                  <p className="text-2xl font-bold text-white">{card.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getColorClasses(card.color)}`}>
                  <Icon className="text-xl" />
                </div>
              </div>
              <div className="flex items-center mt-4 text-sm">
                <TrendingUp className="text-green-400 mr-1 h-4 w-4" />
                <span className="text-green-400">{card.change}</span>
                <span className="text-gray-400 ml-1">{card.changeText}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
