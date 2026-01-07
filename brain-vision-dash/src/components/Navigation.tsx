import { Link, useLocation, useNavigate } from "react-router-dom";
import { Brain, BarChart3, FileText, Settings, Activity, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";
import { useEffect, useState } from "react";

const navigationItems = [
  {
    name: "Patients",
    href: "/",
    icon: Brain,
    description: "Gestion des patients"
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    description: "Statistiques et analyses"
  },
  {
    name: "Rapports",
    href: "/reports",
    icon: FileText,
    description: "Génération de rapports"
  },
  {
    name: "Paramètres",
    href: "/settings",
    icon: Settings,
    description: "Configuration système"
  }
];

export function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [username, setUsername] = useState<string | null>(null);

  // Récupère le user courant
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("/api/auth/me/", { withCredentials: true });
        setUsername(res.data.email);
      } catch (err) {
        console.error("Erreur récupération user:", err);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout/", {}, { withCredentials: true });
      navigate("/login");
    } catch (err) {
      console.error("Erreur logout:", err);
    }
  };

  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo et titre */}
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {/* Dashboard Médical IA */}
                NeuroDiag
              </h1>
              <p className="text-sm text-muted-foreground">
                Système de diagnostic de tumeurs cérébrales
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    "hover:bg-secondary/80 hover:text-foreground",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}

            {/* Bouton Logout */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>
          </nav>

          {/* Username affiché */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4" />
            <span>{username ?? "Chargement..."}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
