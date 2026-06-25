const BASE = process.env.NEXT_PUBLIC_API_URL || ""

function buildHeaders(token: string | null, isSpecial: boolean, extra?: HeadersInit): Headers {
  const h = new Headers(extra);
  if (token) h.set("Authorization", `Bearer ${token}`);
  if (!isSpecial) h.set("Content-Type", "application/json");
  return h;
}

type RequestOpts = { method?: string; headers?: HeadersInit; body?: unknown; params?: Record<string, string> };

async function request<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const raw = opts.body;
  const isSpecial = raw instanceof FormData || raw instanceof URLSearchParams;
  let url = `${BASE}${path}`;
  if (opts.params) {
    const qs = new URLSearchParams(opts.params).toString();
    url += `?${qs}`;
  }
  const res = await fetch(url, {
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
    documents: (params?: Record<string, string>) => request<{ filename: string; chunk_count: number; created_at: string }[]>("/brain/documents", { params }),
    query: (query: string) =>
      request<{ response: string; sources: string[] }>("/brain/query", { method: "POST", body: { query } }),
  },
  leads: {
    list: (params?: Record<string, string>) => request<LeadOut[]>("/leads/", { params }),
    create: (body: { name?: string; phone?: string; email?: string; channel: string; channel_user_id: string }) =>
      request<LeadOut>("/leads/", { method: "POST", body }),
    get: (id: string) => request<LeadOut>(`/leads/${id}`),
    update: (id: string, body: { name?: string; phone?: string; email?: string; status?: string }) =>
      request<LeadOut>(`/leads/${id}`, { method: "PUT", body }),
    delete: (id: string) => request<{ status: string }>(`/leads/${id}`, { method: "DELETE" }),
  },
  conversations: {
    list: (params?: Record<string, string>) => request<ConversationOut[]>("/conversations/", { params }),
    messages: (leadId: string) => request<MessageOut[]>(`/conversations/${leadId}/messages`),
    toggleBot: (leadId: string) => request<{ bot_active: boolean }>(`/conversations/${leadId}/toggle-bot`, { method: "PATCH" }),
    sendManual: (leadId: string, content: string) => request<{ status: string; bot_active: boolean }>(`/conversations/${leadId}/send-manual`, { method: "POST", body: { content } }),
  },
  settings: {
    get: () => request<WorkspaceConfig>("/settings/"),
    update: (body: Partial<WorkspaceConfig>) => request<WorkspaceConfig>("/settings/", { method: "PUT", body }),
  },
  billing: {
    get: () => request<SubscriptionOut>("/billing/"),
    checkout: () => request<{ url: string }>("/billing/checkout", { method: "POST" }),
    portal: () => request<{ url: string }>("/billing/portal", { method: "POST" }),
  },
  catalog: {
    list: () => request<TemplateOut[]>("/catalog/"),
    get: (slug: string) => request<TemplateOut>(`/catalog/${slug}`),
  },
  operators: {
    list: () => request<OperatorInstanceOut[]>("/operators/"),
    get: (id: string) => request<OperatorInstanceOut>(`/operators/${id}`),
    create: (body: { template_slug: string; name: string; config: Record<string, unknown>; channels: { channel: string; external_id: string | null }[] }) =>
      request<OperatorInstanceOut>("/operators/", { method: "POST", body }),
    update: (id: string, body: { name?: string; config?: Record<string, unknown> }) =>
      request<OperatorInstanceOut>(`/operators/${id}`, { method: "PUT", body }),
    delete: (id: string) => request<{ status: string }>(`/operators/${id}`, { method: "DELETE" }),
  },
};

export interface UserOut {
  id: string; email: string; name: string; workspace_id: string;
}
export interface LeadOut {
  id: string; workspace_id: string; name: string | null; phone: string | null;
  email: string | null; channel: string; channel_user_id: string; status: string;
  sentiment: number; sentiment_label: string; bot_active: boolean;
  notes: string | null; created_at: string; updated_at: string;
  hs_contact_id: string | null; hs_last_sync: string | null;
}
export interface ConversationOut {
  lead_id: string; lead_name: string | null; channel: string; bot_active: boolean;
  sentiment: number; sentiment_label: string;
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
  hubspot_access_token: string | null;
  hubspot_portal_id: string | null;
}

export interface SubscriptionOut {
  id: string | null; workspace_id: string; plan: string; status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
}

export interface TemplateOut {
  id: string; slug: string; name: string; description: string | null;
  category: string; default_tools: string[]; default_channels: string[];
  config_schema: Record<string, unknown> | null; icon_url: string | null; version: string;
}

export interface OperatorInstanceOut {
  id: string; organization_id: string; template_id: string; name: string;
  config: Record<string, unknown> | null; system_prompt: string | null;
  webhook_token: string; model: string; status: string;
  created_at: string; deployed_at: string | null; updated_at: string | null;
  tools: { id: string; tool_type: string; config: Record<string, unknown> | null; is_enabled: boolean }[];
  channels: { id: string; channel: string; external_id: string | null; is_active: boolean }[];
}
