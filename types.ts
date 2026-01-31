export enum ActivityType {
  NURSING = 'NURSING',
  BOTTLE = 'BOTTLE',
  FOOD = 'FOOD',
  DIAPER = 'DIAPER',
  SLEEP = 'SLEEP',
  HEALTH = 'HEALTH',
  GROWTH = 'GROWTH',
  VACCINE = 'VACCINE',
  OTHER = 'OTHER'
}

export interface Caregiver {
  id: string;
  name: string;
  email: string;
  role: string;
  photoUrl: string;
  accessLevel: 'Owner' | 'Editor' | 'Viewer';
  status: 'pending' | 'approved';
  joinedAt: number;
  updatedAt: number;
}

export interface JoinRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  inviteCode: string;
  status: 'pending' | 'approved' | 'denied';
  timestamp: number;
}

export interface Child {
  id: string;
  name: string;
  dob: string;
  photoUrl: string;
  gender: 'boy' | 'girl';
  updatedAt: number;
  sleepStartTime?: number;
}

export interface LogEntry {
  id: string;
  childId: string;
  type: ActivityType;
  timestamp: number;
  details: string;
  value?: number;
  subType?: string;
  notes?: string;
  imageUrl?: string;
  updatedAt: number;
}

export interface VaccineAppointment {
  childId: string;
  vaccineName: string;
  plannedDate: string; // ISO date
}

export interface AppState {
  children: Child[];
  currentChildId: string;
  logs: LogEntry[];
  view: 'dashboard' | 'analytics' | 'diary' | 'settings';
}

export const INITIAL_CHILDREN: Child[] = [
  { id: 'c1', name: 'Leo', dob: '2023-09-15', photoUrl: 'https://picsum.photos/200?random=1', gender: 'boy', updatedAt: Date.now() }
];

export const VACCINE_SCHEDULE = [
  { month: 0, name: 'BCG (Bacillus Calmette-Guérin)' },
  { month: 0, name: 'Hepatitis B' },
  { month: 2, name: 'DTaP-IPV-HepB-Hib (Dose 1)' },
  { month: 3, name: 'DTaP-IPV-HepB-Hib (Dose 2)' },
  { month: 5, name: 'DTaP-IPV-HepB-Hib (Dose 3)' },
  { month: 6, name: 'Measles (Sabah only)' },
  { month: 9, name: 'MMR (Dose 1)' },
  { month: 9, name: 'Pneumococcal (PCV) (Dose 1)' },
  { month: 9, name: 'JE (Sarawak only)' },
  { month: 12, name: 'MMR (Dose 2)' },
  { month: 12, name: 'Pneumococcal (PCV) (Dose 2)' },
  { month: 12, name: 'JE (Sarawak only)' },
  { month: 15, name: 'Pneumococcal (PCV) (Booster)' },
  { month: 18, name: 'DTaP-IPV-HepB-Hib (Booster)' },
  { month: 21, name: 'JE (Booster)' },
  { month: 84, name: 'MR (Booster)' },
  { month: 84, name: 'DT (Booster)' },
  { month: 156, name: 'HPV (Girls only)' },
  { month: 180, name: 'ATT-Tetanus (Booster)' },
];
