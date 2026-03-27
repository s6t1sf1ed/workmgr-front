import { useEffect, useMemo, useState } from "react";
import { api, type MeInfo } from "../lib/api";
import ThemeToggle from "./ThemeToggle";
import UserMenu from "./UserMenu";

const allItems = [
  { key: "projects", label: "Проекты", perm: "projects.view" },
  { key: "tasks", label: "Задачи", perm: "tasks.view" },
  { key: "persons", label: "Сотрудники", perm: "persons.view" },
  { key: "timesheet", label: "Табель", perm: "timesheet.view" },
  { key: "fields", label: "Настройка полей", perm: "fields.view" },
  { key: "reports", label: "Отчёты", perm: "reports.view" },
  { key: "users_access", label: "Пользователи и доступы", perm: "users.manage" },
  { key: "logs", label: "Логи", perm: "logs.view" },
] as const;

type AppTabKey =
  | "projects"
  | "tasks"
  | "persons"
  | "timesheet"
  | "fields"
  | "reports"
  | "logs"
  | "users_access";

type ProjectViewTab = "about" | "tasks" | "access" | "files" | "worklog" | "specs";
type ProjectSpecMode = "editor" | "shipment" | "execution" | "summary" | "vor";

type ProjectMenuItem = {
  tab: ProjectViewTab;
  label: string;
  specMode?: ProjectSpecMode;
};

type ProjectLite = {
  _id?: string;
  name?: string;
  portfolioName?: string;
};

const Chevron = ({ open }: { open: boolean }) => (
  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden>
    <path
      fill="currentColor"
      d={open ? "m7 10 5 5 5-5z" : "m9 6 6 6-6 6z"}
    />
  </svg>
);

const projectMenu: ProjectMenuItem[] = [
  { tab: "about", label: "О проекте" },
  { tab: "specs", specMode: "editor", label: "Спецификация" },
  { tab: "specs", specMode: "vor", label: "ВОР" },
  { tab: "specs", specMode: "shipment", label: "Отгрузки" },
  { tab: "specs", specMode: "execution", label: "Выполнение" },
  { tab: "specs", specMode: "summary", label: "Свод" },
  { tab: "tasks", label: "Задачи" },
  { tab: "files", label: "Диск" },
  { tab: "worklog", label: "Журнал работ" },
];

function portfolioLabel(name?: string) {
  return String(name || "").trim() || "Без портфеля";
}

export default function Sidebar({
  active,
  onSelect,
  onOpenProjectView,
  currentProjectId,
  currentProjectTab,
  currentProjectSpecMode,
  brand,
  onLogout,
  me,
}: {
  active: string;
  onSelect: (k: AppTabKey) => void;
  onOpenProjectView: (
    projectId: string,
    tab?: ProjectViewTab,
    specMode?: ProjectSpecMode
  ) => void;
  currentProjectId?: string | null;
  currentProjectTab?: ProjectViewTab;
  currentProjectSpecMode?: ProjectSpecMode;
  brand?: string;
  onLogout: () => void;
  me: MeInfo | null;
}) {
  const permissions = useMemo(() => new Set(me?.permissions || []), [me?.permissions]);
  const items = allItems.filter((i) => permissions.has(i.perm));

  const [projects, setProjects] = useState<ProjectLite[]>([]);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [openPortfolios, setOpenPortfolios] = useState<Record<string, boolean>>({});
  const [openProjects, setOpenProjects] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!permissions.has("projects.view")) return;
    let alive = true;

    void api<{ items?: ProjectLite[] }>("/api/project?archived=0&limit=1000")
      .then((res) => {
        if (!alive) return;
        const rows = Array.isArray(res?.items) ? res.items : [];
        setProjects(rows);
      })
      .catch(() => {
        if (!alive) return;
        setProjects([]);
      });

    return () => {
      alive = false;
    };
  }, [me?.id, permissions]);

  const groupedProjects = useMemo(() => {
    const map = new Map<string, ProjectLite[]>();
    for (const project of projects) {
      const key = portfolioLabel(project.portfolioName);
      const bucket = map.get(key) || [];
      bucket.push(project);
      map.set(key, bucket);
    }

    return [...map.entries()]
      .map(([portfolio, rows]) => ({
        portfolio,
        rows: rows
          .filter((row) => row._id)
          .sort((a, b) =>
            String(a.name || "").localeCompare(String(b.name || ""), "ru", {
              sensitivity: "base",
            })
          ),
      }))
      .sort((a, b) => {
        if (a.portfolio === "Без портфеля") return 1;
        if (b.portfolio === "Без портфеля") return -1;
        return a.portfolio.localeCompare(b.portfolio, "ru", {
          sensitivity: "base",
        });
      });
  }, [projects]);

  useEffect(() => {
    setOpenPortfolios((prev) => {
      const next = { ...prev };
      for (const group of groupedProjects) {
        if (next[group.portfolio] === undefined) next[group.portfolio] = true;
      }
      return next;
    });
  }, [groupedProjects]);

  useEffect(() => {
    if (!currentProjectId) return;
    setProjectsOpen(true);
    setOpenProjects((prev) => ({ ...prev, [currentProjectId]: true }));
  }, [currentProjectId]);

  return (
    <aside className="w-80 shrink-0 border-r bg-background text-foreground flex flex-col">
      <div className="p-4 font-semibold truncate">{brand || "Work Manager"}</div>

      <nav className="space-y-1 p-2 overflow-y-auto min-h-0">
        {items.map((item) => {
          if (item.key !== "projects") {
            return (
              <button
                key={item.key}
                onClick={() => onSelect(item.key)}
                className={`w-full text-left rounded-xl px-3 py-2 hover:bg-muted ${
                  active === item.key ? "bg-muted" : ""
                }`}
              >
                {item.label}
              </button>
            );
          }

          return (
            <div key={item.key} className="rounded-2xl border border-transparent">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onSelect("projects")}
                  className={`flex-1 text-left rounded-xl px-3 py-2 hover:bg-muted ${
                    active === item.key ? "bg-muted" : ""
                  }`}
                >
                  {item.label}
                </button>
                <button
                  type="button"
                  onClick={() => setProjectsOpen((v) => !v)}
                  className="rounded-xl p-2 hover:bg-muted text-muted-foreground"
                  aria-label={projectsOpen ? "Свернуть проекты" : "Развернуть проекты"}
                >
                  <Chevron open={projectsOpen} />
                </button>
              </div>

              {projectsOpen && (
                <div className="mt-1 space-y-2 pl-2">
                  {groupedProjects.length === 0 ? (
                    <div className="rounded-xl border border-dashed px-3 py-2 text-xs text-muted-foreground">
                      Проекты пока не загружены
                    </div>
                  ) : (
                    groupedProjects.map((group) => {
                      const portfolioOpen = openPortfolios[group.portfolio] ?? true;

                      return (
                        <div key={group.portfolio} className="rounded-xl border overflow-hidden">
                          <button
                            type="button"
                            className="w-full px-3 py-2 bg-muted/40 flex items-center gap-2 text-left"
                            onClick={() =>
                              setOpenPortfolios((prev) => ({
                                ...prev,
                                [group.portfolio]: !portfolioOpen,
                              }))
                            }
                          >
                            <Chevron open={portfolioOpen} />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium truncate">{group.portfolio}</div>
                              <div className="text-[11px] text-muted-foreground">
                                {group.rows.length} проект(ов)
                              </div>
                            </div>
                          </button>

                          {portfolioOpen && (
                            <div className="bg-background">
                              {group.rows.map((project) => {
                                const projectId = String(project._id || "");
                                const projectOpen = openProjects[projectId] ?? currentProjectId === projectId;
                                const isCurrentProject = currentProjectId === projectId;

                                return (
                                  <div key={projectId} className="border-t first:border-t-0">
                                    <div className="flex items-center gap-1 px-2 py-1.5">
                                      <button
                                        type="button"
                                        className="rounded-lg p-1.5 hover:bg-muted text-muted-foreground"
                                        onClick={() =>
                                          setOpenProjects((prev) => ({
                                            ...prev,
                                            [projectId]: !projectOpen,
                                          }))
                                        }
                                        aria-label={projectOpen ? "Свернуть проект" : "Развернуть проект"}
                                      >
                                        <Chevron open={projectOpen} />
                                      </button>
                                      <button
                                        type="button"
                                        className={`min-w-0 flex-1 text-left rounded-lg px-2 py-1.5 hover:bg-muted ${
                                          isCurrentProject ? "bg-muted/70" : ""
                                        }`}
                                        onClick={() => onOpenProjectView(projectId, "about")}
                                      >
                                        <div className="truncate text-sm font-medium">
                                          {project.name || "Без названия"}
                                        </div>
                                      </button>
                                    </div>

                                    {projectOpen && (
                                      <div className="pb-2 pl-10 pr-2 space-y-1">
                                        {projectMenu.map((menuItem) => {
                                          const activeItem =
                                            isCurrentProject &&
                                            currentProjectTab === menuItem.tab &&
                                            (menuItem.tab !== "specs" ||
                                              currentProjectSpecMode === menuItem.specMode);

                                          return (
                                            <button
                                              key={`${projectId}:${menuItem.tab}:${menuItem.specMode || ""}`}
                                              type="button"
                                              className={`w-full text-left rounded-lg px-2 py-1.5 text-sm hover:bg-muted ${
                                                activeItem ? "bg-muted/70" : "text-muted-foreground"
                                              }`}
                                              onClick={() =>
                                                onOpenProjectView(
                                                  projectId,
                                                  menuItem.tab,
                                                  menuItem.specMode
                                                )
                                              }
                                            >
                                              {menuItem.label}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="border-t mt-2 px-3 py-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <UserMenu />
          <ThemeToggle />
        </div>
        <button
          type="button"
          className="w-full rounded-xl border px-3 py-2 text-sm hover:bg-muted transition"
          onClick={onLogout}
        >
          Выйти
        </button>
      </div>
    </aside>
  );
}