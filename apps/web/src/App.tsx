import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { useSessionBootstrap } from "./hooks/useSessionBootstrap";
import { RequireAuth, RedirectIfAuthed } from "./routes/guards";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { AppLayout } from "./pages/AppLayout";
import { ChatPage } from "./pages/ChatPage";
import { EmptyChatPage } from "./pages/EmptyChatPage";
import { SettingsPage } from "./pages/SettingsPage";
import { useAuthStore } from "./stores/auth.store";

function RootRedirect() {
  const user = useAuthStore((s) => s.user);
  const isHydrating = useAuthStore((s) => s.isHydrating);

  if (isHydrating) return null;

  return <Navigate to={user ? "/app" : "/login"} replace />;
}

export default function App() {
  useSessionBootstrap();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<RedirectIfAuthed />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<EmptyChatPage />} />
              <Route path="chat/:conversationId" element={<ChatPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="profile" element={<SettingsPage />} />
              <Route path="groups" element={<EmptyChatPage />} />
              <Route path="groups/:conversationId" element={<ChatPage />} />
            </Route>
          </Route>

          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
