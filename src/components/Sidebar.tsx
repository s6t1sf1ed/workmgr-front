import type { MeInfo } from "../lib/api";
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
];

export default function Sidebar({
  active,
  onSelect,
  brand,
  onLogout,
  me,
}: {
  active: string;
  onSelect: (k: string) => void;
  brand?: string;
  onLogout: () => void;
  me: MeInfo | null;
}) {
  const permissions = new Set(me?.permissions || []);
  const items = allItems.filter((i) => permissions.has(i.perm));

  return (
    <aside className="w-64 shrink-0 border-r bg-background text-foreground flex flex-col">
      <div className="p-4 font-semibold truncate">{brand || "Work Manager"}</div>

      <nav className="space-y-1 p-2">
        {items.map((i) => (
          <button
            key={i.key}
            onClick={() => onSelect(i.key)}
            className={`w-full text-left rounded-xl px-3 py-2 hover:bg-muted ${
              active === i.key ? "bg-muted" : ""
            }`}
          >
            {i.label}
          </button>
        ))}
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





