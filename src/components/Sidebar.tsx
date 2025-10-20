import { useEffect, useState } from "react";
import { Me } from "../lib/api";

const baseItems = [
  { key: "projects", label: "Проекты" },
  { key: "tasks", label: "Задачи" },
  { key: "persons", label: "Сотрудники" },
  { key: "fields", label: "Настройка полей" },
  { key: "reports", label: "Отчёты" },
];

export default function Sidebar({
  active,
  onSelect,
  brand,
}: {
  active: string;
  onSelect: (k: string) => void;
  brand?: string;
}) {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    Me.get().then((m) => setRole(m.role || null)).catch(() => {});
  }, []);

  const items = role === "admin"
    ? [...baseItems, { key: "logs", label: "Логи" }]
    : baseItems;

  return (
    <aside className="w-64 shrink-0 border-r bg-background text-foreground">
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
    </aside>
  );
}

