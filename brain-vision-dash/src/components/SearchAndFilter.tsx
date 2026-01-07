import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

interface SearchAndFilterProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  statusFilter: string;                 // attendu: "all" | "actif" | "suivi" | "sorti"
  onStatusFilterChange: (status: string) => void;
  tumorFilter: string;
  onTumorFilterChange: (tumor: string) => void;
}

export function SearchAndFilter({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  tumorFilter,
  onTumorFilterChange
}: SearchAndFilterProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par nom, ID patient..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex gap-2">
        {/* Statut en FR */}
        <Select value={statusFilter} onValueChange={onStatusFilterChange}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="actif">Actif</SelectItem>
            <SelectItem value="suivi">Suivi</SelectItem>
            <SelectItem value="sorti">Sorti</SelectItem>
          </SelectContent>
        </Select>

        {/* Diagnostic (inchangé) */}
        <Select value={tumorFilter} onValueChange={onTumorFilterChange}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Diagnostic" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="no_tumor">Normal</SelectItem>
            <SelectItem value="glioma">Gliome</SelectItem>
            <SelectItem value="meningioma">Méningiome</SelectItem>
            <SelectItem value="pituitary">Hypophysaire</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
