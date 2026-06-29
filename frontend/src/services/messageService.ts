import httpClient from "@/api/httpClient";
import type { ApiResponse, Message } from "@/types";

export interface UploadResult {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  type: "IMAGE" | "FILE";
}

export interface ThreadData {
  parent: Message;
  replies: Message[];
  replyCount: number;
}

export const messageService = {
  async getByChannel(
    channelId: string,
    before?: string,
    limit = 50
  ): Promise<Message[]> {
    const params = new URLSearchParams();
    if (before) params.set("before", before);
    params.set("limit", String(limit));

    const res = await httpClient.get<ApiResponse<Message[]>>(
      `/channels/${channelId}/messages?${params}`
    );
    if (!res.data.IsSuccess || !res.data.Data) {
      throw new Error(res.data.Message);
    }
    return res.data.Data;
  },

  async uploadFile(channelId: string, file: File): Promise<UploadResult> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await httpClient.post<ApiResponse<UploadResult>>(
      `/channels/${channelId}/messages/upload`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    if (!res.data.IsSuccess || !res.data.Data) {
      throw new Error(res.data.Message);
    }
    return res.data.Data;
  },

  async getThreadReplies(messageId: string): Promise<ThreadData> {
    const res = await httpClient.get<ApiResponse<ThreadData>>(
      `/messages/${messageId}/replies`
    );
    if (!res.data.IsSuccess || !res.data.Data) {
      throw new Error(res.data.Message);
    }
    return res.data.Data;
  },

  async create(
    channelId: string,
    data: {
      content: string;
      type?: string;
      fileUrl?: string;
      fileName?: string;
      fileSize?: number;
      parentId?: string;
    }
  ): Promise<Message> {
    const res = await httpClient.post<ApiResponse<Message>>(
      `/channels/${channelId}/messages`,
      data
    );
    if (!res.data.IsSuccess || !res.data.Data) {
      throw new Error(res.data.Message);
    }
    return res.data.Data;
  },

  async update(id: string, content: string): Promise<Message> {
    const res = await httpClient.put<ApiResponse<Message>>(`/messages/${id}`, {
      content,
    });
    if (!res.data.IsSuccess || !res.data.Data) {
      throw new Error(res.data.Message);
    }
    return res.data.Data;
  },

  async delete(id: string): Promise<void> {
    const res = await httpClient.delete<ApiResponse<null>>(`/messages/${id}`);
    if (!res.data.IsSuccess) {
      throw new Error(res.data.Message);
    }
  },

  async search(channelId: string, q: string): Promise<Message[]> {
    const res = await httpClient.get<ApiResponse<Message[]>>(
      `/channels/${channelId}/messages/search?q=${encodeURIComponent(q)}`
    );
    if (!res.data.IsSuccess || !res.data.Data) {
      throw new Error(res.data.Message);
    }
    return res.data.Data;
  },
};
