import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navigation } from "@/components/Navigation";
import {
  FileText, Download, Calendar, Filter, Search, PieChart, BarChart3, Users, Brain
} from "lucide-react";
import type { Patient } from "@/types/patient";
import { toast } from "sonner";

const API = axios.create({
  baseURL:
    (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, "") ||
    "http://localhost:8000/api",
});

function fmt(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function startOfWeek(d: Date) {
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const delta = (day + 6) % 7; // Monday as start
  const nd = new Date(d);
  nd.setDate(d.getDate() - delta);
  return new Date(nd.getFullYear(), nd.getMonth(), nd.getDate());
}
function addMonths(d: Date, n: number) {
  const nd = new Date(d);
  nd.setMonth(nd.getMonth() + n);
  return nd;
}

const Reports = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [reportType, setReportType] = useState("all");

  // --- Période globale + format ---
  const [dateRange, setDateRange] = useState<"week"|"month"|"quarter"|"year">("month");
  const today = useMemo(() => new Date(), []);
  const [from, setFrom] = useState<string>(fmt(startOfMonth(today)));
  const [to, setTo] = useState<string>(fmt(today));
  const [fileFormat, setFileFormat] = useState<"pdf"|"csv">("pdf");

  useEffect(() => {
    const now = new Date();
    if (dateRange === "week") setFrom(fmt(startOfWeek(now)));
    if (dateRange === "month") setFrom(fmt(startOfMonth(now)));
    if (dateRange === "quarter") setFrom(fmt(startOfMonth(addMonths(now, -2)))); // 3 derniers mois
    if (dateRange === "year") setFrom(fmt(startOfMonth(addMonths(now, -11))));   // 12 derniers mois
    setTo(fmt(now));
  }, [dateRange]);

  // --- Patients depuis backend ---
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get<Patient[]>("/patients/");
        setPatients(data);
      } catch (e: any) {
        toast.error(e?.response?.data?.detail || e.message || "Erreur de chargement des patients");
      } finally {
        setLoadingPatients(false);
      }
    })();
  }, []);

  // --- Templates (affichage seulement) ---
  const reportTemplates = [
    { id: "patient-summary", title: "Rapport Patient Individuel", description: "Rapport détaillé pour un patient spécifique", icon: Users, type: "patient" },
    { id: "tumor-analysis", title: "Analyse des Tumeurs Détectées", description: "Statistiques sur les types de tumeurs diagnostiquées", icon: Brain, type: "medical" },
    { id: "monthly-stats", title: "Statistiques Mensuelles", description: "Rapport mensuel des activités du système IA", icon: BarChart3, type: "statistics" },
    { id: "model-performance", title: "Performance du Modèle", description: "Analyse des performances et précision du modèle IA", icon: PieChart, type: "technical" },
  ];

  const recentReports = [
    { id: "R001", title: "Rapport Mensuel - Janvier 2024", type: "Statistiques", generatedDate: "2024-01-15", status: "Généré", size: "2.4 MB" },
    { id: "R002", title: "Analyse Tumeurs - Q4 2023", type: "Médical", generatedDate: "2024-01-10", status: "Généré", size: "1.8 MB" },
    { id: "R003", title: "Performance Modèle v2.1", type: "Technique", generatedDate: "2024-01-08", status: "En cours", size: "3.2 MB" },
  ];

  const filteredTemplates = useMemo(() => {
    return reportTemplates.filter(t => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = reportType === "all" || t.type === reportType;
      return matchesSearch && matchesType;
    });
  }, [searchTerm, reportType]);

  // --- Download helpers (PDF/CSV) ---
  const blobDownload = async (url: string, filename: string) => {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const blob = await resp.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  };

  const downloadTumorAnalysis = async () => {
    try {
      const qs = new URLSearchParams();
      if (from) qs.set("from", from);
      if (to) qs.set("to", to);
      if (fileFormat === "csv") qs.set("format", "csv");
      const url = `${API.defaults.baseURL}/reports/tumors/${qs.toString() ? "?" + qs.toString() : ""}`;
      await blobDownload(url, `tumor_analysis_${from}_${to}.${fileFormat}`);
      toast.success("Analyse des tumeurs exportée");
    } catch (e: any) {
      toast.error(e?.message || "Échec export Analyse des tumeurs");
    }
  };

  const downloadMonthlyStats = async () => {
    try {
      const qs = new URLSearchParams();
      if (from) qs.set("from", from);
      if (to) qs.set("to", to);
      if (fileFormat === "csv") qs.set("format", "csv");
      const url = `${API.defaults.baseURL}/reports/monthly/${qs.toString() ? "?" + qs.toString() : ""}`;
      await blobDownload(url, `monthly_stats_${from}_${to}.${fileFormat}`);
      toast.success("Statistiques mensuelles exportées");
    } catch (e: any) {
      toast.error(e?.message || "Échec export Statistiques mensuelles");
    }
  };

  // --- PDF par patient ---
  const handleGeneratePatientPDF = async (patient: Patient) => {
    try {
      const resp = await API.get(`/reports/patient/${patient.id}/`, { responseType: "blob" });
      const blob = new Blob([resp.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      const filename = `rapport_${patient.lastName}_${patient.firstName}.pdf`.replace(/\s+/g, "_");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Rapport PDF généré");
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || e.message || "Échec génération du rapport");
    }
  };

  const { tumorCases } = useMemo(() => {
    const withDiag = patients.filter(p => !!p.diagnosis);
    const tumor = withDiag.filter(p => p.diagnosis!.tumorType !== "no_tumor").length;
    return { tumorCases: tumor };
  }, [patients]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Génération de Rapports</h2>
          <p className="text-muted-foreground">Créez et gérez vos rapports médicaux et statistiques</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">—</p>
                  <p className="text-sm text-muted-foreground">Rapports générés</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-success" />
                <div>
                  <p className="text-2xl font-bold">{patients.length}</p>
                  <p className="text-sm text-muted-foreground">Patients</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Brain className="h-8 w-8 text-warning" />
                <div>
                  <p className="text-2xl font-bold">{tumorCases}</p>
                  <p className="text-sm text-muted-foreground">Cas pathologiques</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Download className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">—</p>
                  <p className="text-sm text-muted-foreground">Téléchargements</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Templates (affichage) */}
            <div className="lg:col-span-2 space-y-8">
    {/* Templates de rapports */}
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Modèles de Rapports
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filtres */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un modèle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous types</SelectItem>
              <SelectItem value="patient">Patient</SelectItem>
              <SelectItem value="medical">Médical</SelectItem>
              <SelectItem value="statistics">Statistiques</SelectItem>
              <SelectItem value="technical">Technique</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Liste des templates */}
        <div className="space-y-4">
          {filteredTemplates.map((template) => (
            <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary/20">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <template.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">{template.title}</h4>
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                  <Badge variant="outline" className="mt-1 text-xs">{template.type}</Badge>
                </div>
              </div>
              <Button size="sm" onClick={() => toast.info("Utilisez les exports ci-dessous pour générer le rapport.")}>
                Générer
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    {/* 🚩 EXPORTS DANS LA COLONNE GAUCHE */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Analyse des Tumeurs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Analyse des Tumeurs Détectées
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Select value={fileFormat} onValueChange={(v: "pdf"|"csv") => setFileFormat(v)}>
              <SelectTrigger><SelectValue placeholder="Format" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
              <SelectTrigger><SelectValue placeholder="Période" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Semaine</SelectItem>
                <SelectItem value="month">Mois</SelectItem>
                <SelectItem value="quarter">Trimestre</SelectItem>
                <SelectItem value="year">Année</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button className="w-full" onClick={downloadTumorAnalysis}>
            <Download className="h-4 w-4 mr-2" />
            Télécharger l’analyse des tumeurs ({fileFormat.toUpperCase()})
          </Button>
        </CardContent>
      </Card>

      {/* Statistiques Mensuelles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Statistiques Mensuelles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Select value={fileFormat} onValueChange={(v: "pdf"|"csv") => setFileFormat(v)}>
              <SelectTrigger><SelectValue placeholder="Format" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateRange} onValueChange={(v: any) => setDateRange(v)}>
              <SelectTrigger><SelectValue placeholder="Période" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Semaine</SelectItem>
                <SelectItem value="month">Mois</SelectItem>
                <SelectItem value="quarter">Trimestre</SelectItem>
                <SelectItem value="year">Année</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <Button className="w-full" onClick={downloadMonthlyStats}>
            <Download className="h-4 w-4 mr-2" />
            Télécharger les stats mensuelles ({fileFormat.toUpperCase()})
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
          {/* Récents + Patients */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Rapports Récents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentReports.map((r) => (
                    <div key={r.id} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-sm leading-tight">{r.title}</h5>
                          <p className="text-xs text-muted-foreground mt-1">
                            {r.type} • {r.size}
                          </p>
                        </div>
                        <Badge variant={r.status === "Généré" ? "default" : "secondary"} className="text-xs">
                          {r.status}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {new Date(r.generatedDate).toLocaleDateString("fr-FR")}
                        </span>
                        {r.status === "Généré" && (
                          <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => toast.info("Démo: pas de fichier réel")}>
                            <Download className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Rapport par Patient */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rapport par Patient</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingPatients ? (
                  <p className="text-muted-foreground">Chargement des patients…</p>
                ) : patients.length === 0 ? (
                  <p className="text-muted-foreground">Aucun patient.</p>
                ) : (
                  <div className="space-y-3">
                    {patients.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-3 border rounded-md">
                        <div className="flex-1">
                          <div className="font-medium">
                            {p.firstName} {p.lastName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {p.diagnosis
                              ? `Dernier diag: ${p.diagnosis.tumorType} • ${Math.round(p.diagnosis.confidence * 100)}% • ${new Date(p.diagnosis.date).toLocaleDateString("fr-FR")}`
                              : "Aucun diagnostic"}
                          </div>
                        </div>
                        <Button size="sm" onClick={() => handleGeneratePatientPDF(p)}>
                          <Download className="h-4 w-4 mr-2" />
                          PDF
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Exports globaux (Analyse Tumeurs / Stats Mensuelles) */}
        
      </main>
    </div>
  );
};

export default Reports;
