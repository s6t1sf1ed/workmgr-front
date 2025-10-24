import React, { useEffect, useMemo, useState, useRef } from "react";
import { api } from "../lib/api";

/* ================= Icons ================= */
const Icon = {
  Plus: (p: any) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path fill="currentColor" d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z" />
    </svg>
  ),
  Trash: (p: any) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path
        fill="currentColor"
        d="M6 7h12v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7zm3-3h6l1 1h4v2H4V5h4l1-1z"
      />
    </svg>
  ),
  Archive: (p: any) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path fill="currentColor" d="M3 3h18v4H3V3zm2 6h14v12H5V9zm3 3v2h8v-2H8z" />
    </svg>
  ),
  Restore: (p: any) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path
        fill="currentColor"
        d="M12 5V2L7 7l5 5V9c3.31 0 6 2.69 6 6a6 6 0 1 1-6-6z"
      />
    </svg>
  ),
  Check: (p: any) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19l12-12-1.4-1.4z" />
    </svg>
  ),
  X: (p: any) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path
        fill="currentColor"
        d="m18.3 5.7-1.4-1.4L12 9.2 7.1 4.3 5.7 5.7 10.6 10.6 5.7 15.5l1.4 1.4L12 12l4.9 4.9 1.4-1.4-4.9-4.9z"
      />
    </svg>
  ),
  ChevronDown: (p: any) => (
    <svg viewBox="0 0 24 24" width="14" height="14" {...p}>
      <path fill="currentColor" d="m7 10 5 5 5-5z" />
    </svg>
  ),
  Pencil: (p: any) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path
        fill="currentColor"
        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm14.71-9.04a1 1 0 000-1.41l-1.51-1.49a1 1 0 00-1.41 0l-1.34 1.34 3.75 3.75 1.51-1.49z"
      />
    </svg>
  ),
};

const iconBtn =
  "inline-flex items-center justify-center rounded-md border w-8 h-8 hover:bg-muted transition";

/* ================= Types ================= */
type Section = {
  _id: string;
  title: string;
  order?: number;
  deleted?: boolean;
};

type Item = {
  _id: string;
  sectionId: string;
  deleted?: boolean;

  pos?: string;
  name?: string;
  sku?: string;
  vendor?: string;
  unit?: string;
  qty?: number;
  price_work?: number;
  price_mat?: number;
  total?: number;

  version?: number;        // последняя сохранённая версия (max)
  activeVersion?: number;  // какая версия выбрана сейчас
  versions?: { v: number; savedAt?: string }[];
};

/* ================= API helpers ================= */
const Specs = {
  sections: {
    list: (projectId: string, deleted = 0) =>
      api<{ items: Section[] }>(
        `/api/projects/${projectId}/spec/sections?deleted=${deleted}`
      ),
    create: (projectId: string, title?: string) =>
      api<Section>(`/api/projects/${projectId}/spec/sections`, {
        method: "POST",
        body: JSON.stringify({ title: title || "Раздел" }),
      }),
    patch: (id: string, data: any) =>
      api<Section>(`/api/spec/sections/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    deleteForever: (id: string) =>
      api(`/api/spec/sections/${id}`, { method: "DELETE" }),
  },
  items: {
    list: (projectId: string, deleted = 0) =>
      api<{ items: Item[] }>(
        `/api/projects/${projectId}/spec/items?deleted=${deleted}`
      ),
    create: (projectId: string, sectionId: string, data: Partial<Item>) =>
      api<Item>(`/api/projects/${projectId}/spec/items`, {
        method: "POST",
        body: JSON.stringify({ sectionId, ...data }),
      }),
    commit: (id: string, data: Partial<Item>) =>
      api<Item>(`/api/spec/items/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ commit: true, data }),
      }),
    setActiveVersion: (id: string, v: number) =>
      api<Item>(`/api/spec/items/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ setActiveVersion: v }),
      }),
    softDelete: (id: string, flag: boolean) =>
      api<Item>(`/api/spec/items/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ deleted: flag }),
      }),
    moveToSection: (id: string, sectionId: string) =>
      api<Item>(`/api/spec/items/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ sectionId }),
      }),
    deleteForever: (id: string) =>
      api(`/api/spec/items/${id}`, { method: "DELETE" }),
  },
};

/* ================= Utils ================= */
const money = (n?: number) =>
  (Number.isFinite(n as number) ? (n as number) : 0).toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

type EditRow = {
  pos?: string;
  name?: string;
  sku?: string;
  vendor?: string;
  unit?: string;
  qty?: number | string;
  price_work?: number | string;
  price_mat?: number | string;
};

function computeTotal(d: EditRow): number {
  const qty = Number(d.qty || 0);
  const pw = Number(d.price_work || 0);
  const pm = Number(d.price_mat || 0);
  return qty * (pw + pm);
}

/* ====== Компактный селектор версий (не ломает таблицу) ====== */
function VersionSelect({
  av,
  versions,
  onPick,
}: {
  av: number;
  versions: number[];
  onPick: (v: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-md border px-2 h-8 text-xs"
        onClick={() => setOpen((v) => !v)}
      >
        v{av} <Icon.ChevronDown />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 min-w-[72px] rounded-md border bg-white shadow-lg">
          {versions.map((v) => (
            <button
              key={v}
              className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-muted ${
                v === av ? "font-medium" : ""
              }`}
              onClick={() => {
                setOpen(false);
                if (v !== av) onPick(v);
              }}
            >
              v{v}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================= Component ================= */
export default function SpecsTab({ projectId }: { projectId: string }) {
  const [sections, setSections] = useState<Section[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [showDeleted, setShowDeleted] = useState(false);

  // inline-редактор: по itemId; для новой позиции — ключ "new::<sectionId>"
  const [editing, setEditing] = useState<Record<string, EditRow>>({});

  const grouped = useMemo(() => {
    const bySection: Record<string, Item[]> = {};
    for (const it of items) {
      const sid = it.sectionId as string;
      if (!bySection[sid]) bySection[sid] = [];
      bySection[sid].push(it);
    }
    return bySection;
  }, [items]);

  async function loadAll() {
    const [sec, it] = await Promise.all([
      Specs.sections.list(projectId, showDeleted ? 1 : 0),
      Specs.items.list(projectId, showDeleted ? 1 : 0),
    ]);
    setSections(sec.items || []);
    setItems(
      (it.items || []).sort((a, b) => (a.pos || "").localeCompare(b.pos || ""))
    );
  }

  useEffect(() => {
    loadAll();
  }, [projectId, showDeleted]);

  /* ---------- Sections ---------- */
  const addSection = async () => {
    await Specs.sections.create(projectId, "Раздел");
    loadAll();
  };

  const toggleSectionArchive = async (s: Section) => {
    await Specs.sections.patch(s._id, { deleted: !s.deleted });
    loadAll();
  };

  const deleteSectionForever = async (s: Section) => {
    if (!confirm("Удалить раздел и все его позиции безвозвратно?")) return;
    await Specs.sections.deleteForever(s._id);
    loadAll();
  };

  /* ---------- Items ---------- */
  const startAddItem = (sectionId: string) => {
    setEditing((e) => ({
      ...e,
      [`new::${sectionId}`]: {
        pos: "",
        name: "",
        sku: "",
        vendor: "",
        unit: "",
        qty: 1,
        price_work: 0,
        price_mat: 0,
      },
    }));
  };

  const commitNewItem = async (sectionId: string) => {
    const key = `new::${sectionId}`;
    const data = editing[key];
    if (!data || !String(data.name || "").trim()) return;

    await Specs.items.create(projectId, sectionId, {
      pos: String(data.pos || ""),
      name: String(data.name || ""),
      sku: String(data.sku || ""),
      vendor: String(data.vendor || ""),
      unit: String(data.unit || ""),
      qty: Number(data.qty || 0),
      price_work: Number(data.price_work || 0),
      price_mat: Number(data.price_mat || 0),
    });
    setEditing((e) => {
      const c = { ...e };
      delete c[key];
      return c;
    });
    loadAll();
  };

  const cancelNewItem = (sectionId: string) => {
    const key = `new::${sectionId}`;
    setEditing((e) => {
      const c = { ...e };
      delete c[key];
      return c;
    });
  };

  const startEditItem = (it: Item) => {
    setEditing((e) => ({
      ...e,
      [it._id]: {
        pos: it.pos || "",
        name: it.name || "",
        sku: it.sku || "",
        vendor: it.vendor || "",
        unit: it.unit || "",
        qty: it.qty ?? 0,
        price_work: it.price_work ?? 0,
        price_mat: it.price_mat ?? 0,
      },
    }));
  };

  const cancelEditItem = (it: Item) => {
    setEditing((e) => {
      const c = { ...e };
      delete c[it._id];
      return c;
    });
  };

  const commitEditItem = async (it: Item) => {
    const d = editing[it._id];
    if (!d) return;
    await Specs.items.commit(it._id, {
      pos: String(d.pos || ""),
      name: String(d.name || ""),
      sku: String(d.sku || ""),
      vendor: String(d.vendor || ""),
      unit: String(d.unit || ""),
      qty: Number(d.qty || 0),
      price_work: Number(d.price_work || 0),
      price_mat: Number(d.price_mat || 0),
    });
    cancelEditItem(it);
    loadAll();
  };

  const toggleItemArchive = async (it: Item) => {
    await Specs.items.softDelete(it._id, !it.deleted);
    loadAll();
  };

  const deleteItemForever = async (it: Item) => {
    if (!confirm("Удалить позицию безвозвратно?")) return;
    await Specs.items.deleteForever(it._id);
    loadAll();
  };

  const setActiveVersion = async (it: Item, v: number) => {
    await Specs.items.setActiveVersion(it._id, v);
    loadAll();
  };

  /* ---------- cells ---------- */
  const cellInput = (
    id: string,
    field: keyof EditRow,
    w = "w-full",
    type: "text" | "number" = "text"
  ) => (
    <input
      className={`rounded-md border px-2 py-1 text-sm ${w}`}
      value={(editing[id]?.[field] as any) ?? ""}
      type={type}
      onChange={(e) =>
        setEditing((st) => ({
          ...st,
          [id]: {
            ...(st[id] || {}),
            [field]: type === "number" ? Number(e.target.value) : e.target.value,
          },
        }))
      }
    />
  );

  const actionsForItem = (it: Item) => {
    const isEdit = !!editing[it._id];
    return (
      <div className="flex gap-2 justify-end">
        {!showDeleted ? (
          <>
            {isEdit ? (
              <>
                <button
                  className={iconBtn}
                  title="Сохранить версию"
                  onClick={() => commitEditItem(it)}
                >
                  <Icon.Check />
                </button>
                <button
                  className={iconBtn}
                  title="Отмена"
                  onClick={() => cancelEditItem(it)}
                >
                  <Icon.X />
                </button>
              </>
            ) : (
              <>
                <button
                  className={iconBtn}
                  title="Редактировать"
                  onClick={() => startEditItem(it)}
                >
                  <Icon.Pencil />
                </button>
                <button
                  className={iconBtn}
                  title={it.deleted ? "Восстановить" : "В архив"}
                  onClick={() => toggleItemArchive(it)}
                >
                  {it.deleted ? <Icon.Restore /> : <Icon.Archive />}
                </button>
              </>
            )}
          </>
        ) : (
          <>
            <button
              className={iconBtn}
              title="Восстановить"
              onClick={() => toggleItemArchive(it)}
            >
              <Icon.Restore />
            </button>
            <button
              className={`${iconBtn} border-red-200 text-red-600 hover:bg-red-50`}
              title="Удалить навсегда"
              onClick={() => deleteItemForever(it)}
            >
              <Icon.Trash />
            </button>
          </>
        )}
      </div>
    );
  };

  const VersionCell: React.FC<{ it: Item }> = ({ it }) => {
    const av = it.activeVersion || 1;
    const vers =
      (it.versions || [])
        .map((x) => x.v)
        .filter((v) => Number.isFinite(v))
        .sort((a, b) => a - b) || [1];

    return (
      <VersionSelect
        av={av}
        versions={vers}
        onPick={(v) => setActiveVersion(it, v)}
      />
    );
  };

  return (
    <div className="space-y-4">
      {/* toolbar */}
      <div className="flex items-center gap-3">
        <button
          className="rounded-md border px-3 py-2 inline-flex items-center gap-2"
          onClick={addSection}
        >
          <Icon.Plus /> Раздел
        </button>
        <label className="ml-auto inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showDeleted}
            onChange={(e) => setShowDeleted(e.target.checked)}
          />{" "}
          Удалённые
        </label>
      </div>

      {/* sections */}
      {sections.map((s) => {
        const rows = grouped[s._id] || [];
        const newKey = `new::${s._id}`;
        const edNew = editing[newKey];

        return (
          <div key={s._id} className="rounded-2xl border overflow-hidden">
            <div className="bg-muted/40 px-3 py-2 flex items-center gap-2">
              <div className="font-medium">{s.title || "Раздел"}</div>
              <div className="ml-auto flex items-center gap-2">
                {!showDeleted ? (
                  <>
                    <button
                      className="rounded-md border px-2 py-1 inline-flex items-center gap-1"
                      title="Добавить позицию"
                      onClick={() => startAddItem(s._id)}
                    >
                      <Icon.Plus /> Позиция
                    </button>
                    <button
                      className={iconBtn}
                      title={s.deleted ? "Восстановить" : "В архив"}
                      onClick={() => toggleSectionArchive(s)}
                    >
                      {s.deleted ? <Icon.Restore /> : <Icon.Archive />}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className={iconBtn}
                      title="Восстановить"
                      onClick={() => toggleSectionArchive(s)}
                    >
                      <Icon.Restore />
                    </button>
                    <button
                      className={`${iconBtn} border-red-200 text-red-600 hover:bg-red-50`}
                      title="Удалить навсегда"
                      onClick={() => deleteSectionForever(s)}
                    >
                      <Icon.Trash />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white">
                  <tr className="border-b">
                    <th className="p-2 text-left w-16">№</th>
                    <th className="p-2 text-left">Наим.</th>
                    <th className="p-2 text-left w-40">Арт.</th>
                    <th className="p-2 text-left w-40">Пост.</th>
                    <th className="p-2 text-left w-28">Ед.изм.</th>
                    <th className="p-2 text-left w-24">Кол-во</th>
                    <th className="p-2 text-left w-28">Цена раб.</th>
                    <th className="p-2 text-left w-28">Цена мат.</th>
                    <th className="p-2 text-left w-28">Общ. ст.</th>
                    <th className="p-2 text-left w-24">Версия</th>
                    <th className="p-2 text-right w-36"></th>
                  </tr>
                </thead>
                <tbody>
                  {/* новая позиция (v1) */}
                  {edNew && (
                    <tr className="border-b bg-muted/10">
                      <td className="p-2">{cellInput(newKey, "pos", "w-16")}</td>
                      <td className="p-2">{cellInput(newKey, "name")}</td>
                      <td className="p-2">{cellInput(newKey, "sku")}</td>
                      <td className="p-2">{cellInput(newKey, "vendor")}</td>
                      <td className="p-2">{cellInput(newKey, "unit", "w-28")}</td>
                      <td className="p-2">
                        {cellInput(newKey, "qty", "w-24", "number")}
                      </td>
                      <td className="p-2">
                        {cellInput(newKey, "price_work", "w-28", "number")}
                      </td>
                      <td className="p-2">
                        {cellInput(newKey, "price_mat", "w-28", "number")}
                      </td>
                      <td className="p-2 w-28">
                        {money(computeTotal(edNew))}
                      </td>
                      <td className="p-2 text-xs">v1</td>
                      <td className="p-2">
                        <div className="flex gap-2 justify-end">
                          <button
                            className={iconBtn}
                            title="Создать"
                            onClick={() => commitNewItem(s._id)}
                          >
                            <Icon.Check />
                          </button>
                          <button
                            className={iconBtn}
                            title="Отмена"
                            onClick={() => cancelNewItem(s._id)}
                          >
                            <Icon.X />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}

                  {/* существующие позиции */}
                  {rows.map((it) => {
                    const ed = editing[it._id];
                    if (ed) {
                      const total = computeTotal(ed);
                      return (
                        <tr key={it._id} className="border-b bg-muted/10">
                          <td className="p-2">{cellInput(it._id, "pos", "w-16")}</td>
                          <td className="p-2">{cellInput(it._id, "name")}</td>
                          <td className="p-2">{cellInput(it._id, "sku")}</td>
                          <td className="p-2">{cellInput(it._id, "vendor")}</td>
                          <td className="p-2">{cellInput(it._id, "unit", "w-28")}</td>
                          <td className="p-2">
                            {cellInput(it._id, "qty", "w-24", "number")}
                          </td>
                          <td className="p-2">
                            {cellInput(it._id, "price_work", "w-28", "number")}
                          </td>
                          <td className="p-2">
                            {cellInput(it._id, "price_mat", "w-28", "number")}
                          </td>
                          <td className="p-2 w-28">{money(total)}</td>
                          <td className="p-2 text-xs">
                            <VersionCell it={it} />
                          </td>
                          <td className="p-2">{actionsForItem(it)}</td>
                        </tr>
                      );
                    }
                    const av = it.activeVersion || 1;
                    const versions =
                      (it.versions || [])
                        .map((x) => x.v)
                        .filter((v) => Number.isFinite(v))
                        .sort((a, b) => a - b) || [1];

                    return (
                      <tr key={it._id} className="border-b">
                        <td className="p-2">{it.pos || ""}</td>
                        <td className="p-2">{it.name || ""}</td>
                        <td className="p-2">{it.sku || ""}</td>
                        <td className="p-2">{it.vendor || ""}</td>
                        <td className="p-2">{it.unit || ""}</td>
                        <td className="p-2">{it.qty ?? ""}</td>
                        <td className="p-2">{it.price_work ?? ""}</td>
                        <td className="p-2">{it.price_mat ?? ""}</td>
                        <td className="p-2">{money(it.total)}</td>
                        <td className="p-2 text-xs">
                          <VersionSelect
                            av={av}
                            versions={versions}
                            onPick={(v) => setActiveVersion(it, v)}
                          />
                        </td>
                        <td className="p-2">{actionsForItem(it)}</td>
                      </tr>
                    );
                  })}

                  {!rows.length && !edNew && (
                    <tr>
                      <td
                        colSpan={11}
                        className="p-3 text-center text-sm text-muted-foreground"
                      >
                        Позиции нет
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {!sections.length && (
        <div className="text-sm text-muted-foreground">Разделов пока нет.</div>
      )}
    </div>
  );
}