import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axios from "axios";
import { toast } from "sonner";

const API = axios.create({ baseURL: "http://localhost:8000/api" });

const FR_TO_EN = { actif: "active", suivi: "follow-up", sorti: "discharged" };
const EN_TO_FR = { active: "actif", "follow-up": "suivi", discharged: "sorti" };

export function StatusSelectFR({ patientId, valueEN, onChanged }: {
  patientId: string;
  valueEN: "active" | "follow-up" | "discharged";
  onChanged?: (newEN: string) => void;
}) {
  const valueFR = EN_TO_FR[valueEN];

  const handleChange = async (newFR: "actif" | "suivi" | "sorti") => {
    const newEN = FR_TO_EN[newFR];
    try {
      await API.patch(`/patients/${patientId}/status/`, { status: newEN });
      onChanged?.(newEN);
      toast.success("Statut mis à jour");
    } catch {
      toast.error("Erreur lors de la mise à jour du statut");
    }
  };

  return (
    <Select value={valueFR} onValueChange={(v) => handleChange(v as any)}>
      <SelectTrigger className="w-32">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="actif">Actif</SelectItem>
        <SelectItem value="suivi">Suivi</SelectItem>
        <SelectItem value="sorti">Sorti</SelectItem>
      </SelectContent>
    </Select>
  );
}
