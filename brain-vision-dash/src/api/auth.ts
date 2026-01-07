// src/api/auth.ts
import axios from "axios";
import type { LoginPayload, AuthMe } from "@/types/medecin";

const API = axios.create({
  baseURL:
    (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, "") ||
    "http://localhost:8000/api",
  withCredentials: true,            // <-- IMPORTANT pour cookies HttpOnly
  headers: { "Content-Type": "application/json" },
});

export async function login(payload: LoginPayload) {
  // cookies access/refresh sont posés par le backend
  const { data } = await API.post("/auth/login/", payload);
  return data; // {detail: "..."} éventuel
}

export async function logout() {
  await API.post("/auth/logout/");
}

export async function fetchMe(): Promise<AuthMe> {
  const { data } = await API.get("/auth/me/");
  return data;
}

export default API;
