import axios from "axios";
import { readToken } from "../utils/session";

/** Shared Axios instance. Vite proxies /api to the backend in development. */
export const http = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 8000,
});

http.interceptors.request.use((config) => {
  const token = readToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
