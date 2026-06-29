import httpClient from "@/api/httpClient";
import type { ApiResponse, Channel } from "@/types";

export const channelService = {
  async getByWorkspace(workspaceId: string): Promise<Channel[]> {
    const res = await httpClient.get<ApiResponse<Channel[]>>(
      `/workspaces/${workspaceId}/channels`
    );
    if (!res.data.IsSuccess || !res.data.Data) {
      throw new Error(res.data.Message);
    }
    return res.data.Data;
  },

  async create(
    workspaceId: string,
    data: { name: string; description?: string; type?: "PUBLIC" | "PRIVATE" }
  ): Promise<Channel> {
    const res = await httpClient.post<ApiResponse<Channel>>(
      `/workspaces/${workspaceId}/channels`,
      data
    );
    if (!res.data.IsSuccess || !res.data.Data) {
      throw new Error(res.data.Message);
    }
    return res.data.Data;
  },

  async getById(id: string): Promise<Channel> {
    const res = await httpClient.get<ApiResponse<Channel>>(`/channels/${id}`);
    if (!res.data.IsSuccess || !res.data.Data) {
      throw new Error(res.data.Message);
    }
    return res.data.Data;
  },

  async join(id: string): Promise<Channel> {
    const res = await httpClient.post<ApiResponse<Channel>>(
      `/channels/${id}/join`
    );
    if (!res.data.IsSuccess || !res.data.Data) {
      throw new Error(res.data.Message);
    }
    return res.data.Data;
  },

  async leave(id: string): Promise<void> {
    const res = await httpClient.post<ApiResponse<null>>(
      `/channels/${id}/leave`
    );
    if (!res.data.IsSuccess) {
      throw new Error(res.data.Message);
    }
  },

  async createDM(
    workspaceId: string,
    targetUserId: string
  ): Promise<Channel> {
    const res = await httpClient.post<ApiResponse<Channel>>("/channels/dm", {
      workspaceId,
      targetUserId,
    });
    if (!res.data.IsSuccess || !res.data.Data) {
      throw new Error(res.data.Message);
    }
    return res.data.Data;
  },

  async createGroupDM(
    workspaceId: string,
    memberUserIds: string[],
    name?: string
  ): Promise<Channel> {
    const res = await httpClient.post<ApiResponse<Channel>>(
      "/channels/group-dm",
      { workspaceId, memberUserIds, name }
    );
    if (!res.data.IsSuccess || !res.data.Data) {
      throw new Error(res.data.Message);
    }
    return res.data.Data;
  },

  async updateGroupDM(channelId: string, name: string): Promise<Channel> {
    const res = await httpClient.patch<ApiResponse<Channel>>(
      `/channels/${channelId}/group`,
      { name }
    );
    if (!res.data.IsSuccess || !res.data.Data) {
      throw new Error(res.data.Message);
    }
    return res.data.Data;
  },

  async addGroupMember(
    channelId: string,
    data: { userId?: string; email?: string }
  ): Promise<{ groupMembers: Channel["groupMembers"] }> {
    const res = await httpClient.post<
      ApiResponse<{ groupMembers: Channel["groupMembers"] }>
    >(`/channels/${channelId}/members`, data);
    if (!res.data.IsSuccess || !res.data.Data) {
      throw new Error(res.data.Message);
    }
    return res.data.Data;
  },

  async removeGroupMember(
    channelId: string,
    userId: string
  ): Promise<{ left?: boolean }> {
    const res = await httpClient.delete<ApiResponse<{ left?: boolean }>>(
      `/channels/${channelId}/members/${userId}`
    );
    if (!res.data.IsSuccess) {
      throw new Error(res.data.Message);
    }
    return res.data.Data ?? {};
  },
};
