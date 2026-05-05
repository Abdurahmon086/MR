export interface User {
  id: string;
  email: string;
  role: "admin" | "doctor" | "nurse" | "patient";
  first_name: string;
  last_name: string;
  middle_name?: string;
  phone?: string;
  specialty?: string;
  preferred_lang: "uz" | "ru" | "en";
  avatar_url?: string;
  full_name: string;
}

export interface Patient {
  id: string;
  patient_code: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  birth_date: string;
  gender: "male" | "female" | "other";
  blood_type?: string;
  phone?: string;
  email?: string;
  address?: string;
  region?: string;
  district?: string;
  allergies?: string[];
  chronic_diseases?: string[];
  notes?: string;
  photo_url?: string;
  assigned_doctor_id?: string;
  created_at: string;
  full_name: string;
  age: number;
}

export interface Diagnosis {
  id: string;
  diagnosis_code: string;
  patient_id: string;
  doctor_id: string;
  visit_date: string;
  chief_complaint: string;
  anamnesis?: string;
  objective_data?: string;
  icd10_code?: string;
  icd10_name?: string;
  diagnosis_text: string;
  severity?: "mild" | "moderate" | "severe" | "critical";
  status: "initial" | "confirmed" | "revised" | "closed";
  treatment_plan?: string;
  follow_up_date?: string;
  is_ai_assisted: boolean;
  created_at: string;
}

export interface SkinImage {
  id: string;
  patient_id: string;
  diagnosis_id?: string;
  file_name: string;
  file_path: string;
  thumbnail_path?: string;
  file_size?: number;
  mime_type?: string;
  width?: number;
  height?: number;
  body_location?: string;
  created_at: string;
}

export interface AIResult {
  id: string;
  image_id: string;
  model_version: string;
  predicted_class: string;
  predicted_label: string;
  confidence: number;
  all_probabilities: Record<string, number>;
  risk_level: "low" | "medium" | "high" | "critical";
  processing_time_ms?: number;
  is_reviewed: boolean;
  doctor_agreement?: boolean;
  doctor_notes?: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  scheduled_at: string;
  duration_mins: number;
  type: string;
  status: string;
  notes?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface DashboardStats {
  total_patients: number;
  total_diagnoses: number;
  total_ai_analyses: number;
  today_appointments: number;
  new_patients_this_month: number;
}
