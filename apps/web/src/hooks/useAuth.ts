import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useAuthStore } from "../stores/auth.store";
import type { UserDTO } from "@chat-platform/shared";

interface LoginInput {
  email: string;
  password: string;
}
interface RegisterInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const res = await api.post("/auth/login", input);
      return res.data.data as { user: UserDTO; accessToken: string };
    },
    onSuccess: (data) => setSession(data.user, data.accessToken),
  });
}

export function useRegister() {
  const setSession = useAuthStore((s) => s.setSession);
  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      const res = await api.post("/auth/register", input);
      return res.data.data as { user: UserDTO; accessToken: string };
    },
    onSuccess: (data) => setSession(data.user, data.accessToken),
  });
}

export function useLogout() {
  const clearSession = useAuthStore((s) => s.clearSession);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post("/auth/logout");
    },
    onSuccess: () => {
      clearSession();
      queryClient.clear();
    },
  });
}

export function useUpdateProfile() {
  const updateUser = useAuthStore((s) => s.updateUser);
  return useMutation({
    mutationFn: async (input: { name?: string; status?: string | null; avatar?: string | null }) => {
      const res = await api.patch("/users/me", input);
      return res.data.data as UserDTO;
    },
    onSuccess: (user) => updateUser(user),
  });
}

export function useSearchUsers(query: string) {
  return useQuery({
    queryKey: ["users", "search", query],
    queryFn: async () => {
      const res = await api.get("/users/search", { params: { q: query } });
      return res.data.data as UserDTO[];
    },
    enabled: query.trim().length > 0,
  });
}

export function useAllUsers() {
  return useQuery({
    queryKey: ["users", "all"],
    queryFn: async () => {
      const res = await api.get("/users");
      return res.data.data as UserDTO[];
    },
  });
}
