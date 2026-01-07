// AddDiagnosis.tsx — version "IA automatique"
import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const API = axios.create({
  baseURL:
    (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, "") ||
    "http://localhost:8000/api",
});

interface AddDiagnosisProps {
  patientId: string;
  onSaved?: () => void;
  triggerClassName?: string;
}

export function AddDiagnosis({ patientId, onSaved, triggerClassName }: AddDiagnosisProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [notes, setNotes] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const submit = async () => {
    if (!imageFile) {
      toast.error("Choisis une image IRM.");
      return;
    }
    try {
      setLoading(true);
      const fd = new FormData();
      fd.append("patientId", patientId); // <-- attendu par PredictDiagnosisAPIView
      fd.append("image", imageFile);
      if (notes) fd.append("notes", notes);

      await API.post("/diagnosis/predict/", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Diagnostic créé par le modèle IA");
      setOpen(false);
      onSaved?.(); // recharge l’historique
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || e?.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button className={triggerClassName} onClick={() => setOpen(true)}>
        Nouveau diagnostic
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouveau diagnostic (IA)</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Image IRM</Label>
              <Input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
            </div>

            <div>
              <Label>Notes (optionnel)</Label>
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Annuler</Button>
              <Button onClick={submit} disabled={loading}>
                {loading ? "Analyse…" : "Analyser l’image"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
