export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: "M" | "F";
  dateOfBirth: string;
  phoneNumber: string;
  email?: string;
  diagnosis: Diagnosis;
  lastVisit: string;
  status: "active" | "follow-up" | "discharged";
}

export interface Diagnosis {
  id: string;
  patientId: string;
  date: string;
  tumorType: "glioma" | "meningioma" | "pituitary" | "no_tumor";
  confidence: number;
  severity?: "low" | "moderate" | "high";
  notes?: string;
  imageUrl?: string;
  modelVersion: string;
}

export type TumorTypeLabel = {
  [K in Diagnosis["tumorType"]]: {
    label: string;
    color: "success" | "warning" | "destructive" | "secondary";
  };
};