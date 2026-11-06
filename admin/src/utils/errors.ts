import axios from "axios";

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? `${fallback} — ตรวจสอบการเชื่อมต่อ API แล้วลองใหม่`;
  }
  if (error instanceof Error) return `${fallback}: ${error.message}`;
  return fallback;
}

export function isUnauthorized(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401;
}
