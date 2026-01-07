// src/components/AuthGuard.tsx
import { useEffect, useState } from "react";
import { useLocation, Navigate } from "react-router-dom";
import axios from "axios";

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()!.split(";").shift()!;
  return "";
}

// Instance axios locale (mêmes options que Login)
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:8000/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});
API.interceptors.request.use((config) => {
  const csrf = getCookie("csrftoken");
  if (csrf) config.headers["X-CSRFToken"] = csrf;
  return config;
});

type Props = { children: React.ReactNode };

export default function AuthGuard({ children }: Props) {
  const [state, setState] = useState<"checking" | "authed" | "denied">("checking");
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Pas strictement nécessaire pour GET, mais inoffensif:
        await API.get("/auth/csrf/");

        // Vérifie la session (doit renvoyer 200 avec l’utilisateur)
        await API.get("/auth/me/");
        if (!cancelled) setState("authed");
      } catch (err: any) {
        if (!cancelled) {
          // Sauvegarde la route demandée pour y revenir après login
          localStorage.setItem("returnTo", location.pathname + location.search);
          setState("denied");
        }
      }
    })();

    return () => { cancelled = true; };
  }, [location.pathname, location.search]);

  if (state === "checking") {
    return (
      <div className="min-h-screen grid place-items-center text-muted-foreground">
        Vérification de la session…
      </div>
    );
  }

  if (state === "denied") {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
