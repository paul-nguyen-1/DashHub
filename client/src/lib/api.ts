const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// ---- Types ----

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

export interface ProcessResponse {
  file_id: string;
  filename: string;
  row_count: number;
  column_count: number;
  columns: Column[];
}

export interface ReportResponse {
  report: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatResponse {
  reply: string;
}

// ---- Client ----

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, init);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export const api = {
  /** Upload a CSV or TSV file. Returns a file_id for subsequent calls. */
  upload(file: File): Promise<UploadResponse> {
    const form = new FormData();
    form.append("file", file);
    return request<UploadResponse>("/upload", { method: "POST", body: form });
  },

  /** Detect column types and sample values for an uploaded file. */
  process(fileId: string): Promise<ProcessResponse> {
    return request<ProcessResponse>(`/process/${fileId}`);
  },

  /** Generate an AI executive report for an uploaded file. */
  generateReport(fileId: string): Promise<ReportResponse> {
    return request<ReportResponse>(`/ai/report/${fileId}`, { method: "POST" });
  },

  /** Send a chat message about an uploaded file. */
  chat(fileId: string, messages: ChatMessage[]): Promise<ChatResponse> {
    return request<ChatResponse>("/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file_id: fileId, messages }),
    });
  },
};
