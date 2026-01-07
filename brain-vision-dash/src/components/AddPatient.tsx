import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Upload, Brain } from "lucide-react";
import { toast } from "sonner";

type AddPatientProps = { onSaved?: () => void };

const API = axios.create({
  baseURL:
    (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, "") ||
    "http://localhost:8000/api",
  // NE PAS fixer "Content-Type" ici : axios gère le boundary tout seul pour FormData
});

interface AddPatientFormData {
  firstName: string;
  lastName: string;
  age: string;
  gender: "M" | "F" | "";
  dateOfBirth: string;
  phoneNumber: string;
  email: string;
  diagnosticImage: File | null;
  notes: string;
}

export const AddPatient: React.FC<AddPatientProps> = ({ onSaved }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<AddPatientFormData>({
    firstName: "",
    lastName: "",
    age: "",
    gender: "",
    dateOfBirth: "",
    phoneNumber: "",
    email: "",
    diagnosticImage: null,
    notes: "",
  });

  const handleInputChange = (field: keyof AddPatientFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, diagnosticImage: file }));
  };

  // --- Création patient + diagnostic en UNE requête (multipart) ---
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.age ||
      !formData.gender ||
      !formData.phoneNumber ||
      !formData.dateOfBirth
    ) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      setSaving(true);

      const today = new Date().toISOString().slice(0, 10);
      const fd = new FormData();
      fd.append("firstName", formData.firstName.trim());
      fd.append("lastName", formData.lastName.trim());
      fd.append("age", String(Number(formData.age)));
      fd.append("gender", formData.gender as "M" | "F");
      fd.append("dateOfBirth", formData.dateOfBirth);
      fd.append("phoneNumber", formData.phoneNumber.trim());
      if (formData.email) fd.append("email", formData.email);
      fd.append("lastVisit", today);
      fd.append("status", "active");
      if (formData.diagnosticImage) fd.append("image", formData.diagnosticImage);
      if (formData.notes) fd.append("notes", formData.notes);

      await API.post("/patients/register/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Patient créé (et diagnostic lancé si image fournie) ✅");

      // re-fetch liste dans le parent
      onSaved?.();

      // reset + close
      setFormData({
        firstName: "",
        lastName: "",
        age: "",
        gender: "",
        dateOfBirth: "",
        phoneNumber: "",
        email: "",
        diagnosticImage: null,
        notes: "",
      });
      setIsOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err.message || "Échec de l’enregistrement");
    } finally {
      setSaving(false);
    }
  };

  // (le bouton "Lancer le diagnostic IA" n'est plus nécessaire : c'est fait au submit)
  const handleDiagnostic = () => {
    toast.info("Le diagnostic est lancé automatiquement lors de l’enregistrement.");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter un patient
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Nouveau Patient
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations personnelles */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informations personnelles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom *</Label>
                  <Input id="firstName" value={formData.firstName}
                         onChange={(e) => handleInputChange("firstName", e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom *</Label>
                  <Input id="lastName" value={formData.lastName}
                         onChange={(e) => handleInputChange("lastName", e.target.value)} required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Âge *</Label>
                  <Input id="age" type="number" value={formData.age}
                         onChange={(e) => handleInputChange("age", e.target.value)}
                         min="0" max="120" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Sexe *</Label>
                  <Select value={formData.gender}
                          onValueChange={(value: "M" | "F") => handleInputChange("gender", value)}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Masculin</SelectItem>
                      <SelectItem value="F">Féminin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date de naissance *</Label>
                  <Input id="dateOfBirth" type="date" value={formData.dateOfBirth}
                         onChange={(e) => handleInputChange("dateOfBirth", e.target.value)} required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Téléphone *</Label>
                  <Input id="phoneNumber" type="tel" value={formData.phoneNumber}
                         onChange={(e) => handleInputChange("phoneNumber", e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={formData.email}
                         onChange={(e) => handleInputChange("email", e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Diagnostic IRM */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Diagnostic IRM</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="diagnosticImage">Image IRM (optionnelle)</Label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Input id="diagnosticImage" type="file" accept="image/*"
                           onChange={handleImageUpload} className="cursor-pointer" />
                  </div>
                  {formData.diagnosticImage && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Upload className="h-4 w-4" />
                      {formData.diagnosticImage.name}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes additionnelles</Label>
                <Textarea id="notes" value={formData.notes}
                          onChange={(e) => handleInputChange("notes", e.target.value)} rows={3} />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={handleDiagnostic}>
                  <Brain className="h-4 w-4 mr-2" />
                  Info : le diagnostic se lance à l’enregistrement
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer le patient"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
