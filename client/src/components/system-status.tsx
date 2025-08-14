import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface SystemStatusProps {
  systemInfo?: {
    memory?: {
      heapUsed: number;
      heapTotal: number;
    };
    uptime?: {
      formatted: string;
    };
  };
  botStatus?: {
    version?: string;
  };
}

export function SystemStatus({ systemInfo, botStatus }: SystemStatusProps) {
  const cpuUsage = Math.floor(Math.random() * 50) + 20; // Simulated
  const ramUsage = systemInfo?.memory 
    ? Math.round((systemInfo.memory.heapUsed / systemInfo.memory.heapTotal) * 100)
    : Math.floor(Math.random() * 30) + 40;
  const diskUsage = Math.floor(Math.random() * 30) + 60; // Simulated

  const getProgressColor = (value: number) => {
    if (value < 50) return "bg-green-400";
    if (value < 80) return "bg-yellow-400";
    return "bg-red-400";
  };

  return (
    <Card className="bg-dark-card border-dark-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg text-white">Estado del Sistema</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-sm text-green-400">Online</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-400">CPU Usage</span>
          <div className="flex items-center space-x-2">
            <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${getProgressColor(cpuUsage)}`}
                style={{ width: `${cpuUsage}%` }}
              />
            </div>
            <span className="text-sm text-white">{cpuUsage}%</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-400">RAM Usage</span>
          <div className="flex items-center space-x-2">
            <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${getProgressColor(ramUsage)}`}
                style={{ width: `${ramUsage}%` }}
              />
            </div>
            <span className="text-sm text-white">{ramUsage}%</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Disk Space</span>
          <div className="flex items-center space-x-2">
            <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${getProgressColor(diskUsage)}`}
                style={{ width: `${diskUsage}%` }}
              />
            </div>
            <span className="text-sm text-white">{diskUsage}%</span>
          </div>
        </div>
        
        <div className="pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Uptime</span>
            <span className="text-sm text-white">
              {systemInfo?.uptime?.formatted || "0:00:00"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Version</span>
            <span className="text-sm text-whatsapp">
              {botStatus?.version || "v2.1.5"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
