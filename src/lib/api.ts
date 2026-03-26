let token: string | null = localStorage.getItem("token");

export function setToken(t: string | null) {
  token = t;
  if (t) localStorage.setItem("token", t);
  else localStorage.removeItem("token");
}

/* Базы из .env */
const API_BASE  = import.meta.env.VITE_API_BASE  ?? "/api";
const AUTH_BASE = import.meta.env.VITE_AUTH_BASE ?? "/auth";

/* База для API */
const BASE = API_BASE;

function buildUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;

  // Нормализуем путь
  let p = path.startsWith("/") ? path : `/${path}`;

  // Если авторизация пришла как /api/auth/... - снимаем /api
  if (p.startsWith("/api/auth/")) p = p.replace(/^\/api/, ""); // => /auth/...

  // /auth/... отдаём как есть (проксируется отдельным блоком)
  if (p.startsWith("/auth/")) return p;

  // /api/... тоже отдаём как есть
  if (p.startsWith("/api/")) return p;

  // остальным добавляем /api
  return `${BASE}${p}`;
}

/* Базовый вызов API */
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

  const url = buildUrl(path);

  const res = await fetch(url, finalOpts);

  if (res.status === 401) {
    setToken(null);
    window.dispatchEvent(new Event("app:logout"));
    throw new Error("Unauthorized");
  }
  if (res.status === 403) {
    const text = await res.text().catch(() => "");
    const message = text || "У вас недостаточно прав";

    window.dispatchEvent(
      new CustomEvent("app:forbidden", {
        detail: { message },
      })
    );

    throw new Error(message);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `${res.status} ${res.statusText}`);
  }
  if (res.status === 204) return {} as T;

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return (await res.json()) as T;
  }
  const text = await res.text();
  return text as unknown as T;
}

export async function apiBlob(path: string, opts: RequestInit = {}): Promise<Blob> {
  const method = (opts.method || "GET").toUpperCase();
  const headers: Record<string, string> = {
    Accept: "*/*",
    ...((opts.headers as any) || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const finalOpts: RequestInit = { ...opts, method, headers };
  const url = buildUrl(path);

  const res = await fetch(url, finalOpts);
  if (res.status === 401) {
    setToken(null);
    window.dispatchEvent(new Event("app:logout"));
    throw new Error("Unauthorized");
  }
  if (res.status === 403) {
    const text = await res.text().catch(() => "");
    const message = text || "У вас недостаточно прав";

    window.dispatchEvent(
      new CustomEvent("app:forbidden", {
        detail: { message },
      })
    );

    throw new Error(message);
  }
  
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return await res.blob();

}



/* утилиты */

function qs(params: Record<string, any> = {}): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "");
  return entries.length ? `?${new URLSearchParams(entries as any).toString()}` : "";
}

/* API */

export type MeInfo = {
  id: string;
  name?: string;
  login?: string;
  telegram_id?: string;
  role?: string;
  permissions?: string[];
  company?: { id?: string | null; name?: string };
};


// Отчёты
export const Reports = {
  list: (params: Record<string, any> = {}) =>
    api(`/api/reports${qs(params)}`) as Promise<{ items: any[]; total: number; page: number; limit: number }>,
  get: (id: string) => api(`/api/reports/${id}`),
  create: (data: any) => api(`/api/reports`, { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: any) => api(`/api/reports/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  remove: (id: string) => api(`/api/reports/${id}`, { method: "DELETE" }),
  exportXlsx: (params: Record<string, any> = {}) =>
    api(`/api/reports/export/xlsx${qs(params)}`, { method: "GET" }),
};

// Скачивание отчётов
export async function downloadReportsXlsx(params: Record<string, any> = {}) {
  const q = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
  ).toString();

  const blob = await apiBlob(`/api/reports/export/xlsx${q ? `?${q}` : ""}`);
  const url = URL.createObjectURL(blob);

  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = String(now.getFullYear());
  const filename = `Отчеты_${dd}_${mm}_${yyyy}.xlsx`;

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function downloadTimesheetXlsx(
  params: Record<string, any> = {},
  filename = "Табель.xlsx"
) {
  const q = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "")
  ).toString();
  const blob = await apiBlob(`/api/reports/timesheet/xlsx${q ? `?${q}` : ""}`);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const Shipments = {
  exportSectionXlsx: (sectionId: string) =>
    apiBlob(`/api/ship/sections/${sectionId}/export`),

  importSectionXlsx: (sectionId: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api(`/api/ship/sections/${sectionId}/import`, {
      method: "POST",
      body: fd as any,
    });
  },
};

// Скачивание бинарника (Excel)
export async function downloadBlob(path: string): Promise<Blob> {
  const blob = await apiBlob(path);
  return blob;
}

// Профиль
export const Me = {
  get: () => api<MeInfo>("/api/me"),
  patch: (data: { name?: string; telegram_id?: string }) =>
    api("/api/me", { method: "PATCH", body: JSON.stringify(data) }),
  changePassword: (data: { current_password: string; new_password: string }) =>
    api("/api/me/password", { method: "POST", body: JSON.stringify(data) }),
};

// Админ-логи
export const AdminLogs = {
  list: (params: { limit?: number; offset?: number; entity?: string; entityId?: string } = {}) =>
    api(`/api/admin/logs${qs(params)}`),
};


export const AdminUsers = {
  list: () => api<{ items: any[] }>("/api/admin/users"),
  permissions: () => api<{ items: { key: string; label: string }[] }>("/api/admin/users/permissions"),
  update: (id: string, data: { permissions?: string[]; name?: string }) =>
    api(`/api/admin/users/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
};

// Проекты
export const Projects = {
  list: (params: { page?: number; limit?: number; q?: string } = {}) =>
    api(`/api/project${qs(params)}`) as Promise<{ items: any[]; total: number; page: number; limit: number }>,
  get: (id: string) => api(`/api/project/${id}`),
};

// Файлы проекта
export const ProjectFiles = {
  list: (projectId: string) => api(`/api/projects/${projectId}/files`),
  upload: (projectId: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api(`/api/projects/${projectId}/files`, { method: "POST", body: fd });
  },
  delete: (fileId: string) => api(`/api/files/${fileId}`, { method: "DELETE" }),
};

// Файлы сотрудника
export const PersonFiles = {
  list: (personId: string) => api(`/api/person/${personId}/files`),
  upload: (personId: string, file: File, meta?: { kind?: string; description?: string }) => {
    const fd = new FormData();
    fd.append("file", file);
    if (meta?.kind) fd.append("kind", meta.kind);
    if (meta?.description) fd.append("description", meta.description);
    return api(`/api/person/${personId}/files`, { method: "POST", body: fd as any });
  },
  download: (fileId: string) => apiBlob(`/api/person-files/${fileId}/download`),
  delete: (fileId: string) => api(`/api/person-files/${fileId}`, { method: "DELETE" }),
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

// Спецификации
export const Specs = {
  listSections:   (projectId: string) => api(`/api/projects/${projectId}/spec/sections`),
  createSection:  (projectId: string, data: any) => api(`/api/projects/${projectId}/spec/sections`, { method: "POST", body: JSON.stringify(data) }),
  updateSection:  (id: string, data: any) => api(`/api/spec/sections/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteSection:  (id: string) => api(`/api/spec/sections/${id}`, { method: "DELETE" }),

  listItems:      (projectId: string, deleted = false) => api(`/api/projects/${projectId}/spec/items?deleted=${deleted?1:0}`),
  createItem:     (projectId: string, data: any) => api(`/api/projects/${projectId}/spec/items`, { method: "POST", body: JSON.stringify(data) }),
  commitItem:     (id: string, data: any) => api(`/api/spec/items/${id}`, { method: "PATCH", body: JSON.stringify({ commit: true, data }) }),
  setItemVersion: (id: string, v: number) => api(`/api/spec/items/${id}`, { method: "PATCH", body: JSON.stringify({ setActiveVersion: v }) }),
  updateItem:     (id: string, data: any) => api(`/api/spec/items/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteForever:  (id: string) => api(`/api/spec/items/${id}`, { method: "DELETE" }),
  reorder:        (data: { sectionId: string; itemId: string; targetParentId?: string | null; targetIndex: number }) =>
    api(`/api/spec/reorder`, { method: "POST", body: JSON.stringify(data) }),
};

/* login и getPersons */

export async function login(email: string, password: string) {
  return api(`${AUTH_BASE}/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getPersons(q = "") {
  return api(`${API_BASE}/person${q}`);
}