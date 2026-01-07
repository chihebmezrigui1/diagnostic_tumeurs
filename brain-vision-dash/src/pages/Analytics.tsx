import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navigation } from "@/components/Navigation";
import { BarChart3, TrendingUp, Users, Brain, Calendar, Target } from "lucide-react";
import type { Patient } from "@/types/patient";

import {
  ResponsiveContainer,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip
} from "recharts";

const API = axios.create({
  baseURL:
    (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, "") ||
    "http://localhost:8000/api",
});

const tumorLabels = {
  no_tumor: { label: "Normal", color: "success" },
  glioma: { label: "Gliome", color: "destructive" },
  meningioma: { label: "Méningiome", color: "warning" },
  pituitary: { label: "Hypophysaire", color: "secondary" },
} as const;

const Analytics = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ⬇️ type de graphe (barres ou courbe) pour "Répartition par Âge"
  const [ageChartType, setAgeChartType] = useState<"bar" | "line">("bar");

  // fetch live data
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await API.get<Patient[]>("/patients/");
        if (mounted) setPatients(data);
      } catch (e: any) {
        if (mounted) setError(e?.response?.data?.detail || e.message || "Erreur de chargement");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const analyticsData = useMemo(() => {
    const tumorStats: Record<string, number> = {
      no_tumor: 0,
      glioma: 0,
      meningioma: 0,
      pituitary: 0,
    };

    const ageGroups: Record<string, number> = { "< 30": 0, "30-49": 0, "50-59": 0, "60+": 0 };

    let confSum = 0;
    let confCount = 0;

    const months: { label: string; key: string }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("fr-FR", { month: "short" });
      months.push({ label, key });
    }
    const monthlyMap: Record<string, { normal: number; tumor: number }> = {};
    months.forEach(m => (monthlyMap[m.key] = { normal: 0, tumor: 0 }));

    patients.forEach(p => {
      const age = Number(p.age);
      if (age < 30) ageGroups["< 30"]++;
      else if (age < 50) ageGroups["30-49"]++;
      else if (age < 60) ageGroups["50-59"]++;
      else ageGroups["60+"]++;

      const d = p.diagnosis;
      if (d) {
        tumorStats[d.tumorType] = (tumorStats[d.tumorType] || 0) + 1;
        confSum += d.confidence;
        confCount += 1;

        if (d.date) {
          const dt = new Date(d.date);
          const mk = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
          if (monthlyMap[mk]) {
            if (d.tumorType === "no_tumor") monthlyMap[mk].normal++;
            else monthlyMap[mk].tumor++;
          }
        }
      }
    });

    const avgConfidence = confCount ? confSum / confCount : 0;
    const totalDiagnoses = confCount;
    const monthlyDiagnoses = months.map(m => ({
      month: m.label.charAt(0).toUpperCase() + m.label.slice(1),
      normal: monthlyMap[m.key]?.normal || 0,
      tumor: monthlyMap[m.key]?.tumor || 0,
    }));

    return {
      tumorStats,
      ageGroups,
      avgConfidence,
      monthlyDiagnoses,
      totalDiagnoses,
      accuracyRate: avgConfidence,
    };
  }, [patients]);

  // ⬇️ données pour Recharts (Répartition par Âge)
  const ageChartData = useMemo(
    () =>
      Object.entries(analyticsData.ageGroups).map(([label, count]) => ({
        label,
        count,
      })),
    [analyticsData.ageGroups]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <p className="text-muted-foreground">Chargement des analytics…</p>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <p className="text-destructive">Erreur : {error}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Analytics & Statistiques</h2>
          <p className="text-muted-foreground">Analyse détaillée des performances du modèle IA</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Précision Modèle</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {Math.round(analyticsData.accuracyRate * 100)}%
              </div>
              <p className="text-xs text-muted-foreground">Confiance moyenne des diagnostics</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Diagnostics Total</CardTitle>
              <BarChart3 className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.totalDiagnoses}</div>
              <p className="text-xs text-muted-foreground">Sur la période récente</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tumeurs Détectées</CardTitle>
              <Brain className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.entries(analyticsData.tumorStats).reduce(
                  (sum, [k, v]) => (k !== "no_tumor" ? sum + v : sum),
                  0
                )}
              </div>
              <p className="text-xs text-muted-foreground">Cas nécessitant un suivi</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux Normal</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {analyticsData.totalDiagnoses
                  ? Math.round(
                      ((analyticsData.tumorStats.no_tumor || 0) /
                        analyticsData.totalDiagnoses) *
                        100
                    )
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground">Examens sans anomalie</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Distribution par type de tumeur */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Distribution des Diagnostics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(analyticsData.tumorStats).map(([type, count]) => {
                  const info = tumorLabels[type as keyof typeof tumorLabels];
                  const percentage = analyticsData.totalDiagnoses
                    ? Math.round((count / analyticsData.totalDiagnoses) * 100)
                    : 0;
                  return (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {info.label}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {count} cas
                          </span>
                        </div>
                        <span className="text-sm font-medium">{percentage}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            info.color === "success"
                              ? "bg-success"
                              : info.color === "warning"
                              ? "bg-warning"
                              : info.color === "destructive"
                              ? "bg-destructive"
                              : "bg-muted-foreground"
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Répartition par âge (Histogramme / Courbe) */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Répartition par Âge
                </CardTitle>
                <div className="inline-flex rounded-md shadow-sm" role="group">
                  <button
                    onClick={() => setAgeChartType("bar")}
                    className={`px-3 py-1.5 text-sm border rounded-l-md ${
                      ageChartType === "bar"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-input hover:bg-accent"
                    }`}
                  >
                    Histogramme
                  </button>
                  <button
                    onClick={() => setAgeChartType("line")}
                    className={`px-3 py-1.5 text-sm border rounded-r-md ${
                      ageChartType === "line"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-input hover:bg-accent"
                    }`}
                  >
                    Courbe
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  {ageChartType === "bar" ? (
                    <BarChart data={ageChartData} barCategoryGap={24}>
                      <CartesianGrid strokeDasharray="3 3" className="text-muted" />
                      <XAxis dataKey="label" />
                      <YAxis allowDecimals={false} />
                      <Tooltip
                        formatter={(v: number) => [`${v} patients`, "Total"]}
                        labelFormatter={(l) => `Tranche ${l} ans`}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  ) : (
                    <LineChart data={ageChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="text-muted" />
                      <XAxis dataKey="label" />
                      <YAxis allowDecimals={false} />
                      <Tooltip
                        formatter={(v: number) => [`${v} patients`, "Total"]}
                        labelFormatter={(l) => `Tranche ${l} ans`}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2, stroke: "hsl(var(--primary))" }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Total patients : {patients.length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Évolution mensuelle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Évolution Mensuelle des Diagnostics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.monthlyDiagnoses.map((month, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-secondary/20 rounded-lg">
                  <div className="w-12 text-sm font-medium text-center">{month.month}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Normal: {month.normal}</span>
                      <span className="text-sm text-muted-foreground">Tumeurs: {month.tumor}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                      <div
                        className="bg-success"
                        style={{
                          width: `${
                            month.normal + month.tumor
                              ? (month.normal / (month.normal + month.tumor)) * 100
                              : 0
                          }%`,
                        }}
                      />
                      <div
                        className="bg-warning"
                        style={{
                          width: `${
                            month.normal + month.tumor
                              ? (month.tumor / (month.normal + month.tumor)) * 100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="text-sm font-medium">{month.normal + month.tumor} total</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Analytics;
