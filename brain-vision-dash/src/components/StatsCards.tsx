import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Brain, AlertTriangle, CheckCircle } from "lucide-react";
import { Patient } from "@/types/patient";

interface StatsCardsProps {
  patients: Patient[];
}

export function StatsCards({ patients }: StatsCardsProps) {
  const totalPatients = patients.length;
  const activeCases = patients.filter(p => p.status === "active").length;
  const tumorsDetected = patients.filter(p => p.diagnosis.tumorType !== "no_tumor").length;
  const normalCases = patients.filter(p => p.diagnosis.tumorType === "no_tumor").length;

  const stats = [
    {
      title: "Total Patients",
      value: totalPatients.toString(),
      icon: Users,
      color: "primary"
    },
    {
      title: "Cas Actifs",
      value: activeCases.toString(),
      icon: AlertTriangle,
      color: "warning"
    },
    {
      title: "Tumeurs Détectées",
      value: tumorsDetected.toString(),
      icon: Brain,
      color: "destructive"
    },
    {
      title: "Examens Normaux",
      value: normalCases.toString(),
      icon: CheckCircle,
      color: "success"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-5 w-5 ${
              stat.color === "primary" ? "text-primary" :
              stat.color === "warning" ? "text-warning" :
              stat.color === "destructive" ? "text-destructive" :
              "text-success"
            }`} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stat.value}</div>
            {stat.title === "Tumeurs Détectées" && tumorsDetected > 0 && (
              <Badge variant="outline" className="mt-2 text-xs border-destructive text-destructive">
                Nécessite suivi
              </Badge>
            )}
            {stat.title === "Examens Normaux" && normalCases > 0 && (
              <Badge variant="outline" className="mt-2 text-xs border-success text-success">
                Aucune anomalie
              </Badge>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}