import axios from "axios";

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(";").shift()!;
  return "";
}

export const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:8000/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

API.interceptors.request.use((config) => {
  const csrf = getCookie("csrftoken");
  if (csrf) config.headers["X-CSRFToken"] = csrf;
  return config;
});