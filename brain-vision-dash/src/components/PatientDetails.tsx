import { useEffect, useMemo, useState, useCallback } from "react";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Patient, TumorTypeLabel, Diagnosis } from "@/types/patient";
import { Calendar, Phone, Mail, User, Brain, FileText, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddDiagnosis } from "@/components/AddDiagnosis";
import { toast } from "sonner";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

// Recharts
import {
  ResponsiveContainer,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

const tumorLabels: TumorTypeLabel = {
  no_tumor: { label: "Normal", color: "success" },
  glioma: { label: "Gliome", color: "destructive" },
  meningioma: { label: "Méningiome", color: "warning" },
  pituitary: { label: "Hypophysaire", color: "secondary" }
};

const API = axios.create({
  baseURL:
    (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, "") ||
    "http://localhost:8000/api",
  headers: { "Content-Type": "application/json" },
});

// Mapping FR <-> EN pour statut
const FR_TO_EN = {
  actif: "active",
  suivi: "follow-up",
  sorti: "discharged",
} as const;

const EN_TO_FR = {
  active: "actif",
  "follow-up": "suivi",
  discharged: "sorti",
} as const;

interface PatientDetailsProps {
  patient: Patient | null;
  isOpen: boolean;
  onClose: () => void;
}

export function PatientDetails({ patient, isOpen, onClose }: PatientDetailsProps) {
  // --- Hooks toujours au top-level ---
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [loadingDiag, setLoadingDiag] = useState(false);

  // état local pour le statut (optimiste)
  const [statusEN, setStatusEN] = useState<"active" | "follow-up" | "discharged">("active");

  // sync quand patient change
  useEffect(() => {
    if (patient?.status) setStatusEN(patient.status as any);
  }, [patient?.status]);

  // Charger l'historique quand la modale s'ouvre et qu'on a un patient
  useEffect(() => {
    if (!isOpen || !patient?.id) return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingDiag(true);
        const { data } = await API.get<Diagnosis[]>(`/patients/${patient.id}/diagnoses/`);
        if (!cancelled) setDiagnoses(data || []);
      } catch {
        if (!cancelled) setDiagnoses([]);
      } finally {
        if (!cancelled) setLoadingDiag(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen, patient?.id]);

  // Valeurs "safe" pour l'affichage
  const currentTumorType = patient?.diagnosis?.tumorType ?? "no_tumor";
  const tumorInfo = tumorLabels[currentTumorType as keyof typeof tumorLabels];

  // Données graphe
  const chartData = useMemo(() => {
    const arr = [...diagnoses].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    return arr.map(d => ({
      dateLabel: new Date(d.date).toLocaleDateString("fr-FR"),
      confidence: Number((d.confidence * 100).toFixed(1)),
      tumorType: d.tumorType,
    }));
  }, [diagnoses]);

  // Refresh après ajout d'un diagnostic
  const refreshHistory = useCallback(async () => {
    if (!patient) return;
    const { data } = await API.get<Diagnosis[]>(`/patients/${patient.id}/diagnoses/`);
    setDiagnoses(data || []);
  }, [patient]);

  // PATCH statut
  const handleStatusChangeFR = async (newFR: "actif" | "suivi" | "sorti") => {
    if (!patient) return;
    const newEN = FR_TO_EN[newFR];
    const prev = statusEN;
    setStatusEN(newEN); // optimiste
    try {
      await API.patch(`/patients/${patient.id}/status/`, { status: newEN });
      toast.success("Statut mis à jour");
    } catch (e: any) {
      setStatusEN(prev);
      toast.error(e?.response?.data?.detail || "Échec de mise à jour du statut");
    }
  };

  // Guard APRÈS tous les hooks
  if (!patient) return null;

  const statusFR = EN_TO_FR[statusEN];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader style={{marginTop:20}}>
          <DialogTitle className="flex items-center justify-between gap-2 text-xl">
            <span className="flex items-center gap-2">
              <User className="h-6 w-6" />
              Dossier Patient - {patient.firstName} {patient.lastName}
            </span>

            {/* Bouton: Nouveau diagnostic */}
            <AddDiagnosis patientId={patient.id} onSaved={refreshHistory} />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations personnelles */}
          <div className="bg-card rounded-lg border p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations personnelles
              </h3>

              {/* Sélecteur de statut + badge indicatif */}
              <div className="flex items-center gap-2">
                <Select value={statusFR} onValueChange={(v) => handleStatusChangeFR(v as any)}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="actif">Actif</SelectItem>
                    <SelectItem value="suivi">Suivi</SelectItem>
                    <SelectItem value="sorti">Sorti</SelectItem>
                  </SelectContent>
                </Select>
                <Badge variant="outline" className="text-xs">
                  {statusFR === "actif" ? "Actif" : statusFR === "suivi" ? "Suivi" : "Sorti"}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">ID Patient</p>
                <p className="font-medium">{patient.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nom complet</p>
                <p className="font-medium">{patient.firstName} {patient.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date de naissance</p>
                <p className="font-medium">{new Date(patient.dateOfBirth).toLocaleDateString("fr-FR")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Âge</p>
                <p className="font-medium">{patient.age} ans</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Genre</p>
                <p className="font-medium">{patient.gender === "M" ? "Masculin" : "Féminin"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dernière visite</p>
                <p className="font-medium">
                  {new Date(patient.lastVisit).toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{patient.phoneNumber}</span>
              </div>
              {patient.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{patient.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Diagnostic courant */}
          <div className="bg-card rounded-lg border p-4">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Diagnostic IA - Actuel
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <div>
                  <p className="font-medium">Type détecté</p>
                  <p className="text-sm text-muted-foreground">
                    Date: {new Date(patient.diagnosis.date).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-sm px-3 py-1",
                    tumorInfo.color === "success" && "border-success text-success bg-success/10",
                    tumorInfo.color === "warning" && "border-warning text-warning bg-warning/10",
                    tumorInfo.color === "destructive" && "border-destructive text-destructive bg-destructive/10",
                    tumorInfo.color === "secondary" && "border-muted-foreground text-muted-foreground"
                  )}
                >
                  {tumorInfo.label}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-primary/5 rounded-lg border">
                  <p className="text-2xl font-bold text-primary">
                    {Math.round(patient.diagnosis.confidence * 100)}%
                  </p>
                  <p className="text-sm text-muted-foreground">Confiance</p>
                </div>
                {patient.diagnosis.severity && (
                  <div className="text-center p-3 bg-accent rounded-lg border">
                    <p className="text-lg font-semibold capitalize">
                      {patient.diagnosis.severity}
                    </p>
                    <p className="text-sm text-muted-foreground">Sévérité</p>
                  </div>
                )}
                <div className="text-center p-3 bg-muted/50 rounded-lg border">
                  <p className="text-lg font-semibold">
                    {patient.diagnosis.modelVersion}
                  </p>
                  <p className="text-sm text-muted-foreground">Version modèle</p>
                </div>
              </div>

              {patient.diagnosis.notes && (
                <div className="bg-accent/30 rounded-lg p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Notes cliniques
                  </h4>
                  <p className="text-sm text-foreground leading-relaxed">
                    {patient.diagnosis.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Historique & Évolution */}
          <div className="bg-card rounded-lg border p-4">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Historique des diagnostics & évolution
            </h3>

            <div className="h-56 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dateLabel" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip
                    formatter={(v: number, n) => n === "confidence" ? [`${v}%`, "Confiance"] : [String(v), n]}
                    labelFormatter={(l) => `Date: ${l}`}
                  />
                  <Line
                    type="monotone"
                    dataKey="confidence"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--primary))" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {loadingDiag ? (
                <p className="text-sm text-muted-foreground">Chargement de l’historique…</p>
              ) : diagnoses.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun diagnostic enregistré.</p>
              ) : (
                diagnoses.map((d) => {
                  const info = tumorLabels[d.tumorType];
                  return (
                    <div key={d.id} className="flex items-start justify-between gap-4 p-3 rounded-lg border">
                      <div>
                        <p className="text-sm font-medium">
                          {new Date(d.date).toLocaleDateString("fr-FR")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Modèle: {d.modelVersion} • Confiance: {Math.round(d.confidence * 100)}%
                          {d.severity ? ` • Sévérité: ${d.severity}` : ""}
                        </p>
                        {d.notes && <p className="text-xs mt-1">{d.notes}</p>}
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          info.color === "success" && "border-success text-success bg-success/10",
                          info.color === "warning" && "border-warning text-warning bg-warning/10",
                          info.color === "destructive" && "border-destructive text-destructive bg-destructive/10",
                          info.color === "secondary" && "border-muted-foreground text-muted-foreground"
                        )}
                      >
                        {info.label}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
