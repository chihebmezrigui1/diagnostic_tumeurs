import { useState, useMemo, useEffect, useCallback } from "react";
import axios from "axios";
import { Brain } from "lucide-react";
import { PatientCard } from "@/components/PatientCard";
import { PatientDetails } from "@/components/PatientDetails";
import { StatsCards } from "@/components/StatsCards";
import { SearchAndFilter } from "@/components/SearchAndFilter";
import { Navigation } from "@/components/Navigation";
import { AddPatient } from "@/components/AddPatient";
import type { Patient, Diagnosis } from "@/types/patient";
import { toast } from "sonner";

// Client API simple
const API = axios.create({
  baseURL:
    (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, "") ||
    "http://localhost:8000/api",
  headers: { "Content-Type": "application/json" },
});

// Fallback si le backend renvoie diagnosis=null
const toSafePatient = (p: any): Patient => {
  const fallback: Diagnosis = {
    id: p.id,
    patientId: p.id,
    date: p.lastVisit ?? new Date().toISOString().slice(0, 10),
    tumorType: "no_tumor",
    confidence: 0,
    modelVersion: "v0",
  };
  return { ...p, diagnosis: p.diagnosis ?? fallback };
};

const Index = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Filtres UI
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tumorFilter, setTumorFilter] = useState("all");

  // Fetch patients
  const fetchPatients = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/patients/", {
        params: { ordering: "-last_visit" },
      });
      const list = Array.isArray(data) ? data : data.results;
      setPatients(list.map(toSafePatient));
    } catch (e: any) {
      toast.error(e?.message || "Impossible de charger les patients");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // Filtrage client
  const filteredPatients = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return patients.filter((patient) => {
      const matchesSearch =
        patient.firstName.toLowerCase().includes(term) ||
        patient.lastName.toLowerCase().includes(term) ||
        patient.id.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "all" || patient.status === statusFilter;

      const matchesTumor =
        tumorFilter === "all" ||
        patient.diagnosis.tumorType === tumorFilter;

      return matchesSearch && matchesStatus && matchesTumor;
    });
  }, 
  [patients, searchTerm, statusFilter, tumorFilter]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        {/* Stats basées sur les vraies données */}
        <StatsCards patients={patients} />

        <SearchAndFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          tumorFilter={tumorFilter}
          onTumorFilterChange={setTumorFilter}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-foreground">
              Patients ({filteredPatients.length})
            </h2>

            {/* Re-fetch auto après ajout */}
            <AddPatient onSaved={fetchPatients} />
          </div>

          {loading ? (
            <div className="text-muted-foreground py-12">Chargement…</div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-12">
              <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Aucun patient trouvé avec ces critères
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPatients.map((patient) => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  onViewDetails={setSelectedPatient}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <PatientDetails
        patient={selectedPatient}
        isOpen={!!selectedPatient}
        onClose={() => setSelectedPatient(null)}
      />
    </div>
  );
};

export default Index;
