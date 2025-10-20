import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

type Entity = "project" | "person" | "task";
type FieldDef = {
  entity: Entity;
  key: string;
  label: string;
  type: "string" | "text" | "number" | "bool" | "date" | "select" | "multiselect";
  required?: boolean;
  options?: { value: string; label: string }[];
  default?: any;
  order?: number;
};

type Person = {
  _id: string;
  lastName?: string;
  firstName?: string;
  middleName?: string;
  email?: string;
};

function fio(p: Person) {
  return [p.lastName, p.firstName, p.middleName].filter(Boolean).join(" ");
}

export default function DynamicForm({
  entity,
  value,
  onChange,
}: {
  entity: Entity;
  value: any;
  onChange: (v: any) => void;
}) {
  const [defs, setDefs] = useState<FieldDef[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);

  // грузим схемы полей
  useEffect(() => {
    (async () => {
      try {
        const res = await api<FieldDef[]>(`/api/fields/${entity}`);
        const arr = Array.isArray(res) ? res : [];
        // сортировка по order, потом по label
        arr.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.label.localeCompare(b.label));
        setDefs(arr);
      } catch {
        setDefs([]);
      }
    })();
  }, [entity]);

  // список сотрудников — нужен для responsible_id
  useEffect(() => {
    if (entity !== "project") return;
    (async () => {
      try {
        const r = await api<any>(`/api/person?archived=0&limit=2000`);
        const items: Person[] = Array.isArray(r?.items) ? r.items : Array.isArray(r) ? r : [];
        setPersons(items);
      } catch {
        setPersons([]);
      }
    })();
  }, [entity]);

  const setVal = (path: string, v: any) => {
    // поддерживаем как "плоские" поля, так и extra.*
    if (path.startsWith("extra.")) {
      const k = path.substring("extra.".length);
      onChange({ ...value, extra: { ...(value?.extra || {}), [k]: v } });
    } else {
      onChange({ ...value, [path]: v });
    }
  };

  const personOptions = useMemo(
    () =>
      persons.map((p) => ({
        value: String(p._id),
        label: fio(p) || p.email || String(p._id),
      })),
    [persons]
  );

  // отрисовка инпута по типу
  const renderField = (fd: FieldDef) => {
    const labelText = fd.label; // ← БЕЗ "(key)"
    const path = fd.key; // наши кастомные поля сохраняем на верхнем уровне, как вы просили для бота

    // спец-кейс: ответственный проекта
    if (entity === "project" && fd.key === "responsible_id") {
      const v = value?.responsible_id ?? value?.responsibleId ?? "";
      return (
        <label key={fd.key} className="text-sm">
          {labelText}
          <select
            className="w-full rounded-xl border px-3 py-2 mt-1"
            value={v}
            onChange={(e) => setVal("responsible_id", e.target.value || "")}
          >
            <option value="">— не выбран —</option>
            {personOptions.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>
        </label>
      );
    }

    // обычные типы
    const val = value?.[path] ?? value?.extra?.[path] ?? fd.default ?? "";

    switch (fd.type) {
      case "string":
        return (
          <label key={fd.key} className="text-sm">
            {labelText}
            <input
              className="w-full rounded-xl border px-3 py-2 mt-1"
              value={val}
              onChange={(e) => setVal(path, e.target.value)}
            />
          </label>
        );

      case "text":
        return (
          <label key={fd.key} className="text-sm">
            {labelText}
            <textarea
              rows={4}
              className="w-full rounded-xl border px-3 py-2 mt-1"
              value={val}
              onChange={(e) => setVal(path, e.target.value)}
            />
          </label>
        );

      case "number":
        return (
          <label key={fd.key} className="text-sm">
            {labelText}
            <input
              type="number"
              className="w-full rounded-xl border px-3 py-2 mt-1"
              value={val}
              onChange={(e) => setVal(path, e.target.value === "" ? "" : Number(e.target.value))}
            />
          </label>
        );

      case "bool":
        return (
          <label key={fd.key} className="text-sm flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!val}
              onChange={(e) => setVal(path, e.target.checked)}
            />
            {labelText}
          </label>
        );

      case "date":
        // поддержим YYYY-MM-DD
        const toInputDate = (x: any) => {
          if (!x) return "";
          try {
            const d = new Date(x);
            if (Number.isNaN(d.getTime())) return "";
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const dd = String(d.getDate()).padStart(2, "0");
            return `${yyyy}-${mm}-${dd}`;
          } catch {
            return "";
          }
        };
        return (
          <label key={fd.key} className="text-sm">
            {labelText}
            <input
              type="date"
              className="w-full rounded-xl border px-3 py-2 mt-1"
              value={toInputDate(val)}
              onChange={(e) => setVal(path, e.target.value || null)}
            />
          </label>
        );

      case "select":
        return (
          <label key={fd.key} className="text-sm">
            {labelText}
            <select
              className="w-full rounded-xl border px-3 py-2 mt-1"
              value={val ?? ""}
              onChange={(e) => setVal(path, e.target.value)}
            >
              <option value="">— не выбрано —</option>
              {(fd.options || []).map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          </label>
        );

      case "multiselect":
        return (
          <label key={fd.key} className="text-sm">
            {labelText}
            <select
              multiple
              className="w-full rounded-xl border px-3 py-2 mt-1"
              value={Array.isArray(val) ? val : []}
              onChange={(e) =>
                setVal(
                  path,
                  Array.from(e.currentTarget.selectedOptions).map((o) => o.value)
                )
              }
            >
              {(fd.options || []).map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          </label>
        );

      default:
        return null;
    }
  };

  if (!defs.length) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {defs.map(renderField)}
    </div>
  );
}
