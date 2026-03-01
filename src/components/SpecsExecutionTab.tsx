import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../lib/api";

/* иконки */
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
  Unarchive: (p: any) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path
        fill="currentColor"
        d="M20 7V3H4v4h16zM6 9v10h12V9H6zm6 7l-4-4h3V9h2v3h3l-4 4z"
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
  Pencil: (p: any) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path
        fill="currentColor"
        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm14.71-9.04a1 1 0 0 0 0-1.41l-1.51-1.49a1 1 0 0 0-1.41 0l-1.34 1.34 3.75 3.75 1.51-1.49z"
      />
    </svg>
  ),
  Link: (p: any) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path
        fill="currentColor"
        d="M10.59 13.41a1.996 1.996 0 0 0 2.82 0l3.59-3.59a2 2 0 0 0-2.83-2.83l-1.17 1.17-1.41-1.41 1.17-1.17a4 4 0 1 1 5.66 5.66l-3.59 3.59a4 4 0 0 1-5.66 0l-1.17-1.17 1.41-1.41 1.18 1.16z"
      />
      <path
        fill="currentColor"
        d="M7.76 17.66a4 4 0 0 1 0-5.66l3.59-3.59a4 4 0 0 1 5.66 0l1.17 1.17-1.41 1.41-1.17-1.17a2 2 0 0 0-2.83 0l-3.59 3.59a2 2 0 0 0 0 2.83l1.17 1.17-1.41 1.41-1.18-1.16z"
      />
    </svg>
  ),
};

const iconBtn =
  "inline-flex items-center justify-center rounded-md border w-8 h-8 hover:bg-muted transition";

/* типы */

export type ExecSection = {
  _id: string;
  projectId: string;
  title?: string;
  order?: number;
  specSectionId?: string | null;
  deleted?: boolean;
};

export type ExecItem = {
  _id: string;
  projectId: string;
  execSectionId: string;
  specItemId?: string | null;
  pos?: string | number;
  name?: string;
  unit?: string;
  qty?: number;
  deleted?: boolean;
};

type SpecSectionLite = {
  _id: string;
  title?: string;
  activeVersion?: number;
  version?: number;
};

type SpecItemLite = {
  _id: string;
  sectionId: string;
  posStr?: string;
  name?: string;
};

/* API */

const API = {
  sections: {
    list: (projectId: string, deleted = 0) =>
      api<{ items: ExecSection[] }>(
        `/api/projects/${projectId}/exec/sections?deleted=${deleted}`
      ),
    create: (projectId: string, payload: Partial<ExecSection>) =>
      api<ExecSection>(`/api/projects/${projectId}/exec/sections`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    patch: (id: string, payload: Partial<ExecSection>) =>
      api<ExecSection>(`/api/exec/sections/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    deleteForever: (id: string) =>
      api(`/api/exec/sections/${id}`, {
        method: "DELETE",
      }),
  },
  items: {
    list: (projectId: string, deleted = 0) =>
      api<{ items: ExecItem[] }>(
        `/api/projects/${projectId}/exec/items?deleted=${deleted}`
      ),
    create: (projectId: string, payload: Partial<ExecItem>) =>
      api<ExecItem>(`/api/projects/${projectId}/exec/items`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    patch: (id: string, payload: Partial<ExecItem>) =>
      api<ExecItem>(`/api/exec/items/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    deleteForever: (id: string) =>
      api(`/api/exec/items/${id}`, {
        method: "DELETE",
      }),
  },
  specs: {
    sections: (projectId: string) =>
      api<{ items: SpecSectionLite[] }>(
        `/api/projects/${projectId}/spec/sections?deleted=0`
      ),
    items: (projectId: string) =>
      api<{ items: SpecItemLite[] }>(
        `/api/projects/${projectId}/spec/items?deleted=0`
      ),
  },
};

/* Utils */

function sectionVersionLite(s: { activeVersion?: number; version?: number }) {
  return s.activeVersion || s.version || 1;
}

function comparePosStr(a?: string, b?: string) {
  const as = (a || "").split(".").map((x) => parseInt(x, 10) || 0);
  const bs = (b || "").split(".").map((x) => parseInt(x, 10) || 0);
  const len = Math.max(as.length, bs.length);
  for (let i = 0; i < len; i++) {
    const av = as[i] ?? 0;
    const bv = bs[i] ?? 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}

/* Component */

type Props = {
  projectId: string;
};

type ItemDraft = {
  pos?: string | number;
  name?: string;
  unit?: string;
  qty?: number | string;
  specItemId?: string | null;
};

type SectionDraft = {
  title: string;
  specSectionId: string;
};

export default function SpecsExecutionTab({ projectId }: Props) {
  const [sections, setSections] = useState<ExecSection[]>([]);
  const [items, setItems] = useState<ExecItem[]>([]);
  const [onlyArchive, setOnlyArchive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // выбранное выполнение (документ)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  // спецификация
  const [specSections, setSpecSections] = useState<SpecSectionLite[]>([]);
  const [specItems, setSpecItems] = useState<SpecItemLite[]>([]);

  // создание выполнения
  const [creatingSection, setCreatingSection] = useState(false);
  const [sectionDraft, setSectionDraft] = useState<SectionDraft>({
    title: "",
    specSectionId: "",
  });

  // переименование выполнения
  const [renaming, setRenaming] = useState<Record<string, string>>({});

  // редактирование / создание позиций
  const [editing, setEditing] = useState<Record<string, ItemDraft>>({});

  // поповер привязки
  const [linkPopover, setLinkPopover] = useState<{
    rowKey: string;
    sectionId: string;
  } | null>(null);
  const [linkSearch, setLinkSearch] = useState("");
  const linkPopoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!linkPopoverRef.current) return;
      const el = e.target as HTMLElement;
      if (!el.closest("[data-link-popover-root]")) {
        setLinkPopover(null);
        setLinkSearch("");
      }
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, []);

  /* загрузка спецификации */

  async function loadSpecs() {
    if (!projectId) return;
    try {
      const [secRes, itemRes] = await Promise.all([
        API.specs.sections(projectId),
        API.specs.items(projectId),
      ]);
      setSpecSections(secRes.items || []);
      setSpecItems(itemRes.items || []);
    } catch (e) {
      console.error("SpecsExecutionTab loadSpecs error:", e);
    }
  }

  /* загрузка выполнений */

  async function loadExec() {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const [secRes, itemRes] = await Promise.all([
        API.sections.list(projectId, onlyArchive ? 1 : 0),
        API.items.list(projectId, onlyArchive ? 1 : 0),
      ]);
      const secs = (secRes.items || []).slice().sort((a, b) => {
        return (a.order ?? 0) - (b.order ?? 0);
      });
      setSections(secs);
      setItems(itemRes.items || []);
    } catch (e: any) {
      console.error("SpecsExecutionTab loadExec error:", e);
      const msg =
        e?.message ||
        e?.response?.data?.message ||
        e?.response?.data?.detail ||
        "Не удалось загрузить выполнение";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSpecs();
  }, [projectId]);

  useEffect(() => {
    loadExec();
  }, [projectId, onlyArchive]);

  /* карты */

  const itemsBySection = useMemo(() => {
    const map: Record<string, ExecItem[]> = {};
    for (const it of items) {
      if (!map[it.execSectionId]) map[it.execSectionId] = [];
      map[it.execSectionId].push(it);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => {
        const pa = Number(a.pos ?? 0);
        const pb = Number(b.pos ?? 0);
        return pa - pb;
      });
    }
    return map;
  }, [items]);

  const specSectionById = useMemo(() => {
    const m: Record<string, SpecSectionLite> = {};
    for (const s of specSections) m[s._id] = s;
    return m;
  }, [specSections]);

  const specItemById = useMemo(() => {
    const m: Record<string, SpecItemLite> = {};
    for (const it of specItems) m[it._id] = it;
    return m;
  }, [specItems]);

  const specItemsBySection = useMemo(() => {
    const m: Record<string, SpecItemLite[]> = {};
    for (const it of specItems) {
      if (!m[it.sectionId]) m[it.sectionId] = [];
      m[it.sectionId].push(it);
    }
    for (const key of Object.keys(m)) {
      m[key].sort((a, b) => comparePosStr(a.posStr, b.posStr));
    }
    return m;
  }, [specItems]);

  const filteredSections = useMemo(
    () =>
      sections.filter((s) => (onlyArchive ? !!s.deleted : !s.deleted)),
    [sections, onlyArchive]
  );

  const activeSection =
    activeSectionId &&
    sections.find((s) => String(s._id) === String(activeSectionId));

  /* создание выполнения */

  const startCreateSection = () => {
    setCreatingSection(true);
    setSectionDraft({
      title: "",
      specSectionId: "",
    });
  };

  const cancelCreateSection = () => {
    setCreatingSection(false);
    setSectionDraft({
      title: "",
      specSectionId: "",
    });
  };

  const saveCreateSection = async () => {
    if (!sectionDraft.title.trim()) {
      alert("Укажите название выполнения");
      return;
    }
    if (!sectionDraft.specSectionId) {
      alert("Выберите раздел спецификации");
      return;
    }
    try {
      await API.sections.create(projectId, {
        title: sectionDraft.title.trim(),
        specSectionId: sectionDraft.specSectionId,
      });
      cancelCreateSection();
      await loadExec();
    } catch (e: any) {
      console.error("SpecsExecutionTab saveCreateSection error:", e);
      const msg =
        e?.message ||
        e?.response?.data?.message ||
        e?.response?.data?.detail ||
        "Не удалось создать выполнение";
      alert(msg);
    }
  };

  /* разделы: редактирование / архив / удаление */

  const saveSectionTitle = async (s: ExecSection) => {
    const title = (renaming[s._id] ?? s.title ?? "").trim();
    if (title && title !== s.title) {
      await API.sections.patch(s._id, { title });
      await loadExec();
    }
    setRenaming((r) => {
      const c = { ...r };
      delete c[s._id];
      return c;
    });
  };

  const toggleSectionArchive = async (s: ExecSection) => {
    try {
      await API.sections.patch(s._id, { deleted: !s.deleted });
      if (activeSectionId === s._id) {
        setActiveSectionId(null);
        setEditing({});
        setLinkPopover(null);
        setLinkSearch("");
      }
      await loadExec();
    } catch (e: any) {
      console.error("SpecsExecutionTab toggleSectionArchive error:", e);
      const msg =
        e?.message ||
        e?.response?.data?.message ||
        e?.response?.data?.detail ||
        "Не удалось изменить статус выполнения";
      alert(msg);
    }
  };

  const deleteSectionForever = async (s: ExecSection) => {
    if (!confirm(`Удалить выполнение «${s.title || s._id}» безвозвратно?`))
      return;
    try {
      await API.sections.deleteForever(s._id);
      if (activeSectionId === s._id) {
        setActiveSectionId(null);
        setEditing({});
        setLinkPopover(null);
        setLinkSearch("");
      }
      await loadExec();
    } catch (e: any) {
      console.error("SpecsExecutionTab deleteSectionForever error:", e);
      const msg =
        e?.message ||
        e?.response?.data?.message ||
        e?.response?.data?.detail ||
        "Не удалось удалить выполнение";
      alert(msg);
    }
  };

  /* позиции: создание / редактирование */

  const startAddItem = (sectionId: string) => {
    const key = `new::${sectionId}::${Date.now().toString(36)}${Math.random()
      .toString(36)
      .slice(2, 6)}`;
    setEditing((e) => ({
      ...e,
      [key]: {
        pos: "",
        name: "",
        unit: "",
        qty: 0,
        specItemId: null,
      },
    }));
  };

  const startEditItem = (it: ExecItem) => {
    setEditing((e) => ({
      ...e,
      [it._id]: {
        pos: it.pos ?? "",
        name: it.name ?? "",
        unit: it.unit ?? "",
        qty: it.qty ?? 0,
        specItemId: it.specItemId ?? null,
      },
    }));
  };

  const cancelEditItem = (rowKey: string) => {
    setEditing((e) => {
      const c = { ...e };
      delete c[rowKey];
      return c;
    });
  };

  const commitNewItem = async (rowKey: string, section: ExecSection) => {
    const draft = editing[rowKey];
    if (!draft || !String(draft.name || "").trim()) {
      alert("Укажите наименование позиции");
      return;
    }
    try {
      await API.items.create(projectId, {
        execSectionId: section._id,
        pos: draft.pos,
        name: String(draft.name || ""),
        unit: String(draft.unit || ""),
        qty: Number(draft.qty || 0),
        specItemId: draft.specItemId || null,
      });
      cancelEditItem(rowKey);
      await loadExec();
    } catch (e: any) {
      console.error("SpecsExecutionTab commitNewItem error:", e);
      const msg =
        e?.message ||
        e?.response?.data?.message ||
        e?.response?.data?.detail ||
        "Не удалось создать позицию выполнения";
      alert(msg);
    }
  };

  const commitEditItem = async (it: ExecItem) => {
    const draft = editing[it._id];
    if (!draft) return;
    if (!String(draft.name || "").trim()) {
      alert("Укажите наименование позиции");
      return;
    }
    try {
      await API.items.patch(it._id, {
        pos: draft.pos,
        name: String(draft.name || ""),
        unit: String(draft.unit || ""),
        qty: Number(draft.qty || 0),
        specItemId: draft.specItemId || null,
      });
      cancelEditItem(it._id);
      await loadExec();
    } catch (e: any) {
      console.error("SpecsExecutionTab commitEditItem error:", e);
      const msg =
        e?.message ||
        e?.response?.data?.message ||
        e?.response?.data?.detail ||
        "Не удалось сохранить позицию выполнения";
      alert(msg);
    }
  };

  const toggleItemArchive = async (it: ExecItem) => {
    try {
      await API.items.patch(it._id, { deleted: !it.deleted });
      await loadExec();
    } catch (e: any) {
      console.error("SpecsExecutionTab toggleItemArchive error:", e);
      const msg =
        e?.message ||
        e?.response?.data?.message ||
        e?.response?.data?.detail ||
        "Не удалось изменить статус позиции";
      alert(msg);
    }
  };

  const deleteItemForever = async (it: ExecItem) => {
    if (!confirm("Удалить позицию выполнения безвозвратно?")) return;
    try {
      await API.items.deleteForever(it._id);
      await loadExec();
    } catch (e: any) {
      console.error("SpecsExecutionTab deleteItemForever error:", e);
      const msg =
        e?.message ||
        e?.response?.data?.message ||
        e?.response?.data?.detail ||
        "Не удалось удалить позицию выполнения";
      alert(msg);
    }
  };

  /* привязка к позиции спецификации */

  const openLinkPopover = (rowKey: string, sectionId: string) => {
    setLinkPopover({ rowKey, sectionId });
    setLinkSearch("");
  };

  const setRowSpecItem = (rowKey: string, specItemId: string | null) => {
    setEditing((st) => ({
      ...st,
      [rowKey]: {
        ...(st[rowKey] || {}),
        specItemId,
      },
    }));
  };

  /* =RENDER= */

  // список выполнений
  if (!activeSection) {
    return (
      <div className="space-y-4 min-h-[calc(100vh-140px)] overflow-visible">
        {/* toolbar */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-md border px-3 py-2 inline-flex items-center gap-2"
            onClick={startCreateSection}
          >
            <Icon.Plus />
            Создать выполнение
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className={`rounded-md border px-3 h-9 text-sm ${
                onlyArchive ? "bg-muted/60" : ""
              }`}
              onClick={() => {
                setActiveSectionId(null);
                setEditing({});
                setLinkPopover(null);
                setLinkSearch("");
                setOnlyArchive((v) => !v);
              }}
            >
              {onlyArchive ? "Архив: включён" : "Архив"}
            </button>
          </div>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        {/* форма создания выполнения */}
        {creatingSection && (
          <div className="rounded-2xl border overflow-hidden">
            <div className="bg-muted/40 px-3 py-2 text-sm font-medium">
              Новое выполнение
            </div>
            <div className="p-3 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    Название выполнения
                  </div>
                  <input
                    className="w-full rounded-md border px-2 py-1 text-sm"
                    value={sectionDraft.title}
                    onChange={(e) =>
                      setSectionDraft((d) => ({ ...d, title: e.target.value }))
                    }
                    placeholder="Например, Выполнение №1"
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">
                    Раздел спецификации
                  </div>
                  <select
                    className="w-full rounded-md border px-2 py-1 text-sm bg-background"
                    value={sectionDraft.specSectionId}
                    onChange={(e) =>
                      setSectionDraft((d) => ({
                        ...d,
                        specSectionId: e.target.value,
                      }))
                    }
                  >
                    <option value="">Не выбрано</option>
                    {specSections.map((ss) => (
                      <option key={ss._id} value={ss._id}>
                        {ss.title || "Без названия"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  className="rounded-md border px-3 h-9 text-sm"
                  onClick={cancelCreateSection}
                >
                  Отмена
                </button>
                <button
                  type="button"
                  className="rounded-md border px-3 h-9 text-sm bg-muted"
                  onClick={saveCreateSection}
                >
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        )}

        {/* таблица выполнений */}
        <div className="rounded-2xl border overflow-hidden">
          <div className="bg-muted/40 px-3 py-2 text-sm font-medium">
            Выполнения
          </div>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm zebra">
              <thead className="bg-background sticky top-0 z-10">
                <tr className="border-b">
                  <th className="p-2 text-left">Название выполнения</th>
                  <th className="p-2 text-left w-40">Статус</th>
                  <th className="p-2 text-center w-28">Позиции</th>
                  <th className="p-2 text-right w-44"></th>
                </tr>
              </thead>
              <tbody>
                {filteredSections.map((s) => {
                  const secSpecs = s.specSectionId
                    ? specSectionById[s.specSectionId]
                    : undefined;
                  const secVersion = secSpecs
                    ? sectionVersionLite(secSpecs)
                    : null;
                  const posCount =
                    (itemsBySection[s._id] || []).filter(
                      (it) => !!it && !it.deleted
                    ).length;

                  const status = s.deleted ? "В архиве" : "Активна";

                  return (
                    <tr
                      key={s._id}
                      className="border-b hover:bg-muted/40 cursor-pointer"
                      onClick={() => {
                        setActiveSectionId(s._id);
                        setEditing({});
                        setLinkPopover(null);
                        setLinkSearch("");
                      }}
                    >
                      <td className="p-2">
                        {renaming[s._id] !== undefined ? (
                          <input
                            autoFocus
                            className="rounded-md border px-2 py-1 text-sm"
                            value={renaming[s._id]}
                            onChange={(e) =>
                              setRenaming((r) => ({
                                ...r,
                                [s._id]: e.target.value,
                              }))
                            }
                            onBlur={(e) => {
                              e.stopPropagation();
                              saveSectionTitle(s);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.stopPropagation();
                                void saveSectionTitle(s);
                              }
                            }}
                          />
                        ) : (
                          <button
                            type="button"
                            className="text-sm font-medium text-left hover:underline"
                            title="Переименовать выполнение"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenaming((r) => ({
                                ...r,
                                [s._id]: s.title || "",
                              }));
                            }}
                          >
                            {s.title || "Выполнение"}
                          </button>
                        )}
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {secSpecs ? (
                            <>
                              <span>
                                Раздел спецификации:{" "}
                                {secSpecs.title || "Без названия"}
                              </span>
                              {secVersion !== null && (
                                <span> · v{secVersion}</span>
                              )}
                            </>
                          ) : (
                            <span>Раздел спецификации не выбран</span>
                          )}
                        </div>
                      </td>
                      <td className="p-2 w-40">{status}</td>
                      <td className="p-2 w-28 text-center">{posCount}</td>
                      <td className="p-2 w-44">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            className="rounded-md border px-3 h-8 text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveSectionId(s._id);
                              setEditing({});
                              setLinkPopover(null);
                              setLinkSearch("");
                            }}
                          >
                            Открыть
                          </button>

                          {!onlyArchive ? (
                            <button
                              type="button"
                              className={iconBtn}
                              title="В архив"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSectionArchive(s);
                              }}
                            >
                              <Icon.Archive />
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                className={iconBtn}
                                title="Восстановить"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleSectionArchive(s);
                                }}
                              >
                                <Icon.Unarchive />
                              </button>
                              <button
                                type="button"
                                className={`${iconBtn} border-red-200 text-red-600 hover:bg-red-50`}
                                title="Удалить навсегда"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteSectionForever(s);
                                }}
                              >
                                <Icon.Trash />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {!filteredSections.length && (
                  <tr>
                    <td
                      className="p-3 text-center text-sm text-muted-foreground"
                      colSpan={4}
                    >
                      Выполнений пока нет.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {loading && !filteredSections.length && (
          <div className="text-sm text-muted-foreground">Загрузка…</div>
        )}
      </div>
    );
  }

  /* режим внутри конкретного выполнения */

  const secItemsAll = itemsBySection[activeSection._id] || [];
  const secItems = secItemsAll.filter((it) =>
    onlyArchive ? !!it.deleted : !it.deleted
  );
  const secSpecs = activeSection.specSectionId
    ? specSectionById[activeSection.specSectionId]
    : undefined;
  const secVersion = secSpecs ? sectionVersionLite(secSpecs) : null;

  return (
    <div className="space-y-4 min-h-[calc(100vh-140px)] overflow-visible">
      {/* навигация и инфа по выполнению */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-md border px-3 h-9 text-sm"
          onClick={() => {
            setActiveSectionId(null);
            setEditing({});
            setLinkPopover(null);
            setLinkSearch("");
          }}
        >
          ← К списку выполнений
        </button>

        <div className="flex flex-col">
          <div className="text-sm font-medium">
            {activeSection.title || "Выполнение"}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {secSpecs ? (
              <>
                <span>
                  Раздел спецификации: {secSpecs.title || "Без названия"}
                </span>
                {secVersion !== null && <span> · v{secVersion}</span>}
              </>
            ) : (
              <span>Раздел спецификации не выбран</span>
            )}
          </div>
        </div>
      </div>

      {/* карточка с таблицей и кнопками +Позиция / Архив */}
      <div className="rounded-2xl border overflow-visible">
        <div className="bg-muted/40 px-3 py-2 flex items-center gap-2">
          <div className="text-sm font-medium">Позиции выполнения</div>

          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md border px-4 h-9 text-sm"
              onClick={() => startAddItem(activeSection._id)}
            >
              <Icon.Plus /> Позиция
            </button>

            {!onlyArchive ? (
              <button
                type="button"
                className={iconBtn}
                title={activeSection.deleted ? "Восстановить" : "В архив"}
                onClick={() => toggleSectionArchive(activeSection)}
              >
                {activeSection.deleted ? <Icon.Unarchive /> : <Icon.Archive />}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className={iconBtn}
                  title="Восстановить"
                  onClick={() => toggleSectionArchive(activeSection)}
                >
                  <Icon.Unarchive />
                </button>
                <button
                  type="button"
                  className={`${iconBtn} border-red-200 text-red-600 hover:bg-red-50`}
                  title="Удалить навсегда"
                  onClick={() => deleteSectionForever(activeSection)}
                >
                  <Icon.Trash />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="relative overflow-x-auto overflow-y-visible max-h-none">
          <table className="w-full text-sm zebra">
            <thead className="sticky top-0 bg-background z-10">
              <tr className="border-b">
                <th className="p-2 text-left w-16">№</th>
                <th className="p-2 text-left">Наименование</th>
                <th className="p-2 text-left w-32">Ед. изм.</th>
                <th className="p-2 text-right w-32">Кол-во (факт)</th>
                <th className="p-2 text-right w-40" />
              </tr>
            </thead>
            <tbody>
              {/* новые строки */}
              {Object.keys(editing)
                .filter((k) => k.startsWith(`new::${activeSection._id}::`))
                .map((rowKey) => {
                  const d = editing[rowKey] || {};
                  const linked = d.specItemId && specItemById[d.specItemId];
                  const sectionSpecItems = activeSection.specSectionId
                    ? specItemsBySection[activeSection.specSectionId] || []
                    : [];

                  return (
                    <tr key={rowKey} className="border-b">
                      <td className="p-2 w-16">
                        <input
                          className="w-full rounded-md border px-2 py-1 text-sm"
                          value={d.pos ?? ""}
                          onChange={(e) =>
                            setEditing((st) => ({
                              ...st,
                              [rowKey]: {
                                ...(st[rowKey] || {}),
                                pos: e.target.value,
                              },
                            }))
                          }
                        />
                      </td>
                      <td className="p-2" data-link-popover-root>
                        <div className="space-y-1">
                          <input
                            className="w-full rounded-md border px-2 py-1 text-sm"
                            placeholder="Наименование позиции"
                            value={d.name ?? ""}
                            onChange={(e) =>
                              setEditing((st) => ({
                                ...st,
                                [rowKey]: {
                                  ...(st[rowKey] || {}),
                                  name: e.target.value,
                                },
                              }))
                            }
                          />
                          {linked && (
                            <div className="text-xs text-muted-foreground">
                              Привязано к спецификации:{" "}
                              {linked.posStr && (
                                <>
                                  {linked.posStr} ·{" "}
                                </>
                              )}
                              {linked.name}
                            </div>
                          )}
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-md border px-2 h-7 text-xs hover:bg-muted"
                            onClick={() =>
                              openLinkPopover(rowKey, activeSection._id)
                            }
                            disabled={!sectionSpecItems.length}
                          >
                            <Icon.Link />
                            {linked
                              ? "Изменить привязку"
                              : "Привязать к позиции спецификации"}
                          </button>

                          {linkPopover && linkPopover.rowKey === rowKey && (
                            <div
                              ref={linkPopoverRef}
                              className="mt-1 rounded-md border bg-background shadow-lg p-2 text-xs max-h-64 overflow-auto"
                            >
                              {!activeSection.specSectionId ? (
                                <div className="text-muted-foreground">
                                  Раздел выполнения не привязан к разделу
                                  спецификации.
                                </div>
                              ) : !sectionSpecItems.length ? (
                                <div className="text-muted-foreground">
                                  В связанном разделе спецификации нет позиций.
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2 mb-2">
                                    <input
                                      className="flex-1 rounded-md border px-2 py-1 text-xs"
                                      placeholder="Поиск по имени"
                                      value={linkSearch}
                                      onChange={(e) =>
                                        setLinkSearch(e.target.value)
                                      }
                                    />
                                    <button
                                      type="button"
                                      className="rounded-md border px-2 h-7 text-xs"
                                      onClick={() =>
                                        setRowSpecItem(rowKey, null)
                                      }
                                    >
                                      Сбросить
                                    </button>
                                  </div>
                                  {sectionSpecItems
                                    .filter((it) =>
                                      linkSearch
                                        ? (it.name || "")
                                            .toLowerCase()
                                            .includes(
                                              linkSearch.toLowerCase()
                                            )
                                        : true
                                    )
                                    .map((it) => (
                                      <button
                                        key={it._id}
                                        type="button"
                                        className={`w-full text-left px-2 py-1 rounded-md hover:bg-muted ${
                                          d.specItemId === it._id
                                            ? "bg-muted"
                                            : ""
                                        }`}
                                        onClick={() => {
                                          setRowSpecItem(rowKey, it._id);
                                          setLinkPopover(null);
                                          setLinkSearch("");
                                        }}
                                      >
                                        <div className="font-medium">
                                          {it.posStr && (
                                            <span className="mr-1">
                                              {it.posStr}
                                            </span>
                                          )}
                                          {it.name}
                                        </div>
                                      </button>
                                    ))}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-2 w-32">
                        <input
                          className="w-full rounded-md border px-2 py-1 text-sm"
                          value={d.unit ?? ""}
                          onChange={(e) =>
                            setEditing((st) => ({
                              ...st,
                              [rowKey]: {
                                ...(st[rowKey] || {}),
                                unit: e.target.value,
                              },
                            }))
                          }
                        />
                      </td>
                      <td className="p-2 w-32 text-right">
                        <input
                          type="number"
                          className="w-full rounded-md border px-2 py-1 text-sm text-right"
                          value={d.qty ?? ""}
                          onChange={(e) =>
                            setEditing((st) => ({
                              ...st,
                              [rowKey]: {
                                ...(st[rowKey] || {}),
                                qty: e.target.value,
                              },
                            }))
                          }
                        />
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            className={iconBtn}
                            title="Создать"
                            onClick={() => commitNewItem(rowKey, activeSection)}
                          >
                            <Icon.Check />
                          </button>
                          <button
                            type="button"
                            className={iconBtn}
                            title="Отмена"
                            onClick={() => cancelEditItem(rowKey)}
                          >
                            <Icon.X />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* существующие позиции */}
              {secItems.map((it) => {
                const draft = editing[it._id];
                const linked =
                  (draft?.specItemId ?? it.specItemId) &&
                  specItemById[(draft?.specItemId ?? it.specItemId) as string];
                const sectionSpecItems = activeSection.specSectionId
                  ? specItemsBySection[activeSection.specSectionId] || []
                  : [];
                const faded = it.deleted && !onlyArchive ? "opacity-50" : "";

                if (draft) {
                  return (
                    <tr key={it._id} className={`border-b ${faded}`}>
                      <td className="p-2 w-16">
                        <input
                          className="w-full rounded-md border px-2 py-1 text-sm"
                          value={draft.pos ?? ""}
                          onChange={(e) =>
                            setEditing((st) => ({
                              ...st,
                              [it._id]: {
                                ...(st[it._id] || {}),
                                pos: e.target.value,
                              },
                            }))
                          }
                        />
                      </td>
                      <td className="p-2" data-link-popover-root>
                        <div className="space-y-1">
                          <input
                            className="w-full rounded-md border px-2 py-1 text-sm"
                            value={draft.name ?? ""}
                            onChange={(e) =>
                              setEditing((st) => ({
                                ...st,
                                [it._id]: {
                                  ...(st[it._id] || {}),
                                  name: e.target.value,
                                },
                              }))
                            }
                          />
                          {linked && (
                            <div className="text-xs text-muted-foreground">
                              Привязано к спецификации:{" "}
                              {linked.posStr && (
                                <>
                                  {linked.posStr} ·{" "}
                                </>
                              )}
                              {linked.name}
                            </div>
                          )}
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-md border px-2 h-7 text-xs hover:bg-muted"
                            onClick={() =>
                              openLinkPopover(it._id, activeSection._id)
                            }
                            disabled={!sectionSpecItems.length}
                          >
                            <Icon.Link />
                            {linked
                              ? "Изменить привязку"
                              : "Привязать к позиции спецификации"}
                          </button>

                          {linkPopover && linkPopover.rowKey === it._id && (
                            <div
                              ref={linkPopoverRef}
                              className="mt-1 rounded-md border bg-background shadow-lg p-2 text-xs max-h-64 overflow-auto"
                            >
                              {!activeSection.specSectionId ? (
                                <div className="text-muted-foreground">
                                  Раздел выполнения не привязан к разделу
                                  спецификации.
                                </div>
                              ) : !sectionSpecItems.length ? (
                                <div className="text-muted-foreground">
                                  В связанном разделе спецификации нет позиций.
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2 mb-2">
                                    <input
                                      className="flex-1 rounded-md border px-2 py-1 text-xs"
                                      placeholder="Поиск по имени"
                                      value={linkSearch}
                                      onChange={(e) =>
                                        setLinkSearch(e.target.value)
                                      }
                                    />
                                    <button
                                      type="button"
                                      className="rounded-md border px-2 h-7 text-xs"
                                      onClick={() =>
                                        setRowSpecItem(it._id, null)
                                      }
                                    >
                                      Сбросить
                                    </button>
                                  </div>
                                  {sectionSpecItems
                                    .filter((si) =>
                                      linkSearch
                                        ? (si.name || "")
                                            .toLowerCase()
                                            .includes(
                                              linkSearch.toLowerCase()
                                            )
                                        : true
                                    )
                                    .map((si) => (
                                      <button
                                        key={si._id}
                                        type="button"
                                        className={`w-full text-left px-2 py-1 rounded-md hover:bg-muted ${
                                          draft.specItemId === si._id
                                            ? "bg-muted"
                                            : ""
                                        }`}
                                        onClick={() => {
                                          setRowSpecItem(it._id, si._id);
                                          setLinkPopover(null);
                                          setLinkSearch("");
                                        }}
                                      >
                                        <div className="font-medium">
                                          {si.posStr && (
                                            <span className="mr-1">
                                              {si.posStr}
                                            </span>
                                          )}
                                          {si.name}
                                        </div>
                                      </button>
                                    ))}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-2 w-32">
                        <input
                          className="w-full rounded-md border px-2 py-1 text-sm"
                          value={draft.unit ?? ""}
                          onChange={(e) =>
                            setEditing((st) => ({
                              ...st,
                              [it._id]: {
                                ...(st[it._id] || {}),
                                unit: e.target.value,
                              },
                            }))
                          }
                        />
                      </td>
                      <td className="p-2 w-32 text-right">
                        <input
                          type="number"
                          className="w-full rounded-md border px-2 py-1 text-sm text-right"
                          value={draft.qty ?? ""}
                          onChange={(e) =>
                            setEditing((st) => ({
                              ...st,
                              [it._id]: {
                                ...(st[it._id] || {}),
                                qty: e.target.value,
                              },
                            }))
                          }
                        />
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            className={iconBtn}
                            title="Сохранить"
                            onClick={() => commitEditItem(it)}
                          >
                            <Icon.Check />
                          </button>
                          <button
                            type="button"
                            className={iconBtn}
                            title="Отмена"
                            onClick={() => cancelEditItem(it._id)}
                          >
                            <Icon.X />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                // просмотр
                return (
                  <tr
                    key={it._id}
                    className={`border-b ${
                      it.deleted && !onlyArchive ? "opacity-50" : ""
                    }`}
                  >
                    <td className="p-2 w-16">{it.pos ?? ""}</td>
                    <td className="p-2">
                      <div className="font-medium">{it.name || "—"}</div>
                      {it.specItemId && specItemById[it.specItemId] && (
                        <div className="text-xs text-muted-foreground">
                          {specItemById[it.specItemId].posStr && (
                            <>
                              {specItemById[it.specItemId].posStr}
                              {" · "}
                            </>
                          )}
                          {specItemById[it.specItemId].name}
                        </div>
                      )}
                    </td>
                    <td className="p-2 w-32">{it.unit || ""}</td>
                    <td className="p-2 w-32 text-right">{it.qty ?? ""}</td>
                    <td className="p-2">
                      <div className="flex gap-2 justify-end">
                        {!onlyArchive && (
                          <>
                            <button
                              type="button"
                              className={iconBtn}
                              title="Редактировать"
                              onClick={() => startEditItem(it)}
                            >
                              <Icon.Pencil />
                            </button>
                            <button
                              type="button"
                              className={iconBtn}
                              title={it.deleted ? "Восстановить" : "В архив"}
                              onClick={() => toggleItemArchive(it)}
                            >
                              {it.deleted ? (
                                <Icon.Unarchive />
                              ) : (
                                <Icon.Archive />
                              )}
                            </button>
                          </>
                        )}
                        {onlyArchive && (
                          <>
                            <button
                              type="button"
                              className={iconBtn}
                              title="Восстановить"
                              onClick={() => toggleItemArchive(it)}
                            >
                              <Icon.Unarchive />
                            </button>
                            <button
                              type="button"
                              className={`${iconBtn} border-red-200 text-red-600 hover:bg-red-50`}
                              title="Удалить навсегда"
                              onClick={() => deleteItemForever(it)}
                            >
                              <Icon.Trash />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!secItems.length &&
                !Object.keys(editing).some((k) =>
                  k.startsWith(`new::${activeSection._id}::`)
                ) && (
                  <tr>
                    <td
                      className="p-3 text-center text-sm text-muted-foreground"
                      colSpan={5}
                    >
                      Позиции выполнения отсутствуют.
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
