import httpClient from "@/api/httpClient";
import type { ApiResponse, Workspace, WorkspaceMember } from "@/types";

export const workspaceService = {
  async getAll(): Promise<Workspace[]> {
    const res = await httpClient.get<ApiResponse<Workspace[]>>("/workspaces");
    if (!res.data.IsSuccess || !res.data.Data) {
      throw new Error(res.data.Message);
    }
    return res.data.Data;
  },

  async create(name: string): Promise<Workspace> {
    const res = await httpClient.post<ApiResponse<Workspace>>("/workspaces", {
      name,
    });
    if (!res.data.IsSuccess || !res.data.Data) {
      throw new Error(res.data.Message);
    }
    return res.data.Data;
  },

  async getById(id: string): Promise<Workspace> {
    const res = await httpClient.get<ApiResponse<Workspace>>(
      `/workspaces/${id}`
    );
    if (!res.data.IsSuccess || !res.data.Data) {
      throw new Error(res.data.Message);
    }
    return res.data.Data;
  },

  async getMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const res = await httpClient.get<ApiResponse<WorkspaceMember[]>>(
      `/workspaces/${workspaceId}/members`
    );
    if (!res.data.IsSuccess || !res.data.Data) {
      throw new Error(res.data.Message);
    }
    return res.data.Data;
  },

  async invite(workspaceId: string, email: string): Promise<WorkspaceMember> {
    const res = await httpClient.post<ApiResponse<WorkspaceMember>>(
      `/workspaces/${workspaceId}/invite`,
      { email }
    );
    if (!res.data.IsSuccess || !res.data.Data) {
      throw new Error(res.data.Message);
    }
    return res.data.Data;
  },
};
