import { useQuery } from "@tanstack/react-query";

export function useBotStatus() {
  return useQuery({
    queryKey: ['/api/bot/status'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });
}
