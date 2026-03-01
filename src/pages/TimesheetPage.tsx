import { useEffect, useMemo, useState } from "react";
import { api, downloadTimesheetXlsx } from "../lib/api";

type Person = {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  name?: string;
  surname?: string;
  patronymic?: string;
  email?: string;
  telegramId?: string | number;
  telegram_id?: string | number;
  archived?: boolean;
};

function idOf(x?: { _id?: string; id?: string }) {
  return (x?._id || x?.id || "") as string;
}

function displayName(p?: Person) {
  if (!p) return "";
  const ln = String(p.lastName || p.surname || "").trim();
  const fn = String(p.firstName || p.name || "").trim();
  const mn = String(p.middleName || p.patronymic || "").trim();
  return [ln, fn, mn].filter(Boolean).join(" ");
}

const LS_ONLY_ACTIVE_PERSONS = "ui.timesheet.filter.person.onlyActive";

function fioForFile(p?: Person): string {
  if (!p) return "Сотрудник";
  const fn = String(p.firstName || p.name || "").trim();
  const ln = String(p.lastName || p.surname || "").trim();

  let base = [fn, ln].filter(Boolean).join("_") || "Сотрудник";

  base = base.replace(/[^0-9A-Za-zА-Яа-я._-]+/g, "_");
  return base;
}

export default function TimesheetPage() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [personId, setPersonId] = useState<string>("");

  const [month, setMonth] = useState<string>(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return `${y}-${m}`;
  });

  const [loading, setLoading] = useState(false);

  const [onlyActivePersons, setOnlyActivePersons] = useState<boolean>(() => {
    return (localStorage.getItem(LS_ONLY_ACTIVE_PERSONS) ?? "1") !== "0";
  });

  // загрузка списка сотрудников
  async function loadPersons(onlyActive: boolean) {
    try {
      if (onlyActive) {
        const r1 = await api("/api/person?archived=0&limit=2000");
        setPersons((r1 as any)?.items || (r1 as any) || []);
        return;
      }
      // активные + архивные
      const [a0, a1] = await Promise.all([
        api("/api/person?archived=0&limit=2000"),
        api("/api/person?archived=1&limit=2000"),
      ]);
      const items = ([
        ...(((a0 as any)?.items || a0 || []) as Person[]),
        ...(((a1 as any)?.items || a1 || []) as Person[]),
      ] as Person[]);
      const byId = new Map<string, Person>();
      for (const p of items) byId.set(idOf(p), p);
      setPersons([...byId.values()]);
    } catch {
      // fallback на /api/users
      if (onlyActive) {
        const r2 = await api("/api/users?archived=0");
        setPersons((r2 as any)?.items || (r2 as any) || []);
        return;
      }
      const [u0, u1] = await Promise.all([
        api("/api/users?archived=0"),
        api("/api/users?archived=1"),
      ]);
      const items = ([
        ...(((u0 as any)?.items || u0 || []) as Person[]),
        ...(((u1 as any)?.items || u1 || []) as Person[]),
      ] as Person[]);
      const byId = new Map<string, Person>();
      for (const p of items) byId.set(idOf(p), p);
      setPersons([...byId.values()]);
    }
  }

  // первичная загрузка
  useEffect(() => {
    loadPersons(onlyActivePersons);
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_ONLY_ACTIVE_PERSONS, onlyActivePersons ? "1" : "0");
    loadPersons(onlyActivePersons);
  }, [onlyActivePersons]);

  const currentPerson = useMemo(
    () => persons.find((p) => idOf(p) === personId),
    [persons, personId]
  );

  async function generate() {
    if (!personId) {
      alert("Выберите сотрудника");
      return;
    }
    if (!month) {
      alert("Выберите месяц");
      return;
    }
    setLoading(true);
    try {
      const [year, monthNum] = month.split("-");
      const mm = monthNum || "01";
      const yyyy = year || "0000";

      const fioPart = fioForFile(currentPerson);
      const filename = `Табель_${fioPart}_${mm}_${yyyy}.xlsx`;

      await downloadTimesheetXlsx({ personId, month }, filename);
    } finally {
      setLoading(false);
    }
  }

  const personsForSelect = (onlyActivePersons
    ? persons.filter((p: any) => !p?.archived)
    : persons
  )
    .slice()
    .sort((a, b) => displayName(a).localeCompare(displayName(b), "ru"));

  return (
    <div className="space-y-4 max-w-xl">
      <div className="rounded-2xl border p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">Сотрудник</span>
            <select
              className="rounded-xl border px-3 py-2"
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
            >
              <option value="">— выберите сотрудника —</option>
              {personsForSelect.map((p) => {
                const baseLabel =
                  displayName(p) ||
                  (p.email ? String(p.email) : idOf(p));
                const archivedFlag =
                  (p as any).archived && !onlyActivePersons ? " (архив)" : "";
                return (
                  <option key={idOf(p)} value={idOf(p)}>
                    {baseLabel + archivedFlag}
                  </option>
                );
              })}
            </select>

            <label className="mt-2 flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={onlyActivePersons}
                onChange={(e) => setOnlyActivePersons(e.target.checked)}
              />
              <span>Только активные</span>
            </label>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">Период (месяц)</span>
            <input
              type="month"
              className="rounded-xl border px-3 py-2"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </label>
        </div>

        <button
          className="rounded-xl border px-4 py-2 bg-muted/50 disabled:opacity-60"
          onClick={generate}
          disabled={loading}
        >
          {loading ? "Формирование..." : "Сформировать"}
        </button>
      </div>
    </div>
  );
}