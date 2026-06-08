const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

function buildHeaders(token: string | null, isSpecial: boolean, extra?: HeadersInit): Headers {
  const h = new Headers(extra);
  if (token) h.set("Authorization", `Bearer ${token}`);
  if (!isSpecial) h.set("Content-Type", "application/json");
  return h;
}

type RequestOpts = { method?: string; headers?: HeadersInit; body?: unknown };

async function request<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const raw = opts.body;
  const isSpecial = raw instanceof FormData || raw instanceof URLSearchParams;
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method,
    headers: buildHeaders(token, isSpecial, opts.headers),
    body: raw != null ? (isSpecial ? raw : JSON.stringify(raw)) : undefined,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const text = await res.text();
  return text ? JSON.parse(text) : (null as T);
}

export const api = {
  auth: {
    register: (body: { email: string; password: string; name: string }) =>
      request<{ access_token: string; token_type: string }>("/auth/register", { method: "POST", body }),
    login: (form: { username: string; password: string }) =>
      request<{ access_token: string; token_type: string }>("/auth/login", {
        method: "POST",
        body: new URLSearchParams(form),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }),
    me: () => request<{ id: string; email: string; name: string; workspace_id: string }>("/auth/me"),
  },
  brain: {
    upload: (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return request<{ status: string; filename: string }>("/brain/upload", { method: "POST", body: fd });
    },
    documents: () => request<{ filename: string; chunk_count: number; created_at: string }[]>("/brain/documents"),
    query: (query: string) =>
      request<{ response: string; sources: string[] }>("/brain/query", { method: "POST", body: { query } }),
  },
  leads: {
    list: () => request<LeadOut[]>("/leads/"),
    create: (body: { name?: string; phone?: string; email?: string; channel: string; channel_user_id: string }) =>
      request<LeadOut>("/leads/", { method: "POST", body }),
    get: (id: string) => request<LeadOut>(`/leads/${id}`),
    update: (id: string, body: { name?: string; phone?: string; email?: string; status?: string }) =>
      request<LeadOut>(`/leads/${id}`, { method: "PUT", body }),
    delete: (id: string) => request<{ status: string }>(`/leads/${id}`, { method: "DELETE" }),
  },
  conversations: {
    list: () => request<ConversationOut[]>("/conversations/"),
    messages: (leadId: string) => request<MessageOut[]>(`/conversations/${leadId}/messages`),
    toggleBot: (leadId: string) => request<{ bot_active: boolean }>(`/conversations/${leadId}/toggle-bot`, { method: "PATCH" }),
    sendManual: (leadId: string, content: string) => request<{ status: string; bot_active: boolean }>(`/conversations/${leadId}/send-manual`, { method: "POST", body: { content } }),
  },
  settings: {
    get: () => request<WorkspaceConfig>("/settings/"),
    update: (body: Partial<WorkspaceConfig>) => request<WorkspaceConfig>("/settings/", { method: "PUT", body }),
  },
};

export interface UserOut {
  id: string; email: string; name: string; workspace_id: string;
}
export interface LeadOut {
  id: string; workspace_id: string; name: string | null; phone: string | null;
  email: string | null; channel: string; channel_user_id: string; status: string;
  notes: string | null; created_at: string; updated_at: string;
}
export interface ConversationOut {
  lead_id: string; lead_name: string | null; channel: string; bot_active: boolean;
  last_message: string | null; last_message_at: string; message_count: number;
}
export interface MessageOut {
  id: string; channel: string; from_user: string; content: string; direction: string;
  created_at: string; lead_id?: string;
}
export interface BrainDoc {
  filename: string; chunk_count: number; created_at: string;
}
export interface WorkspaceConfig {
  id: string; workspace_id: string;
  whatsapp_phone_number_id: string | null;
  whatsapp_access_token: string | null;
  whatsapp_verify_token: string | null;
  telegram_bot_token: string | null;
  openai_api_key: string | null;
}
