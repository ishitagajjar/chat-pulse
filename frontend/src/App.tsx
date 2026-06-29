import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { Login } from "@/pages/Login";
import { Register } from "@/pages/Register";
import { WorkspaceSelect } from "@/pages/WorkspaceSelect";
import { Chat } from "@/pages/Chat";

function PrivateRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SocketProvider>
      <Outlet />
    </SocketProvider>
  );
}

function PublicRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/workspaces" replace />;
  }

  return <Outlet />;
}

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route element={<PrivateRoute />}>
          <Route path="/workspaces" element={<WorkspaceSelect />} />
          <Route path="/w/:workspaceSlug" element={<Chat />} />
          <Route path="/w/:workspaceSlug/c/:channelId" element={<Chat />} />
          <Route path="/w/:workspaceSlug/dm/:channelId" element={<Chat />} />
        </Route>

        <Route path="*" element={<Navigate to="/workspaces" replace />} />
      </Routes>
    </AuthProvider>
  );
}
