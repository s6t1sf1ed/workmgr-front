import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import ThemeToggle from "./components/ThemeToggle";
import EntityTable from "./components/EntityTable";
import TaskBoard from "./components/TaskBoard";
import Auth from "./Auth";
import { api, setToken } from "./lib/api";
import { Me } from "./lib/api";
import ReportsPage from "./pages/ReportsPage";

//  новые импорты
import UserMenu from "./components/UserMenu";
import AdminLogsPage from "./pages/AdminLogsPage";
import ProjectViewPage from "./pages/ProjectViewPage";

const TITLES: Record<string, string> = {
  projects: "Проекты",
  tasks: "Задачи",
  persons: "Сотрудники",
  fields: "Настройка полей",
  reports: "Отчёты",
  logs: "Логи",
};

const LS = {
  tab: "ui.tab",
  taskView: "ui.taskView",
  scopeProjects: "ui.scopeProjects",
  scopePersons: "ui.scopePersons",
  scopeTasks: "ui.scopeTasks",
};

type TabKey = "projects" | "tasks" | "persons" | "fields" | "reports" | "logs";

export default function App() {
  const [tab, setTab] = useState<TabKey>(
    ((localStorage.getItem(LS.tab) as TabKey) || "projects")
  );
  const [taskView, setTaskView] = useState<"board" | "table">(
    ((localStorage.getItem(LS.taskView) as "board" | "table") || "board")
  );
  const [scopeProjects, setScopeProjects] = useState<"active" | "archive">(
    ((localStorage.getItem(LS.scopeProjects) as "active" | "archive") || "active")
  );
  const [scopePersons, setScopePersons] = useState<"active" | "archive">(
    ((localStorage.getItem(LS.scopePersons) as "active" | "archive") || "active")
  );
  const [scopeTasks, setScopeTasks] = useState<"active" | "archive">(
    ((localStorage.getItem(LS.scopeTasks) as "active" | "archive") || "active")
  );

  const [authed, setAuthed] = useState<boolean>(() => !!localStorage.getItem("token"));
  const [brand, setBrand] = useState<string>("");

  // NEW: id открытого проекта (если null — показываем обычные вкладки)
  const [projectViewId, setProjectViewId] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem("token"));
  }, []);

  useEffect(() => {
    const handler = () => setAuthed(false);
    window.addEventListener("app:logout", handler);
    return () => window.removeEventListener("app:logout", handler);
  }, []);

  useEffect(() => {
    if (!authed) return;
    Me.get()
      .then((r: any) => setBrand(r?.company?.name || r?.company || ""))
      .catch(() => {});
  }, [authed]);

  useEffect(() => { localStorage.setItem(LS.tab, tab); }, [tab]);
  useEffect(() => { localStorage.setItem(LS.taskView, taskView); }, [taskView]);
  useEffect(() => { localStorage.setItem(LS.scopeProjects, scopeProjects); }, [scopeProjects]);
  useEffect(() => { localStorage.setItem(LS.scopePersons, scopePersons); }, [scopePersons]);
  useEffect(() => { localStorage.setItem(LS.scopeTasks, scopeTasks); }, [scopeTasks]);

  if (!authed) return <Auth onDone={() => setAuthed(true)} />;

  const pageTitle = projectViewId ? "Проект" : TITLES[tab];

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="flex">
        <Sidebar
          active={projectViewId ? "projects" : tab}
          onSelect={(k) => {
            // при переходе по разделам закрываем открытую страницу проекта
            setProjectViewId(null);
            clearSearchForTab(tab);
            setTab(k as any);
          }}
          brand={brand}
        />
        <main className="flex-1 min-h-0 min-w-0 overflow-x-hidden p-6 space-y-6 max-w-none">
          {/* шапка */}
          <header className="flex items-center gap-2">
            <div className="text-2xl font-semibold">{pageTitle}</div>
            <div className="ml-auto flex items-center gap-2">
              <UserMenu />
              <button
                className="rounded-xl border px-3 py-2"
                onClick={() => {
                  setToken(null);
                  localStorage.removeItem("token");
                  setAuthed(false);
                }}
              >
                Выйти
              </button>
              <ThemeToggle />
            </div>
          </header>

          {/* Если открыта страница проекта — показываем её */}
          {projectViewId ? (
            <ProjectViewPage
              projectId={projectViewId}
              onBack={() => setProjectViewId(null)}
            />
          ) : (
            <>
              {/* вкладка Проекты */}
              {tab === "projects" && (
                <div className="space-y-4">
                  <ScopeTabs scope={scopeProjects} onChange={setScopeProjects} />
                  <EntityTable
                    entity="project"
                    archived={scopeProjects === "archive"}
                    // открываем ProjectViewPage по клику на строку проекта
                    onOpenProject={(id: string) => setProjectViewId(id)}
                  />
                </div>
              )}

              {/* вкладка Задачи */}
              {tab === "tasks" && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <ScopeTabs
                      scope={scopeTasks}
                      onChange={(s) => {
                        setScopeTasks(s);
                        if (s === "archive") setTaskView("table");
                      }}
                    />
                    <div className="ml-auto flex items-center gap-2">
                      <div className="text-sm text-muted-foreground">Вид:</div>
                      <button
                        className={`rounded-xl border px-3 py-1 ${taskView === "board" ? "bg-muted/50" : ""}`}
                        onClick={() => setTaskView("board")}
                        disabled={scopeTasks === "archive"}
                        title={scopeTasks === "archive" ? "Канбан доступен только для активных задач" : ""}
                      >
                        Канбан
                      </button>
                      <button
                        className={`rounded-xl border px-3 py-1 ${taskView === "table" ? "bg-muted/50" : ""}`}
                        onClick={() => setTaskView("table")}
                      >
                        Список
                      </button>
                    </div>
                  </div>
                  {scopeTasks === "active" && taskView === "board" ? (
                    <TaskBoard />
                  ) : (
                    <EntityTable entity="task" archived={scopeTasks === "archive"} />
                  )}
                </div>
              )}

              {/* вкладка Работники */}
              {tab === "persons" && (
                <div className="space-y-4">
                  <ScopeTabs scope={scopePersons} onChange={setScopePersons} />
                  <EntityTable entity="person" archived={scopePersons === "archive"} />
                </div>
              )}

              {/* вкладка Настройка полей */}
              {tab === "fields" && <FieldsPage />}

              {/* вкладка Отчёты — ⬇ теперь реальная страница */}
              {tab === "reports" && <ReportsPage />}

              {/* вкладка Логи */}
              {tab === "logs" && <AdminLogsPage />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function clearSearchForTab(t: "projects" | "tasks" | "persons" | "fields" | "reports" | "logs") {
  const map: Record<string, string | null> = {
    projects: "project",
    tasks: "task",
    persons: "person",
    fields: null,
    reports: null,
    logs:null,
  };
  const ent = map[t];
  if (ent) localStorage.removeItem(`ui.search.${ent}`);
}

function ScopeTabs({
  scope,
  onChange,
}: {
  scope: "active" | "archive";
  onChange: (s: "active" | "archive") => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        className={`rounded-xl border px-3 py-1 ${scope === "active" ? "bg-muted/50" : ""}`}
        onClick={() => onChange("active")}
      >
        Активные
      </button>
      <button
        className={`rounded-xl border px-3 py-1 ${scope === "archive" ? "bg-muted/50" : ""}`}
        onClick={() => onChange("archive")}
      >
        Архив
      </button>
    </div>
  );
}

function FieldsPage() {
  type Entity = "project" | "person" | "task";
  const [entity, setEntity] = useState<Entity>("person");
  const [label, setLabel] = useState("");
  const [type, setType] = useState<"string" | "text" | "number" | "bool" | "date">("string");
  const [items, setItems] = useState<any[]>([]);

  function slugify(s: string) {
    return s
      .trim()
      .toLowerCase()
      .replace(/[ё]/g, "e")
      .replace(/[й]/g, "i")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "");
  }

  async function load() {
    const res = await api<any[]>(`/api/fields/${entity}`);
    setItems(res);
  }

  useEffect(() => {
    load();
  }, [entity]);

  async function addField() {
    if (!label.trim()) return;
    const key = slugify(label) || `field-${Date.now()}`;
    await api(`/api/fields/${entity}`, {
      method: "POST",
      body: JSON.stringify({ entity, key, label, type, order: 0 }),
    });
    setLabel("");
    setType("string");
    load();
  }

  const TrashIcon = (p: any) => (
  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden {...p}>
    <path fill="currentColor" d="M6 19a2 2 0 002 2h8a2 2 0 002-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
  </svg>
);
const delBtnCls =
  "inline-flex items-center justify-center rounded-md border w-7 h-7 text-red-600 border-red-200 hover:bg-red-50";

  return (
    <div className="space-y-4">
      {/* вкладки-сущности */}
      <div className="flex items-center gap-2">
        {[
          { v: "project", t: "Проекты" },
          { v: "person", t: "Сотрудники" },
          { v: "task", t: "Задачи" },
        ].map((x) => (
          <button
            key={x.v}
            className={`rounded-xl border px-3 py-1 ${entity === (x.v as any) ? "bg-muted/50" : ""}`}
            onClick={() => setEntity(x.v as Entity)}
          >
            {x.t}
          </button>
        ))}
      </div>

      {/* простая форма добавления: Название + Тип */}
      <div className="rounded-2xl border p-3 space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            placeholder="Название поля"
            className="rounded-xl border px-3 py-2"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <select className="rounded-xl border px-3 py-2" value={type} onChange={(e) => setType(e.target.value as any)}>
            <option value="string">string</option>
            <option value="text">text</option>
            <option value="number">number</option>
            <option value="bool">bool</option>
            <option value="date">date</option>
          </select>
          <button className="rounded-xl border px-3 py-2" onClick={addField}>
            Добавить поле
          </button>
        </div>
      </div>

      {/* список полей */}
      <div className="rounded-2xl border max-h-[70vh] overflow-auto">
        <table className="w-full text-sm zebra">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="p-2 text-left">Название</th>
              <th className="p-2 text-left">Тип</th>
              <th className="p-2 text-left w-28"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((fd: any) => (
              <tr key={fd._id} className="border-t">
                <td className="p-2">{fd.label}</td>
                <td className="p-2">{fd.type}</td>
                <td className="p-2 text-right">
                  <button
                    className={delBtnCls}
                    title="Удалить"
                    aria-label="Удалить"
                    onClick={async () => {
                      if (!confirm(`Удалить поле «${fd.label || fd.key}»?`)) return;
                      await api(`/api/fields/${fd.entity}/${fd.key}`, { method: "DELETE" });
                      setItems(items.filter((x) => x._id !== fd._id));
                    }}
                  >
                    <TrashIcon />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}