import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Patient } from "@/types/patient";
import { TumorTypeLabel } from "@/types/patient";
import { Calendar, Phone, Mail, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const tumorLabels: TumorTypeLabel = {
  no_tumor: { label: "Normal", color: "success" },
  glioma: { label: "Gliome", color: "destructive" },
  meningioma: { label: "Méningiome", color: "warning" },
  pituitary: { label: "Hypophysaire", color: "secondary" }
};

const statusLabels = {
  active: { label: "Actif", color: "success" },
  "follow-up": { label: "Suivi", color: "warning" },
  discharged: { label: "Sorti", color: "secondary" }
} as const;

interface PatientCardProps {
  patient: Patient;
  onViewDetails: (patient: Patient) => void;
}

export function PatientCard({ patient, onViewDetails }: PatientCardProps) {
  const tumorInfo = tumorLabels[patient.diagnosis.tumorType];
  const statusInfo = statusLabels[patient.status];

  return (
    <Card className="hover:shadow-md transition-all duration-200 border-l-4 border-l-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg text-foreground">
              {patient.firstName} {patient.lastName}
            </h3>
            <p className="text-sm text-muted-foreground">ID: {patient.id}</p>
          </div>
          <div className="flex flex-col gap-2">
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                statusInfo.color === "success" && "border-success text-success",
                statusInfo.color === "warning" && "border-warning text-warning",
                statusInfo.color === "secondary" && "border-muted-foreground text-muted-foreground"
              )}
            >
              {statusInfo.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Âge</p>
            <p className="font-medium">{patient.age} ans</p>
          </div>
          <div>
            <p className="text-muted-foreground">Genre</p>
            <p className="font-medium">{patient.gender === "M" ? "Homme" : "Femme"}</p>
          </div>
        </div>

        <div className="space-y-2">
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
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Dernière visite: {new Date(patient.lastVisit).toLocaleDateString("fr-FR")}</span>
          </div>
        </div>

        <div className="bg-secondary/30 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Diagnostic</span>
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                tumorInfo.color === "success" && "border-success text-success bg-success/5",
                tumorInfo.color === "warning" && "border-warning text-warning bg-warning/5",
                tumorInfo.color === "destructive" && "border-destructive text-destructive bg-destructive/5",
                tumorInfo.color === "secondary" && "border-muted-foreground text-muted-foreground"
              )}
            >
              {tumorInfo.label}
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Confiance</span>
            <span className="font-medium">{Math.round(patient.diagnosis.confidence * 100)}%</span>
          </div>
          {patient.diagnosis.severity && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Sévérité</span>
              <span className="font-medium capitalize">{patient.diagnosis.severity}</span>
            </div>
          )}
        </div>

        <Button 
          onClick={() => onViewDetails(patient)}
          className="w-full"
          variant="outline"
        >
          <Eye className="h-4 w-4 mr-2" />
          Voir détails
        </Button>
      </CardContent>
    </Card>
  );
}