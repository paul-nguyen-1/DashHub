const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export interface UploadResponse {
  file_id: string;
  filename: string;
  saved_as: string;
  size_bytes: number;
}

export interface Column {
  name: string;
  type: "text" | "number" | "date" | "boolean";
  sample_values: string[];
  null_count: number;
}

export interface SuggestedDashboard {
  id: string;
  label: string;
  description: string;
}

export interface ProcessResponse {
  file_id: string;
  filename: string;
  row_count: number;
  column_count: number;
  columns: Column[];
  suggested_dashboard: SuggestedDashboard;
}

export interface KpiStat {
  sum: number;
  mean: number;
  label: string;
}

export interface DashboardData {
  columns: {
    date: string | null;
    numeric: string[];
    dimensions: string[];
  };
  kpis: Record<string, KpiStat>;
  time_series: Record<string, string | number>[];
  breakdowns: Record<string, Record<string, string | number>[]>;
}

export interface ReportSection {
  title: string;
  type: 'paragraph' | 'bullets';
  content?: string;
  items?: string[];
}

export interface ReportResponse {
  sections: ReportSection[];
}

export interface InsightCard {
  id: string
  type: 'anomaly' | 'insight' | 'suggestion'
  title: string
  body: string
  action?: string | null
}

export interface InsightsResponse {
  insights: InsightCard[]
  quick_questions: string[]
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  reply: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, init);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export const api = {
  upload(file: File): Promise<UploadResponse> {
    const form = new FormData();
    form.append("file", file);
    return request<UploadResponse>("/upload", { method: "POST", body: form });
  },

  process(fileId: string): Promise<ProcessResponse> {
    return request<ProcessResponse>(`/process/${fileId}`);
  },

  getDashboard(fileId: string): Promise<DashboardData> {
    return request<DashboardData>(`/dashboard/${fileId}`);
  },

  generateReport(fileId: string): Promise<ReportResponse> {
    return request<ReportResponse>(`/ai/report/${fileId}`, { method: "POST" });
  },

  getInsights(fileId: string): Promise<InsightsResponse> {
    return request<InsightsResponse>(`/ai/insights/${fileId}`, { method: "POST" });
  },

  investigateAnomalies(fileId: string): Promise<ReportResponse> {
    return request<ReportResponse>(`/ai/investigate/${fileId}`, { method: "POST" });
  },

  chat(fileId: string, messages: ChatMessage[]): Promise<ChatResponse> {
    return request<ChatResponse>("/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_id: fileId, messages }),
    });
  },
};
