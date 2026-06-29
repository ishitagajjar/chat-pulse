import httpClient, { setAccessToken } from "@/api/httpClient";
import type { ApiResponse, AuthResponse, User } from "@/types";

export const authService = {
  async register(
    email: string,
    password: string,
    displayName: string
  ): Promise<AuthResponse> {
    const res = await httpClient.post<ApiResponse<AuthResponse>>(
      "/auth/register",
      { email, password, displayName }
    );
    if (!res.data.IsSuccess || !res.data.Data) {
      throw new Error(res.data.Message);
    }
    setAccessToken(res.data.Data.accessToken);
    return res.data.Data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await httpClient.post<ApiResponse<AuthResponse>>(
      "/auth/login",
      { email, password }
    );
    if (!res.data.IsSuccess || !res.data.Data) {
      throw new Error(res.data.Message);
    }
    setAccessToken(res.data.Data.accessToken);
    return res.data.Data;
  },

  async logout(): Promise<void> {
    await httpClient.post("/auth/logout");
    setAccessToken(null);
  },

  async refresh(): Promise<string | null> {
    const res = await httpClient.post<ApiResponse<{ accessToken: string }>>(
      "/auth/refresh"
    );
    if (!res.data.IsSuccess || !res.data.Data) {
      setAccessToken(null);
      return null;
    }
    setAccessToken(res.data.Data.accessToken);
    return res.data.Data.accessToken;
  },
};

export async function getCurrentUser(): Promise<User | null> {
  try {
    const res = await httpClient.get<ApiResponse<User>>("/users/me");
    if (!res.data.IsSuccess || !res.data.Data) return null;
    return res.data.Data;
  } catch {
    return null;
  }
}
