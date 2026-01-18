
export enum VaccineType {
  OZEMPIC = 'Ozempic',
  MOUNJARO = 'Mounjaro'
}

export interface WeightEntry {
  id: string;
  userId: string;
  weight: number;
  date: string;
  photoUrl?: string;
}

export interface VaccineDose {
  id: string;
  userId: string;
  type: VaccineType;
  doseMg: number;
  date: string;
  notes?: string;
}

export interface UserAccount {
  id: string;
  email: string;
  password?: string; // In a real app, this wouldn't be stored like this
  name: string;
  initialWeight: number;
  targetWeight: number;
  startDate: string;
  isSubscribed: boolean;
  trialStartedAt: string;
}

export type TabType = 'dashboard' | 'weight' | 'vaccines' | 'profile';
