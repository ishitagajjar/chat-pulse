export interface ApiResponseBody<T> {
  IsSuccess: boolean;
  Data: T | null;
  Message: string;
}

export class ApiResponse {
  static success<T>(data: T, message = "Success"): ApiResponseBody<T> {
    return { IsSuccess: true, Data: data, Message: message };
  }

  static error<T = null>(message: string, data: T = null as T): ApiResponseBody<T> {
    return { IsSuccess: false, Data: data, Message: message };
  }
}
