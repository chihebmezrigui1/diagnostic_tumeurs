// src/types/medecin.ts
export interface Medecin {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export interface LoginPayload {
  email: string;      // tu envoies l’email dans ton form
  password: string;
}

export interface AuthMe {
  user: Medecin;
  isAuthenticated: boolean;
}
