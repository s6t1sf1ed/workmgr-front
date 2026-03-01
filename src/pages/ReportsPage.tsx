import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Reports, api, downloadReportsXlsx } from "../lib/api";

/* хелперы */

type Tab = "all" | "arch";
type Person = {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  name?: string;
  surname?: string;
  patronymic?: string;
  telegramId?: string | number;
  telegram_id?: string | number;
  email?: string;
};
type Project = { _id?: string; id?: string; name: string };

function idOf(x?: { _id?: string; id?: string }) {
  return (x?._id || x?.id || "") as string;
}
function displayName(p?: Person) {
  if (!p) return "";
  const ln = String(p.lastName || p.surname || "").trim();
  const fn = String(p.firstName || p.name || "").trim();
  return [ln, fn].filter(Boolean).join(" ");
}
function telegramOf(p?: Person) {
  if (!p) return "";
  const v = p.telegramId ?? p.telegram_id ?? "";
  return v === null || v === undefined ? "" : String(v);
}

function toInputDT(iso: string | Date | null | undefined) {
  if (!iso) return "";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getUTCFullYear();
  const mm   = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd   = String(d.getUTCDate()).padStart(2, "0");
  const HH   = String(d.getUTCHours()).padStart(2, "0");
  const MM   = String(d.getUTCMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${HH}:${MM}`;
}

function inputToIsoUTC(v: string): string | null {
  if (!v) return null;
  const [datePart, timePart] = v.split("T");
  if (!datePart || !timePart) return null;
  return `${datePart}T${timePart}:00Z`;
}

// Блок даты/времени:
function fmtDateBlock(start?: string, end?: string) {
  if (!start) return "-";
  const s = new Date(start);
  if (Number.isNaN(s.getTime())) return "-";
  const dd = String(s.getUTCDate()).padStart(2, "0");
  const mm = String(s.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = s.getUTCFullYear();
  const sH = String(s.getUTCHours()).padStart(2, "0");
  const sM = String(s.getUTCMinutes()).padStart(2, "0");

  let second = "—";
  if (end) {
    const e = new Date(end);
    if (!Number.isNaN(e.getTime())) {
      second = `${String(e.getUTCHours()).padStart(2, "0")}:${String(
        e.getUTCMinutes()
      ).padStart(2, "0")}`;
    }
  }
  return `${dd}.${mm}.${yyyy}\n${sH}:${sM}-${second}`;
}

function fmtDuration(start?: string, end?: string) {
  if (!start || !end) return "-";
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  if (isNaN(s) || isNaN(e) || e < s) return "-";
  const mins = Math.floor((e - s) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

/* иконки */
const Icon = {
  Pencil: (p: any) => (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden {...p}>
      <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm14.71-9.04a1 1 0 000-1.41l-1.51-1.49a1 1 0 00-1.41 0l-1.34 1.34 3.75 3.75 1.51-1.49z"/>
    </svg>
  ),
  Archive: (p: any) => (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden {...p}>
      <path fill="currentColor" d="M3 3h18v4H3V3zm2 6h14v12H5V9zm3 3v2h8v-2H8z"/>
    </svg>
  ),
  Unarchive: (p: any) => (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden {...p}>
      <path fill="currentColor" d="M20 7V3H4v4h16zM6 9в10h12V9H6zm6 7l-4-4h3V9h2v3h3l-4 4z"/>
    </svg>
  ),
  Trash: (p: any) => (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden {...p}>
      <path fill="currentColor" d="M6 19a2 2 0 002 2h8a2 2 0 002-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
    </svg>
  ),
  Funnel: (p: any) => (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden {...p}>
      <path fill="currentColor" d="M3 5h18l-7 8v6l-4-2v-4L3 5z"/>
    </svg>
  ),
  Plus: (p: any) => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden {...p}>
      <path fill="currentColor" d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2h6z"/>
    </svg>
  ),
  Log: (p: any) => (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden {...p}>
      <path fill="currentColor" d="M6 4h11a1 1 0 011 1v14H6a2 2 0 01-2-2V6a2 2 0 012-2zm1 4h9v2H7V8zm0 4h9v2H7v-2zm0 4h5v2H7v-2z"/>
    </svg>
  ),
};

const WEEKDAYS_RU_UI = [
  "Воскресенье",
  "Понедельник",
  "Вторник",
  "Среда",
  "Четверг",
  "Пятница",
  "Суббота",
];

function fmtWeekday(start?: string) {
  if (!start) return "-";
  const d = new Date(start);
  if (Number.isNaN(d.getTime())) return "-";
  const idx = d.getUTCDay(); // 0..6
  return WEEKDAYS_RU_UI[idx] || "-";
}

/* поповер */

function usePosition(anchor: HTMLElement | null, align: "start" | "center" | "end") {
  const [style, setStyle] = useState<React.CSSProperties>({ position: "fixed", top: -9999, left: -9999 });

  const reposition = React.useCallback(() => {
    if (!anchor) return;
    const r = anchor.getBoundingClientRect();
    let left = r.left;
    if (align === "center") left = r.left + r.width / 2;
    if (align === "end") left = r.right;
    setStyle({
      position: "fixed",
      top: r.bottom + 6,
      left,
      transform: align === "center" ? "translateX(-50%)" : align === "end" ? "translateX(-100%)" : "none",
      zIndex: 60,
      maxHeight: "70vh",
    });
  }, [anchor, align]);

  useEffect(() => {
    reposition();
  }, [reposition]);

  useEffect(() => {
    if (!anchor) return;
    const onSR = () => reposition();
    window.addEventListener("scroll", onSR, true);
    window.addEventListener("resize", onSR, true);
    return () => {
      window.removeEventListener("scroll", onSR, true);
      window.removeEventListener("resize", onSR, true);
    };
  }, [anchor, reposition]);

  return style;
}

function PopoverPortal({
  open,
  anchorEl,
  onClose,
  align = "end",
  children,
  className = "",
}: {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  align?: "start" | "center" | "end";
  children: React.ReactNode;
  className?: string;
}) {
  const style = usePosition(anchorEl, align);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t)) return;
      if (anchorEl && anchorEl.contains(t)) return;
      onClose();
    };
    document.addEventListener("pointerdown", onPointerDown, { capture: true });
    return () => document.removeEventListener("pointerdown", onPointerDown, { capture: true });
  }, [open, onClose, anchorEl]);

  if (!open) return null;
  return createPortal(
    <div
      ref={panelRef}
      style={style}
      onPointerDown={(e) => e.stopPropagation()}
      className={`rounded-xl border bg-white p-3 shadow-xl ${className}`}
    >
      {children}
    </div>,
    document.body
  );
}

/* модалка */

function EditModal({
  report,
  onClose,
  onSaved,
  isCreate = false,
}: {
  report: any;
  onClose: () => void;
  onSaved: () => void;
  isCreate?: boolean;
}) {
  const [saving, setSaving] = useState(false);
  const [persons, setPersons] = useState<Person[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const LS_ONLY_ACTIVE_PERSONS  = "ui.reports.filter.person.onlyActive";
  const LS_ONLY_ACTIVE_PROJECTS = "ui.reports.filter.project.onlyActive";

  const [onlyActivePersonsEM, setOnlyActivePersonsEM] = useState<boolean>(() => {
    return (localStorage.getItem(LS_ONLY_ACTIVE_PERSONS) ?? "1") !== "0";
  });
  const [onlyActiveProjectsEM, setOnlyActiveProjectsEM] = useState<boolean>(() => {
    return (localStorage.getItem(LS_ONLY_ACTIVE_PROJECTS) ?? "1") !== "0";
  });

  // загрузка справочников
  async function loadPersonsEM(onlyActive: boolean) {
    try {
      if (onlyActive) {
        const r = await api("/api/person?archived=0&limit=2000");
        setPersons((r?.items || r || []) as Person[]);
        return;
      }
      // активные и архивные
      const [a0, a1] = await Promise.all([
        api("/api/person?archived=0&limit=2000"),
        api("/api/person?archived=1&limit=2000"),
      ]);
      const items = ([...(a0?.items || a0 || []), ...(a1?.items || a1 || [])] as Person[]);
      const byId = new Map<string, Person>();
      for (const p of items) byId.set(String((p as any)?._id || (p as any)?.id || ""), p);
      setPersons([...byId.values()]);
    } catch {
      // фолбэк на /api/users
      if (onlyActive) {
        const r2 = await api("/api/users?archived=0");
        setPersons((r2?.items || r2 || []) as Person[]);
        return;
      }
      const [u0, u1] = await Promise.all([
        api("/api/users?archived=0"),
        api("/api/users?archived=1"),
      ]);
      const items = ([...(u0?.items || u0 || []), ...(u1?.items || u1 || [])] as Person[]);
      const byId = new Map<string, Person>();
      for (const p of items) byId.set(String((p as any)?._id || (p as any)?.id || ""), p);
      setPersons([...byId.values()]);
    }
  }

  async function loadProjectsEM(onlyActive: boolean) {
    if (onlyActive) {
      const pr = await api("/api/project?archived=0&limit=2000");
      setProjects((pr?.items || pr || []) as Project[]);
      return;
    }
    const [p0, p1] = await Promise.all([
      api("/api/project?archived=0&limit=2000"),
      api("/api/project?archived=1&limit=2000"),
    ]);
    const items = ([...(p0?.items || p0 || []), ...(p1?.items || p1 || [])] as Project[]);
    const byId = new Map<string, Project>();
    for (const p of items) byId.set(String((p as any)?._id || (p as any)?.id || ""), p);
    setProjects([...byId.values()]);
  }

  // первичная загрузка
  useEffect(() => {
    loadPersonsEM(onlyActivePersonsEM);
    loadProjectsEM(onlyActiveProjectsEM);
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_ONLY_ACTIVE_PERSONS, onlyActivePersonsEM ? "1" : "0");
    loadPersonsEM(onlyActivePersonsEM);
  }, [onlyActivePersonsEM]);

  useEffect(() => {
    localStorage.setItem(LS_ONLY_ACTIVE_PROJECTS, onlyActiveProjectsEM ? "1" : "0");
    loadProjectsEM(onlyActiveProjectsEM);
  }, [onlyActiveProjectsEM]);

  const [form, setForm] = useState(() => ({
    personId: report.person?.id || report.person_id || report.user_id || "",
    projectId: report.project?.id || report.project_id || "",
    start_time: toInputDT(report.start_time || new Date()),
    end_time: toInputDT(report.end_time),
    text_report: report.text_report || "",
    photo_link: report.photo_link || "",
    archived: !!report.archived,
  }));

  const currentPerson = useMemo(
    () => persons.find((p) => idOf(p) === form.personId),
    [persons, form.personId]
  );

  useEffect(() => {
    (async () => {
      try {
        const r1 = await api("/api/person?archived=0&limit=2000");
        setPersons((r1?.items || r1 || []) as Person[]);
      } catch {
        // фолбэк если /api/person недоступен
        const r2 = await api("/api/users?archived=0");
        setPersons((r2?.items || r2 || []) as Person[]);
      }

      const pr = await api("/api/project?archived=0&limit=2000");
      setProjects((pr?.items || pr || []) as Project[]);
    })();
  }, []);


  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    setSaving(true);
    try {
      const origStartStr = toInputDT(report.start_time || null);
      const origEndStr   = toInputDT(report.end_time   || null);

      const currStartStr = form.start_time || "";
      const currEndStr   = form.end_time   || "";

      const payload: any = {
        person_id:  form.personId || null,
        user_id:    form.personId || null,
        project_id: form.projectId || null,
        text_report: form.text_report ?? "",
        photo_link:  form.photo_link ?? "",
        archived: !!form.archived,
      };

      const isoStartUTC = currStartStr ? inputToIsoUTC(currStartStr) : null;
      const isoEndUTC   = currEndStr   ? inputToIsoUTC(currEndStr)   : null;

      if (isCreate) {
        if (isoStartUTC) payload.start_time = isoStartUTC;
        if (isoEndUTC)   payload.end_time   = isoEndUTC;
        await Reports.create(payload);
      } else {
        if (currStartStr !== origStartStr) {
          payload.start_time = isoStartUTC; // null - очистим поле
        }
        if (currEndStr !== origEndStr) {
          payload.end_time = isoEndUTC;
        }
        await Reports.update(report._id, payload);
      }

      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-[min(980px,96vw)] rounded-2xl bg-white p-6 shadow-2xl">
        <div className="text-lg font-semibold mb-4">{isCreate ? "Создание отчёта" : "Карточка отчета"}</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">Сотрудник</span>
            <select
              className="rounded-xl border px-3 py-2"
              value={form.personId}
              onChange={(e) => set("personId", e.target.value)}
            >
              <option value="">- не выбран -</option>
              {(onlyActivePersonsEM ? persons.filter((p: any) => !p?.archived) : persons)
                .slice()
                .sort((a, b) => displayName(a).localeCompare(displayName(b), "ru"))
                .map((p) => (
                  <option key={idOf(p)} value={idOf(p)}>
                    {(displayName(p) || (p as any).email || idOf(p)) + ((p as any)?.archived ? " (архив)" : "")}
                  </option>
              ))}
            </select>

            <label className="mt-1 flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={onlyActivePersonsEM}
                onChange={(e) => setOnlyActivePersonsEM(e.target.checked)}
              />
              <span>Только активные</span>
            </label>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">Telegram ID</span>
            <input
              className="rounded-xl border px-3 py-2 bg-muted/30"
              value={telegramOf(currentPerson) || "-"}
              disabled
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">Проект</span>
            <select
              className="rounded-xl border px-3 py-2"
              value={form.projectId}
              onChange={(e) => set("projectId", e.target.value)}
            >
              <option value="">- не выбран -</option>
              {(onlyActiveProjectsEM ? projects.filter((p: any) => !p?.archived) : projects)
                .slice()
                .sort((a, b) => {
                  const an = String((a as any).name || idOf(a) || "");
                  const bn = String((b as any).name || idOf(b) || "");
                  return an.localeCompare(bn, "ru");
                })
                .map((p) => (
                  <option key={idOf(p)} value={idOf(p)}>
                    {((p as any).name || idOf(p)) + ((p as any)?.archived ? " (архив)" : "")}
                  </option>
              ))}
            </select>

            <label className="mt-1 flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={onlyActiveProjectsEM}
                onChange={(e) => setOnlyActiveProjectsEM(e.target.checked)}
              />
              <span>Только активные</span>
            </label>
          </label>

          <label className="flex items-center gap-2 mt-6">
            <input
              type="checkbox"
              checked={form.archived}
              onChange={(e) => set("archived", e.target.checked)}
            />
            <span className="text-sm">В архиве</span>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">Начало</span>
            <input
              type="datetime-local"
              className="rounded-xl border px-3 py-2"
              value={form.start_time}
              onChange={(e) => set("start_time", e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">Конец</span>
            <input
              type="datetime-local"
              className="rounded-xl border px-3 py-2"
              value={form.end_time}
              onChange={(e) => set("end_time", e.target.value)}
            />
          </label>

          <label className="md:col-span-2 flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">Текст отчета</span>
            <textarea
              rows={5}
              className="rounded-xl border px-3 py-2"
              value={form.text_report}
              onChange={(e) => set("text_report", e.target.value)}
            />
          </label>

          <label className="md:col-span-2 flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">Ссылка на медиа</span>
            <input
              className="rounded-xl border px-3 py-2"
              placeholder="https://..."
              value={form.photo_link}
              onChange={(e) => set("photo_link", e.target.value)}
            />
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button className="rounded-xl border px-4 py-2" onClick={onClose}>
            Закрыть
          </button>
          <button
            className="rounded-xl border px-4 py-2 bg-muted/50"
            onClick={save}
            disabled={saving}
          >
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      </div>
    </div>
  );
}

type WidthMap = Record<string, number>;
const WKEY = "ui.reports.colwidths";

function useResizableColumns(ids: string[], defaults: WidthMap = {}) {
  const [widths, setWidths] = useState<WidthMap>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(WKEY) || "{}") as WidthMap;
      const filtered: WidthMap = {};
      for (const id of ids) filtered[id] = saved[id] ?? defaults[id] ?? 0;
      return filtered;
    } catch {
      const initial: WidthMap = {};
      for (const id of ids) initial[id] = defaults[id] ?? 0;
      return initial;
    }
  });

  useEffect(() => {
    setWidths((prev) => {
      const next: WidthMap = {};
      for (const id of ids) next[id] = prev[id] ?? defaults[id] ?? 0;
      return next;
    });
  }, [ids.join("|")]);

  useEffect(() => {
    localStorage.setItem(WKEY, JSON.stringify(widths));
  }, [widths]);

  const startRef = useRef<{ id: string; startX: number; startW: number } | null>(null);

  function onMouseDown(e: React.MouseEvent, id: string) {
    const th = (e.currentTarget as HTMLDivElement).parentElement as HTMLTableCellElement;
    const rect = th.getBoundingClientRect();
    startRef.current = { id, startX: e.clientX, startW: rect.width };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }
  function onMove(e: MouseEvent) {
    const s = startRef.current;
    if (!s) return;
    const delta = e.clientX - s.startX;
    const w = Math.max(80, s.startW + delta);
    setWidths((m) => ({ ...m, [s.id]: w }));
  }
  function onUp() {
    startRef.current = null;
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", onUp);
  }

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  function autosize(id: string) {
    const cells = document.querySelectorAll<HTMLElement>(`[data-col="${id}"]`);
    let max = 80;
    cells.forEach((el) => {
      const prevW = el.style.width;
      el.style.width = "max-content";
      max = Math.max(max, Math.ceil(el.getBoundingClientRect().width));
      el.style.width = prevW;
    });
    setWidths((m) => ({ ...m, [id]: max + 16 }));
  }

  const styleFor = (id: string) => (widths[id] ? { width: `${widths[id]}px` } : undefined);
  const Resizer = ({ id }: { id: string }) => (
    <div
      onMouseDown={(e) => onMouseDown(e, id)}
      onDoubleClick={() => autosize(id)}
      title="Потяните, чтобы изменить ширину. Двойной клик — автоподгон."
      className="absolute top-0 right-0 h-full w-3 cursor-col-resize select-none"
      style={{
        transform: "translateX(50%)",
        background: "linear-gradient(to right, transparent 45%, rgba(0,0,0,0.18) 50%, transparent 55%)",
        opacity: 0.55,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.opacity = "0.85";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.opacity = "0.55";
      }}
      />
  );

  return { styleFor, Resizer };
}

type ColId = "tg" | "person" | "project" | "dt" | "weekday" | "hours" | "text" | "photo" | "actions";
const COL_DEFS: { id: ColId; label: string; default: boolean }[] = [
  { id: "tg", label: "Telegram ID", default: true },
  { id: "person", label: "Сотрудник", default: true },
  { id: "project", label: "Проект", default: true },
  { id: "dt", label: "Дата / время", default: true },
  { id: "weekday", label: "День недели", default: true },
  { id: "hours", label: "Часы", default: true },
  { id: "text", label: "Текст", default: true },
  { id: "photo", label: "Фото", default: true },
  { id: "actions", label: "Действия", default: true },
];
const COLS_ORDER: ColId[] = COL_DEFS.map((c) => c.id);
const LS_COLS = "ui.reports.visiblecols";

/* страница */

export default function ReportsPage() {
  const lsKey = "ui.search.reports";
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState({
    page: 1,
    limit: 200,
    sort: "-start_time" as string,
    archived: 0 as 0 | 1,
    q: localStorage.getItem(lsKey) || "",
  });
  const ACTION_W = React.useMemo(() => 104, [q.archived]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [creating, setCreating] = useState(false);
  const LS_ONLY_ACTIVE_PERSONS  = "ui.reports.filter.person.onlyActive";
  const LS_ONLY_ACTIVE_PROJECTS = "ui.reports.filter.project.onlyActive";

  const [onlyActivePersons, setOnlyActivePersons] = useState<boolean>(() => {
    return (localStorage.getItem(LS_ONLY_ACTIVE_PERSONS) ?? "1") !== "0";
  });
  const [onlyActiveProjects, setOnlyActiveProjects] = useState<boolean>(() => {
    return (localStorage.getItem(LS_ONLY_ACTIVE_PROJECTS) ?? "1") !== "0";
  });
  // видимые колонки
  const [colsOpen, setColsOpen] = useState(false);
  const [visibleCols, setVisibleCols] = useState<ColId[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_COLS) || "null");
      if (Array.isArray(saved) && saved.length) return saved;
    } catch {}
    return COL_DEFS.filter((c) => c.default).map((c) => c.id);
  });
  useEffect(() => {
    localStorage.setItem(LS_COLS, JSON.stringify(visibleCols));
  }, [visibleCols]);
  const VCOLS = COLS_ORDER.filter((id) => visibleCols.includes(id));
  const { styleFor, Resizer } = useResizableColumns(COLS_ORDER, {
    tg: 120,
    person: 160,
    project: 200,
    dt: 160,
    weekday: 120,
    hours: 80,
    text: 360,
    photo: 100,
    actions: 104,
  });

  // Справочники для фильтров
  const [persons, setPersons] = useState<Person[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const personsReqIdRef = React.useRef(0);
  const projectsReqIdRef = React.useRef(0);

  async function loadPersons(onlyActive: boolean) {
    const myId = ++personsReqIdRef.current;
    try {
      if (onlyActive) {
        const r1 = await api("/api/person?archived=0&limit=2000");
        if (myId !== personsReqIdRef.current) return;
        setPersons((r1?.items || r1 || []) as Person[]);
        return;
      }
      const [a0, a1] = await Promise.all([
        api("/api/person?archived=0&limit=2000"),
        api("/api/person?archived=1&limit=2000"),
      ]);
      if (myId !== personsReqIdRef.current) return;
      const items = ([...(a0?.items || a0 || []), ...(a1?.items || a1 || [])] as Person[]);
      const byId = new Map<string, Person>();
      for (const p of items) byId.set(String((p as any)?._id || (p as any)?.id || ""), p);
      setPersons([...byId.values()]);
    } catch {
      const myId2 = ++personsReqIdRef.current;
      const [u0, u1] = await Promise.all([
        api("/api/users?archived=0"),
        api("/api/users?archived=1"),
      ]);
      if (myId2 !== personsReqIdRef.current) return;
      const items = ([...(u0?.items || u0 || []), ...(u1?.items || u1 || [])] as Person[]);
      const byId = new Map<string, Person>();
      for (const p of items) byId.set(String((p as any)?._id || (p as any)?.id || ""), p);
      setPersons([...byId.values()]);
    }
  }
    
  async function loadProjects(onlyActive: boolean) {
    const myId = ++projectsReqIdRef.current;
    if (onlyActive) {
      const pr = await api("/api/project?archived=0&limit=2000");
      if (myId !== projectsReqIdRef.current) return;
      setProjects((pr?.items || pr || []) as Project[]);
      return;
    }
    const [p0, p1] = await Promise.all([
      api("/api/project?archived=0&limit=2000"),
      api("/api/project?archived=1&limit=2000"),
    ]);
    if (myId !== projectsReqIdRef.current) return;
    const items = ([...(p0?.items || p0 || []), ...(p1?.items || p1 || [])] as Project[]);
    const byId = new Map<string, Project>();
    for (const p of items) byId.set(String((p as any)?._id || (p as any)?.id || ""), p);
    setProjects([...byId.values()]);
  }

  useEffect(() => {
    loadPersons(onlyActivePersons);
    loadProjects(onlyActiveProjects);
  }, []);

  // переключатель "только активные" - сотрудники
  useEffect(() => {
    localStorage.setItem(LS_ONLY_ACTIVE_PERSONS, onlyActivePersons ? "1" : "0");
    loadPersons(onlyActivePersons);
  }, [onlyActivePersons]);

  // переключатель "только активные" - проекты
  useEffect(() => {
    localStorage.setItem(LS_ONLY_ACTIVE_PROJECTS, onlyActiveProjects ? "1" : "0");
    loadProjects(onlyActiveProjects);
  }, [onlyActiveProjects]);

  // лог отчёта
  const [logModal, setLogModal] = useState<{
    open: boolean;
    log: string;
    reportId: string | null;
    duration?: string;
  }>({
    open: false,
    log: "",
    reportId: null,
    duration: undefined,
  });

  // фильтры
  const [filters, setFilters] = useState({
    tg: "",
    personId: "",
    projectId: "",
    dateFrom: "",
    dateTo: "",
    weekday: "",
    hoursMin: "",
    hoursMax: "",
    textContains: "",
    photo: "",
  });

  const [popover, setPopover] = useState<{ id: string; anchor: HTMLElement | null } | null>(null);

  useEffect(() => {
    setQ((prev) => ({ ...prev, archived: tab === "arch" ? 1 : 0, page: 1 }));
  }, [tab]);

  useEffect(() => {
    localStorage.setItem(lsKey, q.q ?? "");
  }, [q.q]);

  async function load() {
    setLoading(true);
    try {
      const serverParams: Record<string, any> = {
        ...q,
        q: filters.textContains || q.q || "",
        personId: filters.personId || undefined,
        projectId: filters.projectId || undefined,
      };
      const res = await Reports.list(serverParams as any);
      setItems(res.items || []);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [q.page, q.limit, q.archived, q.sort, q.q, filters.personId, filters.projectId, filters.textContains]);

  async function toArchive(r: any) {
    await api(`/api/reports/${r._id}`, { method: "PATCH", body: JSON.stringify({ archived: true }) });
    load();
  }
  async function fromArchive(r: any) {
    await api(`/api/reports/${r._id}`, { method: "PATCH", body: JSON.stringify({ archived: false }) });
    load();
  }
  async function remove(r: any) {
    if (!confirm("Удалить отчет?")) return;
    await api(`/api/reports/${r._id}`, { method: "DELETE" });
    load();
  }

  /* локальная фильтрация */
  const filteredItems = useMemo(() => {
    const f = filters;
    const inRange = (d?: string) =>
      (!f.dateFrom || (d && new Date(d) >= new Date(f.dateFrom))) &&
      (!f.dateTo || (d && new Date(d) <= new Date(f.dateTo + "T23:59:59")));
    const hoursOk = (s?: string, e?: string) => {
      if (!f.hoursMin && !f.hoursMax) return true;

      if (!s) return false;

      const startMs = new Date(s).getTime();
      const endMs = e ? new Date(e).getTime() : startMs;

      if (isNaN(startMs) || isNaN(endMs) || endMs < startMs) return false;

      const mins = (endMs - startMs) / 60000;
      const h = mins / 60;

      const min = f.hoursMin ? parseFloat(f.hoursMin) : -Infinity;
      const max = f.hoursMax ? parseFloat(f.hoursMax) : +Infinity;
      return h >= min && h <= max;
    };
    return (items || []).filter((r) => {
      if (f.tg && !String(r?.person?.telegram_id || "").includes(f.tg.trim())) return false;
      if (f.photo === "yes" && !r.photo_link) return false;
      if (f.photo === "no" && r.photo_link) return false;
      if (!inRange(r.start_time)) return false;
      if (!hoursOk(r.start_time, r.end_time)) return false;

      if (f.weekday) {
        const wd = fmtWeekday(r.start_time);
        if (wd !== f.weekday) return false;
      }
      return true;
    });
  }, [items, filters]);

  // отрисовка ячеек по id колонки
  const renderHeader = (id: ColId) => {
    const def = COL_DEFS.find((c) => c.id === id)!;
    const base = "p-2 text-left relative border-b " + (id === "actions" ? "" : "border-r");
    const popId = `f-${id}`;

    return (
      <th key={id} className={base} data-col={id}>
        <div className="flex items-center gap-2">
          <span>{def.label}</span>
          {id !== "actions" && (
            <button
              data-popover
              className="rounded-md border px-1.5 py-1 text-xs hover:bg-muted/60"
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.stopPropagation();
                const anchor = e.currentTarget as HTMLElement;
                setPopover((prev) =>
                  prev && prev.id === popId ? null : { id: popId, anchor }
                );
              }}
              title="Фильтр"
            >
              <Icon.Funnel />
            </button>
          )}
        </div>
        <Resizer id={id} />

        {/* поповер в портале */}
        <PopoverPortal
          open={!!popover && popover.id === popId}
          anchorEl={popover?.anchor || null}
          onClose={() => setPopover(null)}
          align="end"
        >
          {renderFilterContent(id)}
          <div className="mt-3 flex justify-between">
            <button
              className="rounded-lg border px-3 py-1 text-xs"
              onClick={() => {
                resetFilter(id);
                setPopover(null);
              }}
            >
              Сброс
            </button>
            <button className="rounded-lg border px-3 py-1 text-xs" onClick={() => setPopover(null)}>
              Готово
            </button>
          </div>
        </PopoverPortal>
      </th>
    );
  };

  function renderFilterContent(id: ColId) {
    switch (id) {
      case "tg":
        return (
          <label className="text-sm w-full">
            Telegram ID
            <input
              className="mt-1 w-full rounded-lg border px-2 py-1"
              placeholder="введите tg id..."
              value={filters.tg}
              onChange={(e) => setFilters((f) => ({ ...f, tg: e.target.value }))}
            />
          </label>
        );
      case "person":
        const personList = onlyActivePersons
          ? persons.filter((p: any) => !p?.archived)
          : persons;
        const sortedPersonList = personList
          .slice()
          .sort((a, b) => displayName(a).localeCompare(displayName(b), "ru"));

        return (
          <div className="w-full">
            <label className="text-sm w-full block">
              Сотрудник
              <select
                className="mt-1 w-full rounded-lg border px-2 py-1"
                value={filters.personId}
                onChange={(e) => setFilters((f) => ({ ...f, personId: e.target.value }))}
              >
                <option value="">— все —</option>
                {sortedPersonList.map((p) => {
                  const archivedFlag = (p as any)?.archived ? " (архив)" : "";
                  const name = displayName(p) || (p as any).email || idOf(p);
                  return (
                    <option key={idOf(p)} value={idOf(p)}>
                      {name + archivedFlag}
                    </option>
                  );
                })}
              </select>
            </label>

            <label className="mt-2 flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={onlyActivePersons}
                onChange={(e) => setOnlyActivePersons(e.target.checked)}
              />
              <span>Только активные</span>
            </label>
          </div>
        );
      case "project":
        const projectList = onlyActiveProjects
          ? projects.filter((p: any) => !p?.archived)
          : projects;
        const sortedProjectList = projectList
          .slice()
          .sort((a, b) => {
            const an = String((a as any).name || idOf(a) || "");
            const bn = String((b as any).name || idOf(b) || "");
            return an.localeCompare(bn, "ru");
          });

        return (
          <div className="w-full">
            <label className="text-sm w-full block">
              Проект
              <select
                className="mt-1 w-full rounded-lg border px-2 py-1"
                value={filters.projectId}
                onChange={(e) => setFilters((f) => ({ ...f, projectId: e.target.value }))}
              >
                <option value="">— все —</option>
                {sortedProjectList.map((p) => {
                  const archivedFlag = (p as any)?.archived ? " (архив)" : "";
                  const label = (p as any).name || idOf(p);
                  return (
                    <option key={idOf(p)} value={idOf(p)}>
                      {label + archivedFlag}
                    </option>
                  );
                })}
              </select>
            </label>

            <label className="mt-2 flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={onlyActiveProjects}
                onChange={(e) => setOnlyActiveProjects(e.target.checked)}
              />
              <span>Только активные</span>
              </label>
            </div>
          );
      case "dt":
        return (
          <div className="grid grid-cols-1 gap-2">
            <label className="text-sm">
              Дата c
              <input
                type="date"
                className="mt-1 w-full rounded-lg border px-2 py-1"
                value={filters.dateFrom}
                onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
              />
            </label>
            <label className="text-sm">
              Дата по
              <input
                type="date"
                className="mt-1 w-full rounded-lg border px-2 py-1"
                value={filters.dateTo}
                onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
              />
            </label>
          </div>
        );
      case "weekday":
        const weekdays = [
          "Понедельник",
          "Вторник",
          "Среда",
          "Четверг",
          "Пятница",
          "Суббота",
          "Воскресенье",
        ];
        return (
          <label className="text-sm w-full">
            День недели
            <select
              className="mt-1 w-full rounded-lg border px-2 py-1"
              value={filters.weekday}
              onChange={(e) =>
                setFilters((f) => ({ ...f, weekday: e.target.value }))
              }
            >
              <option value="">— все —</option>
              {weekdays.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </label>
        );

      case "hours":
        return (
          <div className="grid grid-cols-2 gap-2 text-sm">
            <label>
              Мин.
              <input
                className="mt-1 w/full rounded-lg border px-2 py-1"
                placeholder="часы"
                value={filters.hoursMin}
                onChange={(e) => setFilters((f) => ({ ...f, hoursMin: e.target.value }))}
              />
            </label>
            <label>
              Макс.
              <input
                className="mt-1 w-full rounded-lg border px-2 py-1"
                placeholder="часы"
                value={filters.hoursMax}
                onChange={(e) => setFilters((f) => ({ ...f, hoursMax: e.target.value }))}
              />
            </label>
          </div>
        );
      case "text":
        return (
          <label className="text-sm w-full">
            Поиск по тексту
            <input
              className="mt-1 w-full rounded-lg border px-2 py-1"
              placeholder="введите текст..."
              value={filters.textContains}
              onChange={(e) => setFilters((f) => ({ ...f, textContains: e.target.value }))}
            />
          </label>
        );
      case "photo":
        return (
          <label className="text-sm w-full">
            Фото
            <select
              className="mt-1 w-full rounded-lg border px-2 py-1"
              value={filters.photo}
              onChange={(e) => setFilters((f) => ({ ...f, photo: e.target.value }))}
            >
              <option value="">— не важно —</option>
              <option value="yes">Есть</option>
              <option value="no">Нет</option>
            </select>
          </label>
        );
      default:
        return null;
    }
  }

  function resetFilter(id: ColId) {
    setFilters((f) => {
      const base = { ...f };
      if (id === "tg") base.tg = "";
      if (id === "person") base.personId = "";
      if (id === "project") base.projectId = "";
      if (id === "dt") (base.dateFrom = ""), (base.dateTo = "");
      if (id === "weekday") base.weekday = "";
      if (id === "hours") (base.hoursMin = ""), (base.hoursMax = "");
      if (id === "text") base.textContains = "";
      if (id === "photo") base.photo = "";
      return base;
    });
  }

  const actionBtn = (title: string, onClick: (e: React.MouseEvent) => void, variant: "edit" | "archive" | "unarchive" | "del" | "log") => (
    <button
      className={`inline-flex items-center justify-center rounded-md border w-7 h-7 ${
        variant === "del" ? "text-red-600 border-red-200 hover:bg-red-50" : "hover:bg-muted/50"
      }`}
      title={title}
      aria-label={title}
      onClick={onClick}
    >
      {variant === "edit" && <Icon.Pencil />}
      {variant === "archive" && <Icon.Archive />}
      {variant === "unarchive" && <Icon.Unarchive />}
      {variant === "del" && <Icon.Trash />}
      {variant === "log" && <Icon.Log />}
    </button>
  );

  const renderCell = (id: ColId, r: any) => {
    switch (id) {
      case "tg":
        return <td key={id} className="p-2 whitespace-nowrap" data-col="tg">{r.person?.telegram_id || "-"}</td>;
      case "person":
        return <td key={id} className="p-2 break-words" data-col="person">{displayName(r.person) || "-"}</td>;
      case "project":
        return <td key={id} className="p-2 break-words" data-col="project">{r.project?.name || "-"}</td>;
      case "dt":
        return <td key={id} className="p-2 whitespace-pre" data-col="dt">{fmtDateBlock(r.start_time, r.end_time)}</td>;
      case "weekday":
        return <td key={id} className="p-2 whitespace-nowrap" data-col="weekday">{fmtWeekday(r.start_time)}</td>;
      case "hours":
        return <td key={id} className="p-2 whitespace-nowrap" data-col="hours">{fmtDuration(r.start_time, r.end_time)}</td>;
      case "text":
        return <td key={id} className="p-2 break-words" data-col="text">{r.text_report || "-"}</td>;
      case "photo":
        return (
          <td key={id} className="p-2 whitespace-nowrap" data-col="photo">
            {r.photo_link ? (
              <a
                className="underline"
                href={r.photo_link}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                Смотреть
              </a>
            ) : (
              "-"
            )}
          </td>
        );
      case "actions":
        return (
          <td key={id} className="p-2" data-col="actions">
            <div className="flex gap-1 justify-end">
              {actionBtn("Посмотреть лог", (e) => { e.stopPropagation(); setLogModal({
                open: true,
                log: r.session_log || "Лог действий пуст",
                reportId: r._id,
                duration: r.session_duration_str,});
                }, "log"
              )}
              {actionBtn("Редактировать", (e) => { e.stopPropagation(); setEditing(r); }, "edit")}
              {q.archived === 0
                ? actionBtn("В архив", (e) => { e.stopPropagation(); toArchive(r); }, "archive")
                : actionBtn("Убрать из архива", (e) => { e.stopPropagation(); fromArchive(r); }, "unarchive")}
              {actionBtn("Удалить", (e) => { e.stopPropagation(); remove(r); }, "del")}
            </div>
          </td>
        );
    }
  };

  return (
    <div className="space-y-3 max-w-none w-full">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-2">
          <button
            className={`rounded-xl border px-3 py-2 ${tab === "all" ? "bg-muted/50" : ""}`}
            onClick={() => setTab("all")}
          >
            Все
          </button>
        </div>

        <button
          className={`rounded-xl border px-3 py-2 ${tab === "arch" ? "bg-muted/50" : ""}`}
          onClick={() => setTab("arch")}
        >
          Архив
        </button>

        <input
          placeholder="Поиск по тексту отчета…"
          className="rounded-xl border px-3 py-2 ml-2"
          value={q.q}
          onChange={(e) => setQ({ ...q, q: e.target.value, page: 1 })}
        />

        <div className="ml-auto flex gap-2">
          <button
            className="rounded-xl border px-3 py-2 inline-flex items-center gap-2"
            onClick={() => setCreating(true)}
            title="Создать отчёт"
          >
            <Icon.Plus /> Отчёт
          </button>
          <button className="rounded-xl border px-3 py-2" onClick={() => setColsOpen(true)}>
            ⚙︎ Поля
          </button>
          <button
            className="rounded-xl border px-3 py-2"
            onClick={() =>
              downloadReportsXlsx({
                archived: tab === "arch" ? 1 : 0,
                q: filters.textContains || q.q || "",
                personId: filters.personId || undefined,
                projectId: filters.projectId || undefined,
                telegram: filters.tg || undefined,
                startFrom: filters.dateFrom || undefined,
                startTo: filters.dateTo || undefined,
                hasPhoto: filters.photo === "" ? undefined : filters.photo === "yes" ? 1 : 0,
                hoursMin: filters.hoursMin || undefined,
                hoursMax: filters.hoursMax || undefined,
                sort: q.sort,
              })
            }
          >
            Выгрузить в Excel
          </button>
        </div>
      </div>

      <div className="rounded-2xl border overflow-y-auto overflow-x-hidden max-h-[80vh]">
        <table className="w-full table-fixed text-sm zebra">
          <colgroup>
            {VCOLS.map((id) => (
              <col key={id}  style={id === "actions" ? { width: `${ACTION_W}px`, maxWidth: `${ACTION_W}px` } : styleFor(id)}/>))}
          </colgroup>

          <thead className="bg-muted/50 sticky top-0">
            <tr>{VCOLS.map((id) => renderHeader(id))}</tr>
          </thead>

          <tbody>
            {filteredItems.length === 0 && (
              <tr>
                <td className="p-4 text-muted-foreground" colSpan={VCOLS.length}>
                  {loading ? "Загрузка..." : "данных нет"}
                </td>
              </tr>
            )}

            {filteredItems.map((r) => (
              <tr
                key={r._id}
                className="border-t align-top hover:bg-muted/30 cursor-pointer"
                onClick={() => setEditing(r)}
              >
                {VCOLS.map((id) => renderCell(id, r))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* модалка */}
      {colsOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setColsOpen(false)} />
          <div className="relative w-[min(560px,96vw)] rounded-2xl bg-white p-5 shadow-2xl">
            <div className="text-lg font-semibold mb-3">Отображаемые поля</div>
            <div className="space-y-3">
              {COL_DEFS.map((c) => (
                <label key={c.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={visibleCols.includes(c.id)}
                    onChange={(e) => {
                      setVisibleCols((prev) =>
                        e.target.checked ? [...prev, c.id] : prev.filter((x) => x !== c.id)
                      );
                    }}
                  />
                  {c.label}
                </label>
              ))}
              <div className="flex gap-2 pt-2">
                <button
                  className="rounded-xl border px-3 py-2"
                  onClick={() => setVisibleCols(COL_DEFS.map((c) => c.id))}
                >
                  Показать все
                </button>
                <button
                  className="rounded-xl border px-3 py-2"
                  onClick={() => setVisibleCols(COL_DEFS.filter((c) => c.default).map((c) => c.id))}
                >
                  Сбросить по умолчанию
                </button>
                <button className="rounded-xl border px-3 py-2 ml-auto" onClick={() => setColsOpen(false)}>
                  Готово
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {logModal.open && (
        <div className="fixed inset-0 z-50 grid place-items-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() =>
              setLogModal({ open: false, log: "", reportId: null, duration: undefined })
            }
          />
          <div className="relative w-[min(720px,96vw)] max-h-[80vh] rounded-2xl bg-white p-5 shadow-2xl flex flex-col">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <div className="text-lg font-semibold">Лог сессии</div>
                {logModal.duration && (
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Длительность: {logModal.duration}
                  </div>
                )}
              </div>
              <button
                className="inline-flex items-center justify-center rounded-md border w-7 h-7 hover:bg-muted/50"
                onClick={() =>
                  setLogModal({ open: false, log: "", reportId: null, duration: undefined })
                }
                title="Закрыть"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
                  <path
                    fill="currentColor"
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            <pre className="flex-1 overflow-auto whitespace-pre-wrap break-words text-sm font-mono border rounded-xl p-3 bg-muted/30">
              {logModal.log || "Лог действий пуст"}
            </pre>
          </div>
        </div>
      )}

      {editing && <EditModal report={editing} onClose={() => setEditing(null)} onSaved={load} />}
      {creating && (
        <EditModal
          report={{}}
          isCreate
          onClose={() => setCreating(false)}
          onSaved={load}
        />
      )}
    </div>
  );
}