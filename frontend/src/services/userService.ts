import httpClient from "@/api/httpClient";
import type { ApiResponse, User } from "@/types";

export const userService = {
  async getMe(): Promise<User> {
    const res = await httpClient.get<ApiResponse<User>>("/users/me");
    if (!res.data.IsSuccess || !res.data.Data) {
      throw new Error(res.data.Message);
    }
    return res.data.Data;
  },

  async updateProfile(data: {
    displayName?: string;
    avatarUrl?: string;
  }): Promise<User> {
    const res = await httpClient.put<ApiResponse<User>>("/users/me", data);
    if (!res.data.IsSuccess || !res.data.Data) {
      throw new Error(res.data.Message);
    }
    return res.data.Data;
  },

  async uploadAvatar(file: File): Promise<User> {
    const formData = new FormData();
    formData.append("avatar", file);
    const res = await httpClient.post<ApiResponse<User>>(
      "/users/avatar",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    if (!res.data.IsSuccess || !res.data.Data) {
      throw new Error(res.data.Message);
    }
    return res.data.Data;
  },
};
