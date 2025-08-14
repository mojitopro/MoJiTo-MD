import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function FeaturesGrid() {
  const features = [
    { name: "YouTube", icon: "📺", description: "Descargas", color: "blue" },
    { name: "Instagram", icon: "📷", description: "Medios", color: "pink" },
    { name: "TikTok", icon: "🎵", description: "Videos", color: "purple" },
    { name: "ChatGPT", icon: "🤖", description: "IA", color: "green" },
    { name: "Stickers", icon: "🎨", description: "Creación", color: "yellow" },
    { name: "Traductor", icon: "🌐", description: "Idiomas", color: "red" },
    { name: "Juegos", icon: "🎮", description: "Trivia", color: "indigo" },
    { name: "Anti-Spam", icon: "🛡️", description: "Moderación", color: "orange" },
    { name: "Clima", icon: "🌤️", description: "Pronóstico", color: "teal" },
    { name: "Noticias", icon: "📰", description: "Actuales", color: "cyan" },
    { name: "Búsquedas", icon: "🔍", description: "Google", color: "emerald" },
    { name: "Plugins", icon: "🧩", description: "Modular", color: "violet" },
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case "blue": return "bg-blue-500/20 hover:bg-blue-500/30";
      case "pink": return "bg-pink-500/20 hover:bg-pink-500/30";
      case "purple": return "bg-purple-500/20 hover:bg-purple-500/30";
      case "green": return "bg-green-500/20 hover:bg-green-500/30";
      case "yellow": return "bg-yellow-500/20 hover:bg-yellow-500/30";
      case "red": return "bg-red-500/20 hover:bg-red-500/30";
      case "indigo": return "bg-indigo-500/20 hover:bg-indigo-500/30";
      case "orange": return "bg-orange-500/20 hover:bg-orange-500/30";
      case "teal": return "bg-teal-500/20 hover:bg-teal-500/30";
      case "cyan": return "bg-cyan-500/20 hover:bg-cyan-500/30";
      case "emerald": return "bg-emerald-500/20 hover:bg-emerald-500/30";
      case "violet": return "bg-violet-500/20 hover:bg-violet-500/30";
      default: return "bg-gray-500/20 hover:bg-gray-500/30";
    }
  };

  return (
    <Card className="bg-dark-card border-dark-border">
      <CardHeader>
        <CardTitle className="text-lg text-white">Funcionalidades Disponibles</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {features.map((feature) => (
            <div
              key={feature.name}
              className={`p-4 rounded-lg transition-colors cursor-pointer bg-gray-800/50 hover:bg-gray-700/50 ${getColorClasses(feature.color)}`}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3">
                <span className="text-2xl">{feature.icon}</span>
              </div>
              <p className="font-medium text-sm text-white">{feature.name}</p>
              <p className="text-xs text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
