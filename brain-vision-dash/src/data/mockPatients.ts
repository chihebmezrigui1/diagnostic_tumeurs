import { Patient } from "@/types/patient";

export const mockPatients: Patient[] = [
  {
    id: "P001",
    firstName: "Marie",
    lastName: "Dubois",
    age: 45,
    gender: "F",
    dateOfBirth: "1978-03-15",
    phoneNumber: "+33 1 23 45 67 89",
    email: "marie.dubois@email.com",
    lastVisit: "2024-01-15",
    status: "active",
    diagnosis: {
      id: "D001",
      patientId: "P001",
      date: "2024-01-15",
      tumorType: "glioma",
      confidence: 0.92,
      severity: "high",
      notes: "Tumeur détectée dans le lobe frontal gauche. Recommandation : suivi immédiat par oncologue.",
      modelVersion: "v2.1"
    }
  },
  {
    id: "P002",
    firstName: "Jean",
    lastName: "Martin",
    age: 32,
    gender: "M",
    dateOfBirth: "1991-08-22",
    phoneNumber: "+33 1 98 76 54 32",
    email: "jean.martin@email.com",
    lastVisit: "2024-01-12",
    status: "follow-up",
    diagnosis: {
      id: "D002",
      patientId: "P002",
      date: "2024-01-12",
      tumorType: "no_tumor",
      confidence: 0.96,
      notes: "Aucune anomalie détectée. IRM normale.",
      modelVersion: "v2.1"
    }
  },
  {
    id: "P003",
    firstName: "Sophie",
    lastName: "Bernard",
    age: 58,
    gender: "F",
    dateOfBirth: "1965-12-03",
    phoneNumber: "+33 1 45 67 89 01",
    lastVisit: "2024-01-10",
    status: "active",
    diagnosis: {
      id: "D003",
      patientId: "P003",
      date: "2024-01-10",
      tumorType: "meningioma",
      confidence: 0.88,
      severity: "moderate",
      notes: "Méningiome bénin détecté. Surveillance recommandée.",
      modelVersion: "v2.1"
    }
  },
  {
    id: "P004",
    firstName: "Pierre",
    lastName: "Leroy",
    age: 67,
    gender: "M",
    dateOfBirth: "1956-05-18",
    phoneNumber: "+33 1 12 34 56 78",
    lastVisit: "2024-01-08",
    status: "discharged",
    diagnosis: {
      id: "D004",
      patientId: "P004",
      date: "2024-01-08",
      tumorType: "pituitary",
      confidence: 0.85,
      severity: "low",
      notes: "Adénome hypophysaire de petite taille. Traitement médical initié.",
      modelVersion: "v2.1"
    }
  },
  {
    id: "P005",
    firstName: "Claire",
    lastName: "Rousseau",
    age: 29,
    gender: "F",
    dateOfBirth: "1994-11-07",
    phoneNumber: "+33 1 87 65 43 21",
    email: "claire.rousseau@email.com",
    lastVisit: "2024-01-14",
    status: "active",
    diagnosis: {
      id: "D005",
      patientId: "P005",
      date: "2024-01-14",
      tumorType: "no_tumor",
      confidence: 0.94,
      notes: "Examen de contrôle post-traumatique. Aucune anomalie.",
      modelVersion: "v2.1"
    }
  }
];