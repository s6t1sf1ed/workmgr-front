import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api";
import { Projects } from "../lib/api"; // из обновлённого api.ts
import { formatDateTimeRu } from "../lib/dates";

type Task = {
  _id: string;
  title?: string;
  status?: string;
  updatedAt?: string;
  archived?: boolean;
  projectId?: string; //  добавили
  extra?: any;
};

type Status = { key: string; title: string };

const LS_KEY = "task_statuses";

function loadStatuses(): Status[] {
  const raw = localStorage.getItem(LS_KEY);
  if (raw) {
    try { return JSON.parse(raw) as Status[]; } catch {}
  }
  const def: Status[] = [
    { key: "new",         title: "Новые" },
    { key: "in_progress", title: "В работе" },
    { key: "done",        title: "Готово" },
  ];
  localStorage.setItem(LS_KEY, JSON.stringify(def));
  return def;
}
function saveStatuses(s: Status[]) { localStorage.setItem(LS_KEY, JSON.stringify(s)); }

function slugify(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[ё]/g, "e")
    .replace(/[й]/g, "i")
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "");
}

export default function TaskBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const LS_Q = "ui.search.task";
  const [q, setQ] = useState<string>(() => localStorage.getItem(LS_Q) || "");
  useEffect(() => {
    localStorage.setItem(LS_Q, q);
  }, [q]);
  const [statuses, setStatuses] = useState<Status[]>(() => loadStatuses());
  const [newCol, setNewCol] = useState("");

  //  данные по проектам
  const [projects, setProjects] = useState<any[]>([]);
  const [sysProjectId, setSysProjectId] = useState<string | null>(null);
  const [filterProject, setFilterProject] = useState<string>("");

  async function load() {
    const res = await api<{ items: Task[] }>("/api/task?archived=0&limit=250&sort=-updatedAt");
    setTasks(res.items);
  }

  async function loadProjects() {
    const res = await Projects.list({ limit: 1000 });
    const items = res.items || [];
    setProjects(items);
    const sys = items.find((p: any) => p.isSystem);
    setSysProjectId(sys?.id || null);
  }

  useEffect(() => { load(); loadProjects(); }, []);

  async function moveTask(id: string, status: string) {
    await api(`/api/task/${id}`, { method: "PATCH", body: JSON.stringify({ status, archived: false }) });
    setTasks(ts =>
      ts.map(t => t._id === id ? { ...t, status, archived: false, updatedAt: new Date().toISOString() } : t)
    );
  }

  async function archiveTask(id: string) {
    await api(`/api/task/${id}`, { method: "PATCH", body: JSON.stringify({ archived: true }) });
    setTasks(ts => ts.filter(t => t._id !== id));
  }

  //  смена проекта у задачи
  async function changeTaskProject(id: string, projectId: string) {
    // если выбрано «Без проекта» — отправляем пустую строку; бэкенд сам проставит системный
    const body: any = projectId ? { projectId } : { projectId: "" };
    await api(`/api/task/${id}`, { method: "PATCH", body: JSON.stringify(body) });
    setTasks(ts => ts.map(t =>
      t._id === id ? { ...t, projectId: projectId || sysProjectId || undefined, updatedAt: new Date().toISOString() } : t
    ));
  }

  // фильтрация
  const filtered = useMemo(() => {
    const byText = (t: Task) => (t.title || "").toLowerCase().includes(q.toLowerCase());
    const byProject = (t: Task) => {
      if (!filterProject) return true;
      // если фильтруем «Без проекта» — учитываем системный id
      if (filterProject === "__none") {
        return !t.projectId || (sysProjectId && t.projectId === sysProjectId);
      }
      return t.projectId === filterProject;
    };
    return tasks.filter(t => byText(t) && byProject(t));
  }, [tasks, q, filterProject, sysProjectId]);

  const stripRef = useRef<HTMLDivElement>(null);
  const scrollBy = (dx: number) => stripRef.current?.scrollBy({ left: dx, behavior: "smooth" });

  function addStatus() {
    const title = newCol.trim();
    if (!title) return;
    const key = slugify(title) || `col_${Date.now()}`;
    if (statuses.some(s => s.key === key)) return;
    const next = [...statuses, { key, title }];
    setStatuses(next); saveStatuses(next);
    setNewCol("");
  }

  function guardDragStart(e: React.DragEvent<HTMLDivElement>, id: string) {
    const target = e.target as HTMLElement | null;
    if (target && target.closest("button, select")) { // не начинать drag с кнопок/селекта
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("text/plain", id);
  }

  return (
    <div className="space-y-3 min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <input
          placeholder="Поиск задач"
          className="rounded-xl border px-3 py-2"
          value={q}
          onChange={e => setQ(e.target.value)}
        />
        <button className="rounded-xl border px-3 py-2" onClick={load}>Обновить</button>

        {/*  фильтр по проекту */}
        <div className="ml-2 flex items-center gap-2">
          <div className="text-sm text-muted-foreground">Проект:</div>
          <select
            className="rounded-xl border px-3 py-2"
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
          >
            <option value="">Все</option>
            <option value="__none">Без проекта (Inbox)</option>
            {projects.filter((p: any) => !p.isSystem).map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <input
            className="rounded-xl border px-3 py-2"
            placeholder="Добавить колонку…"
            value={newCol}
            onChange={e => setNewCol(e.target.value)}
          />
          <button className="rounded-xl border px-3 py-2" onClick={addStatus}>Добавить</button>
        </div>
      </div>

      {/* ограничиваем ширину страницы и оставляем скролл только внутри ленты */}
      <div className="relative overflow-x-hidden max-w-full">
        <button
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 rounded-full border px-3 py-2 bg-background/80 backdrop-blur"
          onClick={() => scrollBy(-480)}
          aria-label="scroll left"
        >←</button>
        <button
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 rounded-full border px-3 py-2 bg-background/80 backdrop-blur"
          onClick={() => scrollBy(480)}
          aria-label="scroll right"
        >→</button>

        <div
          ref={stripRef}
          className="flex gap-3 overflow-x-auto overscroll-x-contain px-8 pb-2 w-full max-w-full"
        >
          {statuses.map(col => {
            const items = filtered.filter(t => (t.status || "") === col.key);
            return (
              <Column
                key={col.key}
                title={col.title}
                status={col.key}
                items={items}
                onDropTask={moveTask}
                onArchive={archiveTask}
                onGuardDragStart={guardDragStart}
                onRemove={() => {
                  if (items.length) { alert("Колонка не пуста. Переместите или заархивируйте задачи."); return; }
                  const next = statuses.filter(s => s.key !== col.key);
                  setStatuses(next); saveStatuses(next);
                }}
                //  прокидываем проекты и обработчик смены
                projects={projects}
                sysProjectId={sysProjectId}
                onChangeProject={changeTaskProject}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Column({
  title, status, items, onDropTask, onArchive, onRemove, onGuardDragStart,
  projects, sysProjectId, onChangeProject,
}:{
  title:string; status:string; items:Task[];
  onDropTask:(id:string, status:string)=>void;
  onArchive:(id:string)=>void;
  onRemove:()=>void;
  onGuardDragStart:(e: React.DragEvent<HTMLDivElement>, id: string)=>void;
  projects: any[];
  sysProjectId: string | null;
  onChangeProject: (id: string, projectId: string) => void;
}) {
  return (
    <div
      className="rounded-2xl border p-3 bg-muted/30 min-h-[50vh] w-[320px] shrink-0"
      onDragOver={(e)=>e.preventDefault()}
      onDrop={(e)=>{ e.preventDefault(); const id = e.dataTransfer.getData("text/plain"); if(id) onDropTask(id, status); }}
    >
      <div className="flex items-center mb-2">
        <div className="font-semibold">{title}</div>
        <button
          className="ml-auto text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted"
          title="Удалить колонку"
          onClick={onRemove}
          aria-label="Удалить колонку"
        >×</button>
      </div>
      <div className="space-y-2">
        {items.map(t => {
          // текущее значение селекта проекта:
          const value = !t.projectId || (sysProjectId && t.projectId === sysProjectId) ? "" : (t.projectId || "");
          return (
            <div key={t._id}
                 draggable
                 onDragStart={(e)=>onGuardDragStart(e, t._id)}
                 className="rounded-xl border bg-background p-3 cursor-grab active:cursor-grabbing">
              <div className="font-medium">{t.title || "(без названия)"}</div>
              <div className="text-xs text-muted-foreground">{formatDateTimeRu(t.updatedAt, true)}</div>

              {/*  выбор проекта */}
              <div className="mt-2 flex items-center gap-2">
                <select
                  className="rounded-lg border px-2 py-1 text-xs bg-background"
                  value={value}
                  onChange={(e)=>onChangeProject(t._id, e.target.value)}
                  title="Привязать к проекту"
                >
                  <option value="">Без проекта (Inbox)</option>
                  {projects.filter((p:any)=>!p.isSystem).map((p:any)=>(
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>

                <button
                  className="ml-auto rounded-lg border px-2 py-1 text-xs"
                  onClick={(e)=>{ e.stopPropagation(); onArchive(t._id); }}
                >
                  В архив
                </button>
              </div>
            </div>
          );
        })}
        {!items.length && <div className="text-xs text-muted-foreground">Пусто</div>}
      </div>
    </div>
  );
}
