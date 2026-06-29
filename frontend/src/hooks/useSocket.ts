import { useSocketContext } from "@/contexts/SocketContext";

export function useSocket() {
  const { socket, isConnected } = useSocketContext();
  return { socket, isConnected };
}
