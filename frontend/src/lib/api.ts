import axios from "axios";
import Cookies from "js-cookie";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = Cookies.get("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = Cookies.get("refresh_token");
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refresh_token: refresh });
          Cookies.set("access_token", data.access_token, { expires: 1 });
          original.headers.Authorization = `Bearer ${data.access_token}`;
          return api(original);
        } catch {
          Cookies.remove("access_token");
          Cookies.remove("refresh_token");
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  me: () => api.get("/auth/me"),
  updateMe: (data: object) => api.patch("/auth/me", data),
};

// Patients
export const patientsApi = {
  list: (params?: object) => api.get("/patients", { params }),
  get: (id: string) => api.get(`/patients/${id}`),
  create: (data: object) => api.post("/patients", data),
  update: (id: string, data: object) => api.patch(`/patients/${id}`, data),
  delete: (id: string) => api.delete(`/patients/${id}`),
};

// Diagnoses
export const diagnosesApi = {
  list: (params?: object) => api.get("/diagnoses", { params }),
  get: (id: string) => api.get(`/diagnoses/${id}`),
  create: (data: object) => api.post("/diagnoses", data),
  update: (id: string, data: object) => api.patch(`/diagnoses/${id}`, data),
  delete: (id: string) => api.delete(`/diagnoses/${id}`),
};

// Images
export const imagesApi = {
  upload: (formData: FormData) =>
    api.post("/images/upload", formData, { headers: { "Content-Type": "multipart/form-data" } }),
  get: (id: string) => api.get(`/images/${id}`),
  delete: (id: string) => api.delete(`/images/${id}`),
  downloadUrl: (id: string) => `${API_BASE}/images/${id}/download`,
  imageUrl: (filePath: string) => `${API_BASE.replace("/api/v1", "")}/uploads/${filePath}`,
};

// AI
export const aiApi = {
  analyze: (imageId: string) => api.post("/ai/analyze", null, { params: { image_id: imageId } }),
  getResult: (resultId: string) => api.get(`/ai/results/${resultId}`),
  review: (resultId: string, data: object) => api.patch(`/ai/results/${resultId}/review`, null, { params: data }),
  statistics: () => api.get("/ai/statistics"),
  modelInfo: () => api.get("/ai/model-info"),
  patientResults: (patientId: string) => api.get(`/ai/patient/${patientId}/results`),
};

// Dashboard
export const dashboardApi = {
  stats: () => api.get("/dashboard/stats"),
  byClass: () => api.get("/dashboard/charts/diagnoses-by-class"),
  ageDistribution: () => api.get("/dashboard/charts/age-distribution"),
  severityTrend: () => api.get("/dashboard/charts/severity-trend"),
  recentActivity: () => api.get("/dashboard/recent-activity"),
  todayAppointments: () => api.get("/dashboard/appointments/today"),
};

// Reports
export const reportsApi = {
  generate: (data: object) => api.post("/reports/generate", data),
  list: () => api.get("/reports"),
  get: (id: string) => api.get(`/reports/${id}`),
  downloadUrl: (id: string) => `${API_BASE}/reports/${id}/download`,
  download: async (id: string, filename = `report_${id}.pdf`) => {
    const res = await api.get(`/reports/${id}/download`, { responseType: "blob" });
    const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },
};

// Appointments
export const appointmentsApi = {
  list: (params?: object) => api.get("/appointments", { params }),
  create: (data: object) => api.post("/appointments", data),
  update: (id: string, data: object) => api.patch(`/appointments/${id}`, data),
};

// Users (admin)
export const usersApi = {
  list: () => api.get("/users"),
  doctors: () => api.get("/users/doctors"),
  create: (data: object) => api.post("/users", data),
  delete: (id: string) => api.delete(`/users/${id}`),
};
