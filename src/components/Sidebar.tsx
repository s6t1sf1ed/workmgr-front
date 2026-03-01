import { useEffect, useState } from "react";
import { Me } from "../lib/api";
import ThemeToggle from "./ThemeToggle";
import UserMenu from "./UserMenu";

const baseItems = [
  { key: "projects", label: "Проекты" },
  { key: "tasks", label: "Задачи" },
  { key: "persons", label: "Сотрудники" },
  { key: "timesheet", label: "Табель" },
  { key: "fields", label: "Настройка полей" },
  { key: "reports", label: "Отчёты" },
];

export default function Sidebar({
  active,
  onSelect,
  brand,
  onLogout,
}: {
  active: string;
  onSelect: (k: string) => void;
  brand?: string;
  onLogout: () => void;
}) {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    Me.get()
      .then((m) => setRole(m.role || null))
      .catch(() => {});
  }, []);

  const items =
    role === "admin"
      ? [...baseItems, { key: "logs", label: "Логи" }]
      : baseItems;

  return (
    <aside className="w-64 shrink-0 border-r bg-background text-foreground flex flex-col">
      {/* название компании */}
      <div className="p-4 font-semibold truncate">
        {brand || "Work Manager"}
      </div>

      {/* навигация */}
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

      {/* низ сайдбара */}
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




