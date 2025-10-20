// frontend/src/lib/api.ts (обновлённый)
let token: string | null = localStorage.getItem("token");

export function setToken(t: string | null) {
  token = t;
  if (t) localStorage.setItem("token", t);
  else localStorage.removeItem("token");
}

const API = "http://192.168.1.85:5000";

/**
 * Базовый вызов API.
 * - Автоматически добавляет Authorization: Bearer <token>
 * - Для GET включает cache: no-store (если не переопределено)
 * - Не ставит Content-Type для FormData
 * - Бросает 401 → очищает токен и диспатчит 'app:logout'
 */
export async function api<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const method = (opts.method || "GET").toUpperCase();

  const isFormData = typeof FormData !== "undefined" && opts.body instanceof FormData;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...((opts.headers as any) || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const finalOpts: RequestInit = { ...opts, method, headers };
  if (method === "GET" && !("cache" in finalOpts)) finalOpts.cache = "no-store";

  const url = path.startsWith("http") ? path : `${API}${path}`;

  const res = await fetch(url, finalOpts);

  if (res.status === 401) {
    setToken(null);
    window.dispatchEvent(new Event("app:logout"));
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `${res.status} ${res.statusText}`);
  }
  if (res.status === 204) return {} as T;

  // если это не JSON (например, скачивание файла) — попытаться распарсить как JSON, иначе вернуть текст
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return (await res.json()) as T;
  }
  const text = await res.text();
  return text as unknown as T;
}

export const Reports = {
  list: (params: Record<string, any> = {}) =>
    api(`/api/reports${qs(params)}`) as Promise<{ items: any[]; total: number; page: number; limit: number }>,
  get: (id: string) => api(`/api/reports/${id}`),
  create: (data: any) => api(`/api/reports`, { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => api(`/api/reports/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) => api(`/api/reports/${id}`, { method: "DELETE" }),
  exportXlsx: (params: Record<string, any> = {}) =>
    api(`/api/reports/export/xlsx${qs(params)}`, { method: "GET" }), // вернётся blob как текст — тут проще сделать window.open
};
export async function apiBlob(path: string, opts: RequestInit = {}): Promise<Blob> {
  const method = (opts.method || "GET").toUpperCase();
  const headers: Record<string, string> = {
    Accept: "*/*",
    ...((opts.headers as any) || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const finalOpts: RequestInit = { ...opts, method, headers };
  const url = path.startsWith("http") ? path : `${API}${path}`;

  const res = await fetch(url, finalOpts);
  if (res.status === 401) {
    setToken(null);
    window.dispatchEvent(new Event("app:logout"));
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return await res.blob();
}

// Удобная обёртка именно для экспорта отчётов
export async function downloadReportsXlsx(params: Record<string, any> = {}) {
  const q = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
  ).toString();
  const blob = await apiBlob(`/api/reports/export/xlsx${q ? `?${q}` : ""}`);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "reports.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ===================== УТИЛИТЫ ===================== */

function qs(params: Record<string, any> = {}): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
  return entries.length ? `?${new URLSearchParams(entries as any).toString()}` : "";
}

/* ===================== API-МОДУЛИ ===================== */

// Профиль пользователя («О пользователе»)
export const Me = {
  get: () => api("/api/me"),
  patch: (data: { name?: string; telegram_id?: string }) =>
    api("/api/me", { method: "PATCH", body: JSON.stringify(data) }),
  changePassword: (data: { current_password: string; new_password: string }) =>
    api("/api/me/password", { method: "POST", body: JSON.stringify(data) }),
};

// Логи (для администратора)
export const AdminLogs = {
  list: (params: { limit?: number; offset?: number; entity?: string; entityId?: string } = {}) =>
    api(`/api/admin/logs${qs(params)}`),
};

// Проекты
export const Projects = {
  list: (params: { page?: number; limit?: number; q?: string } = {}) =>
    api(`/api/project${qs(params)}`) as Promise<{ items: any[]; total: number; page: number; limit: number }>,
  get: (id: string) => api(`/api/project/${id}`),
};

// Файлы проекта (вложения)
export const ProjectFiles = {
  list: (projectId: string) => api(`/api/projects/${projectId}/files`),
  upload: (projectId: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api(`/api/projects/${projectId}/files`, { method: "POST", body: fd });
  },
  delete: (fileId: string) => api(`/api/files/${fileId}`, { method: "DELETE" }),
};

// Задачи
export const Tasks = {
  list: (params: Record<string, any> = {}) =>
    api(`/api/task${qs(params)}`) as Promise<{ items: any[]; total: number; page: number; limit: number }>,
  get: (id: string) => api(`/api/task/${id}`),
  create: (data: any) => api(`/api/task`, { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => api(`/api/task/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) => api(`/api/task/${id}`, { method: "DELETE" }),
};
