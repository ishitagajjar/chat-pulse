import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createSocket, type ChatSocket } from "@/lib/socket";
import { useAuth } from "@/contexts/AuthContext";

interface SocketContextValue {
  socket: ChatSocket | null;
  isConnected: boolean;
  connectionError: string | null;
}

const SocketContext = createContext<SocketContextValue | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { accessToken, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<ChatSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<ChatSocket | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const connect = useCallback((token: string) => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const newSocket = createSocket(token);
    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on("connect", () => {
      setIsConnected(true);
      setConnectionError(null);

      heartbeatRef.current = setInterval(() => {
        newSocket.emit("presence:heartbeat");
      }, 30000);
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
    });

    newSocket.on("connect_error", (err) => {
      setConnectionError(err.message);
      setIsConnected(false);
    });

    newSocket.connect();
  }, []);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      connect(accessToken);
    }

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      socketRef.current?.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
  }, [isAuthenticated, accessToken, connect]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, connectionError }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocketContext must be used within SocketProvider");
  }
  return context;
}
