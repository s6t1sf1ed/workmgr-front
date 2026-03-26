import React, { useEffect, useMemo, useRef, useState } from "react";
import { api, downloadBlob } from "../lib/api";

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
  ChevronRight: (p: any) => (
    <svg viewBox="0 0 24 24" width="14" height="14" {...p}>
      <path fill="currentColor" d="m9 6 6 6-6 6z" />
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
  Gear: (p: any) => (
    <svg viewBox="0 0 24 24" width="16" height="16" {...p}>
      <path
        fill="currentColor"
        d="M19.14,12.94a7.43,7.43,0,0,0,.05-.94,7.43,7.43,0,0,0-.05-.94l2-1.55a.5.5,0,0,0,.12-.64l-1.9-3.29a.5.5,0,0,0-.61-.22l-2.35,1a7.28,7.28,0,0,0-1.62-.94l-.36-2.5A.5.5,0,0,0,12.9,2H9.1a.5.5,0,0,0-.5.42l-.36,2.5A7.28,7.28,0,0,0,6.62,5.86l-2.35-1a.5.5,0,0,0-.61.22L1.76,8.37a.5.5,0,0,0,.12.64l2,1.55a7.43,7.43,0,0,0-.05.94,7.43,7.43,0,0,0,.05.94l-2,1.55a.5.5,0,0,0,.12.64l1.9,3.29a.5.5,0,0,0,.61.22l2.35-1a7.28,7.28,0,0,0,1.62.94l.36,2.5a.5.5,0,0,0,.5.42h3.8a.5.5,0,0,0,.5-.42l.36-2.5a7.28,7.28,0,0,0,1.62-.94l2.35,1a.5.5,0,0,0,.61-.22l1.9-3.29a.5.5,0,0,0,.12-.64ZM11,15a3,3,0,1,1,3-3A3,3,0,0,1,11,15Z"
      />
    </svg>
  ),
};

const iconBtn =
  "inline-flex items-center justify-center rounded-md border w-8 h-8 hover:bg-muted transition";

/* типы */

export type Section = {
  _id: string;
  title: string;
  order?: number;
  deleted?: boolean;
  comment?: string;
  activeVersion?: number;
  version?: number;
  versions?: { v: number; savedAt?: string }[];
  columns?: { order: string[]; hidden: string[] };
};

export type Item = {
  _id: string;
  sectionId: string;
  parentId?: string | null;
  level?: number;
  path?: number[];
  pos?: number | string;
  posStr?: string;
  deleted?: boolean;
  name?: string;
  sku?: string;
  vendor?: string;
  unit?: string;
  qty?: number;
  price_work?: number;
  price_mat?: number;
  total?: number;
  activeVersion?: number;
  version?: number;
  versions?: { v: number; savedAt?: string }[];
  note?: string;

  rowType?: "item" | "header";
};

export type TreeNode = Item & { children: TreeNode[] };


export type SectionAttachment = {
  _id: string;
  filename: string;
  size?: number;
  contentType?: string;
  uploadedAt?: string;
};

/* API */

const API = {
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
      api(`/api/spec/sections/${id}`, {
        method: "DELETE",
      }),

    deleteVersion: (id: string, v: number) =>
      api<Section>(`/api/spec/sections/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ deleteVersion: v }),
      }),

    commitSnapshot: (id: string) =>
      api<Section>(`/api/spec/sections/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ commit: true }),
      }),

    attachments: {
      list: (sectionId: string) =>
        api<{ items: SectionAttachment[] }>(
          `/api/spec/sections/${sectionId}/attachments`
        ),

      upload: (sectionId: string, file: File) => {
        const fd = new FormData();
        fd.append("file", file);
        return api(`/api/spec/sections/${sectionId}/attachments`, {
          method: "POST",
          body: fd,
        });
      },

      download: (sectionId: string, fileId: string) =>
        downloadBlob(
          `/api/spec/sections/${sectionId}/attachments/${fileId}/download`
        ),

      delete: (sectionId: string, fileId: string) =>
        api(`/api/spec/sections/${sectionId}/attachments/${fileId}`, {
          method: "DELETE",
        }),
    },
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

    deleteVersion: (id: string, v: number) =>
      api<Item>(`/api/spec/items/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ deleteVersion: v }),
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

    updateActive: (id: string, data: Partial<Item>) =>
      api<Item>(`/api/spec/items/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ updateActive: true, data }),
      }),

    deleteForever: (id: string) =>
      api(`/api/spec/items/${id}`, {
        method: "DELETE",
      }),

    details: (id: string) => api<any>(`/api/spec/items/${id}`),
  },

  reorder: (data: {
    sectionId: string;
    itemId: string;
    targetParentId?: string | null;
    targetIndex: number;
    forVersion?: number;
  }) =>
    api(`/api/spec/reorder`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  specExcel: {
    exportSection: (sectionId: string) =>
      downloadBlob(`/api/spec/sections/${sectionId}/export`),
    importSection: (sectionId: string, file: File) => {
      const fd = new FormData();
      fd.append("file", file);

      return api(`/api/spec/sections/${sectionId}/import`, {
        method: "POST",
        body: fd,
      });
    },
  },
};

/* utils */

export const money = (n?: number) =>
  (Number.isFinite(n as number) ? (n as number) : 0).toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

type EditRow = {
  pos?: string | number;
  name?: string;
  sku?: string;
  vendor?: string;
  unit?: string;
  qty?: number | string;
  price_work?: number | string;
  price_mat?: number | string;
  note?: string;

  rowType?: "item" | "header";
};

function computeTotal(d: EditRow): number {
  const qty = Number(d.qty || 0);
  const pw = Number(d.price_work || 0);
  const pm = Number(d.price_mat || 0);
  return qty * (pw + pm);
}

function formatBytes(n?: number) {
  const x = Number(n || 0);
  if (!x) return "0 B";
  const k = 1024;
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(x) / Math.log(k)));
  const v = x / Math.pow(k, i);
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function sectionVersion(s: Section) {
  return s.activeVersion || s.version || 1;
}

export function filterBySectionVersion(s: Section, rows: Item[]) {
  const v = sectionVersion(s);
  return rows.filter((it) =>
    (it.versions || []).some((rec) => Number(rec.v) === v)
  );
}

export function buildTree(rows: Item[]): TreeNode[] {
  const map: Record<string, TreeNode> = {};
  const roots: TreeNode[] = [];

  rows.forEach(
    (r) =>
      (map[r._id] = { ...(r as any), children: [] } as TreeNode)
  );

  rows.forEach((r) => {
    const pid = (r as any).parentId || null;
    if (pid && map[pid]) map[pid].children.push(map[r._id]);
    else roots.push(map[r._id]);
  });

  const getPos = (x: any) => Number(x.posPreview ?? x.pos ?? 0);

  const sortRec = (arr: TreeNode[]) => {
    arr.sort((a, b) => getPos(a) - getPos(b));
    arr.forEach((ch) => sortRec(ch.children));
  };
  sortRec(roots);

  return roots;
}

/* Метаданные столбцов (без "version") */

export const COL_META: Record<
  string,
  { label: string; w?: string; isCalc?: boolean }
> = {
  pos: { label: "№", w: "w-16" },
  name: { label: "Наименование" },
  sku: { label: "Артикул", w: "w-40" },
  vendor: { label: "Поставщик", w: "w-40" },
  unit: { label: "Единица измерения", w: "w-28" },
  qty: { label: "Количество", w: "w-24" },
  price_work: { label: "Цена работы", w: "w-28" },
  price_mat: { label: "Цена материалов", w: "w-28" },
  total: { label: "Стоимость", w: "w-28", isCalc: true },
  note: { label: "Примечание", w: "w-64" },
};

/* селектор версий РАЗДЕЛА */

function VersionSelect({
  av,
  versions,
  onPick,
  onDelete,
}: {
  av: number;
  versions: number[];
  onPick: (v: number) => void | Promise<void>;
  onDelete: (v: number) => void | Promise<void>;
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
    <div ref={ref} className="relative inline-flex items-center">
      <button
        type="button"
        className="inline-flex items-center gap-1 rounded-md border px-2 h-8 text-xs"
        onClick={() => setOpen((v) => !v)}
      >
        v{av}
        <Icon.ChevronDown />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-[70] min-w-[112px] max-h-[70vh] overflow-auto rounded-md border bg-background shadow-lg">
          {versions.map((v) => (
            <div key={v} className="flex items-center justify-between">
              <button
                type="button"
                className={`block text-left px-3 py-1.5 text-xs hover:bg-muted ${
                  v === av ? "font-medium" : ""
                }`}
                onClick={async () => {
                  setOpen(false);
                  if (v !== av) await onPick(v);
                }}
              >
                v{v}
              </button>
              {v !== av && v !== 1 && (
                <button
                  type="button"
                  className="px-2 text-xs text-red-600 hover:text-red-700"
                  title="Удалить версию"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={async (e) => {
                    e.stopPropagation();
                    setOpen(false);
                    if (confirm(`Удалить версию v${v}?`)) {
                      await onDelete(v);
                    }
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SpecsTab({ projectId }: { projectId: string }) {
  const [sections, setSections] = useState<Section[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [onlyArchive, setOnlyArchive] = useState(false);
  const [dragItem, setDragItem] = useState<{
    sectionId: string;
    itemId: string;
    parentId: string | null;
  } | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<string | null>(null);

  // Режим правки по разделам
  const [editSections, setEditSections] = useState<Record<string, boolean>>({});

  // режим завершения (edit | replace)
  const [sectionFinishMode, setSectionFinishMode] = useState<
    Record<string, "edit" | "replace" | undefined>
  >({});

  // редактирование строк (а также черновики new::...)
  const [editing, setEditing] = useState<Record<string, EditRow>>({});

  // Поповер "шестерёнки"
  const [gearOpen, setGearOpen] = useState<string | null>(null);

  // Локальный черновик колонок (чисто визуальный, без API)
  const [colDraft, setColDraft] = useState<
    Record<string, { order: string[]; hidden: string[] } | null>
  >({});

  // выбранный раздел (detail view), null — список разделов
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null
  );

  const [importingSectionId, setImportingSectionId] = useState<string | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onDown = (e: any) => {
      const el = e.target as HTMLElement;
      if (!el.closest("[data-gear-popover]")) setGearOpen(null);
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, []);

  const [attachmentsBySection, setAttachmentsBySection] = useState<
    Record<string, SectionAttachment[]>
  >({});
  const [attachmentsLoading, setAttachmentsLoading] = useState<
    Record<string, boolean>
  >({});
  const [uploadingSectionId, setUploadingSectionId] = useState<string | null>(
    null
  );

  const attachInputRef = useRef<HTMLInputElement | null>(null);
  const [attachPickSectionId, setAttachPickSectionId] = useState<string | null>(
    null
  );

  const [attachmentDeleting, setAttachmentDeleting] = useState<Record<string, boolean>>({});

  // Группировка по разделам без превью-перестановки
  const grouped = useMemo(() => {
    const bySection: Record<string, Item[]> = {};
    for (const it of items) {
      const sid = it.sectionId as string;
      if (!bySection[sid]) bySection[sid] = [];
      bySection[sid].push(it);
    }
    for (const sid of Object.keys(bySection)) {
      bySection[sid].sort(
        (a: any, b: any) =>
          Number(a.pos ?? 0) - Number(b.pos ?? 0)
      );
    }
    return bySection;
  }, [items]);

  async function loadAll() {
    const [secActive, secDeleted] = await Promise.all([
      API.sections.list(projectId, 0),
      API.sections.list(projectId, 1),
    ]);
    const itResp = await API.items.list(projectId, onlyArchive ? 1 : 0);
    const its = itResp.items || [];

    let secs: Section[];
    if (!onlyArchive) {
      secs = secActive.items || [];
    } else {
      const deletedMap: Record<string, Section> = {};
      for (const s of secDeleted.items || []) deletedMap[s._id] = s;

      const activeMap: Record<string, Section> = {};
      for (const s of secActive.items || []) activeMap[s._id] = s;

      const secIdsWithArchivedItems = new Set(its.map((x) => x.sectionId));
      for (const id of secIdsWithArchivedItems) {
        if (!deletedMap[id] && activeMap[id]) deletedMap[id] = activeMap[id];
      }
      secs = Object.values(deletedMap);
    }

    secs.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    setSections(secs);
    setItems(its);

  }

  const handleExportSection = async (s: Section) => {
    try {
      const blob = await API.specExcel.exportSection(s._id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(s.title || "section").replace(
        /["\\/\r\n]+/g,
        "_"
      )}_v${sectionVersion(s)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e?.message || "Ошибка экспорта");
    }
  };

  const handleImportFileChange: React.ChangeEventHandler<HTMLInputElement> =
    async (e) => {
      const file = e.target.files?.[0] || null;
      // сбрасываем value, чтобы можно было выбрать тот же файл
      e.target.value = "";
      if (!file || !importingSectionId) {
        setImportingSectionId(null);
        return;
      }

      if (!file.name.toLowerCase().endsWith(".xlsx")) {
        alert("Нужен .xlsx файл");
        setImportingSectionId(null);
        return;
      }

      try {
        await API.specExcel.importSection(importingSectionId, file);
        await loadAll();
      } catch (err: any) {
        alert(err?.message || "Ошибка импорта");
      } finally {
        setImportingSectionId(null);
      }
    };

  useEffect(() => {
    loadAll();
  }, [projectId, onlyArchive]);

  const loadAttachments = async (sectionId: string) => {
    setAttachmentsLoading((m) => ({ ...m, [sectionId]: true }));
    try {
      const resp = await API.sections.attachments.list(sectionId);
      setAttachmentsBySection((m) => ({
        ...m,
        [sectionId]: resp.items || [],
      }));
    } finally {
      setAttachmentsLoading((m) => ({ ...m, [sectionId]: false }));
    }
  };

  const handleAttachmentsFileChange: React.ChangeEventHandler<HTMLInputElement> =
    async (e) => {
      const files = Array.from(e.target.files || []);
      e.target.value = "";
      const sid = attachPickSectionId;
      setAttachPickSectionId(null);

      if (!sid || files.length === 0) return;

      try {
        setUploadingSectionId(sid);
        for (const f of files) {
          await API.sections.attachments.upload(sid, f);
        }
        await loadAttachments(sid);
      } catch (err: any) {
        alert(err?.message || "Ошибка загрузки вложения");
      } finally {
        setUploadingSectionId(null);
      }
    };

  const downloadAttachment = async (sectionId: string, a: SectionAttachment) => {
    try {
      const blob = await API.sections.attachments.download(sectionId, a._id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = a.filename || "file";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e?.message || "Ошибка скачивания");
    }
  };

  const deleteAttachment = async (sectionId: string, fileId: string) => {
    if (!confirm("Удалить вложение?")) return;

    const key = `${sectionId}:${fileId}`;
    setAttachmentDeleting((m) => ({ ...m, [key]: true }));

    try {
      await API.sections.attachments.delete(sectionId, fileId);

      // удаляем из списка
      setAttachmentsBySection((m) => ({
        ...m,
        [sectionId]: (m[sectionId] || []).filter((x) => x._id !== fileId),
      }));
    } catch (e: any) {
      alert(e?.message || "Ошибка удаления вложения");
    } finally {
      setAttachmentDeleting((m) => {
        const copy = { ...m };
        delete copy[key];
        return copy;
      });
    }
  };

  useEffect(() => {
    if (selectedSectionId) {
      void loadAttachments(selectedSectionId);
    }
  }, [selectedSectionId]);

  // если выбранный раздел исчез (удален/отфильтрован) — выходим в список
  useEffect(() => {
    if (
      selectedSectionId &&
      !sections.some((s) => s._id === selectedSectionId)
    ) {
      setSelectedSectionId(null);
    }
  }, [sections, selectedSectionId]);

  /* Sections */

  const [renaming, setRenaming] = useState<Record<string, string>>({});

  const addSection = async () => {
    const created = await API.sections.create(projectId, "Раздел");
    setRenaming((r) => ({ ...r, [created._id]: created.title || "" }));
    setSelectedSectionId(created._id); // проваливаемся в новый раздел
    await loadAll();
  };

  const saveSectionTitle = async (s: Section) => {
    const title = (renaming[s._id] ?? s.title ?? "").trim();
    if (title && title !== s.title) {
      await API.sections.patch(s._id, { title });
      await loadAll();
    }
    setRenaming((r) => {
      const c = { ...r };
      delete c[s._id];
      return c;
    });
  };

  const toggleSectionArchive = async (s: Section) => {
    await API.sections.patch(s._id, { deleted: !s.deleted });
    await loadAll();
  };

  const deleteSectionForever = async (s: Section) => {
    if (!confirm("Удалить раздел и все его позиции безвозвратно?")) return;
    await API.sections.deleteForever(s._id);
    await loadAll();
  };

  const saveSectionComment = async (s: Section, comment: string) => {
    await API.sections.patch(s._id, { comment });
  };

  const setSectionActiveVersion = async (s: Section, v: number) => {
    await API.sections.patch(s._id, { setActiveVersion: v });
    await loadAll();
  };

  async function deleteSectionVersion(s: Section, v: number) {
    try {
      const vv = Number(v);
      setSections((prev) =>
        prev.map((sec) =>
          sec._id === s._id
            ? {
                ...sec,
                versions: (sec.versions || []).filter((x) => x.v !== vv),
              }
            : sec
        )
      );
      await API.sections.deleteVersion(s._id, vv);
      await loadAll();
    } catch (e: any) {
      await loadAll();
      const msg =
        e?.message ||
        e?.response?.data?.message ||
        e?.response?.data?.detail ||
        "Не удалось удалить версию";
      alert(msg);
      console.error("deleteSectionVersion error:", e);
    }
  }

  // столбцы
  function getSectionColumns(s: Section) {
    const draft = colDraft[s._id] ?? undefined;
    const src =
      draft ??
      s.columns ?? {
        order: [],
       hidden: [],
      };

    let order = (src.order || []).filter((k) => COL_META[k]);
    const hidden = (src.hidden || []).filter((k) => COL_META[k]);

    // Если порядок не задан, берём все колонки по умолчанию
    if (!order.length) {
      order = Object.keys(COL_META);
    } else {
      for (const key of Object.keys(COL_META)) {
        if (!order.includes(key)) order.push(key);
      }
    }

  return { order, hidden };
}

  function startEditColumns(s: Section) {
    // если уже есть черновик - не пересоздаём его, иначе всё сбрасывается
    setColDraft((prev) => {
      if (prev[s._id]) return prev;

      const base =
        s.columns ||
        ({
          order: Object.keys(COL_META),
          hidden: [],
        } as {
          order: string[];
          hidden: string[];
        });

      const order =
        base.order && base.order.length
          ? base.order.filter((k) => COL_META[k])
          : Object.keys(COL_META);
      
      for (const key of Object.keys(COL_META)) {
        if (!order.includes(key)) order.push(key);
      }

      const hidden = (base.hidden || []).filter((k) => COL_META[k]);

      return {
        ...prev,
        [s._id]: {
          order,
          hidden,
        },
      };
    });
    setGearOpen(s._id);
  }

  function changeColumnVisibility(
    s: Section,
    key: string,
    checked: boolean
  ) {
    setColDraft((m) => {
      const cur =
        m[s._id] ||
        ({
          order: [],
          hidden: [],
        } as { order: string[]; hidden: string[] });
      const hidden = new Set(cur.hidden || []);
      if (checked) hidden.delete(key);
      else hidden.add(key);
      const order = cur.order.includes(key)
        ? cur.order.slice()
        : [...cur.order, key];
      return {
        ...m,
        [s._id]: { order, hidden: Array.from(hidden) },
      };
    });
  }

  function moveColumn(s: Section, key: string, dir: -1 | 1) {
    setColDraft((m) => {
      const cur =
        m[s._id] ||
        ({
          order: [],
          hidden: [],
        } as { order: string[]; hidden: string[] });
      const idx = cur.order.indexOf(key);
      if (idx === -1) return m;
      const to = idx + dir;
      if (to < 0 || to >= cur.order.length) return m;
      const next = cur.order.slice();
      const [k] = next.splice(idx, 1);
      next.splice(to, 0, k);
      return {
        ...m,
        [s._id]: { ...cur, order: next },
      };
    });
  }

  /* Items */

  const startAddItem = (
    sectionId: string,
    parentId: string | null = null,
    rowType: "item" | "header" = "item"
  ) => {
    const uid =
      Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const key = `new::${sectionId}::${parentId ?? "root"}::${uid}`;
    setEditing((e) => ({
      ...e,
      [key]: {
        name: "",
        sku: "",
        vendor: "",
        unit: "",
        qty: rowType === "item" ? 1 : undefined,
        price_work: rowType === "item" ? 0 : undefined,
        price_mat: rowType === "item" ? 0 : undefined,
        note: "",
        rowType,
      },
    }));
  };

  // Создание новой позиции:
  // В режиме Изменить: сразу пишем в БД
  // В режиме Заменить: оставляем черновиком
  const commitNewItem = async (
    section: Section,
    key: string,
    parentId: string | null
  ) => {
    const data = editing[key];
    if (!data || !String(data.name || "").trim()) return;

    const mode = sectionFinishMode[section._id];
    if (mode === "replace") {
      // в режиме Заменить остаётся черновиком для v+1
      return;
    }

    const v = sectionVersion(section);
    const parentNorm = parentId ?? null;

    let nextPos = 1;
    const siblings = items.filter((it) => {
      if (it.sectionId !== section._id) return false;
      const itParent = (it.parentId ?? null) as string | null;
      if (itParent !== parentNorm) return false;
      if (!(it.versions || []).some((rec) => Number(rec.v) === v)) return false;
      return true;
    });

    if (siblings.length > 0) {
      const maxPos = Math.max(
        ...siblings.map((it) => {
          const p = Number(it.pos ?? 0);
          return Number.isFinite(p) ? p : 0;
        })
      );
      nextPos = maxPos + 1;
    }

    await API.items.create(projectId, section._id, {
      parentId,
      pos: nextPos,
      name: String(data.name || ""),
      sku: String(data.sku || ""),
      vendor: String(data.vendor || ""),
      unit: String(data.unit || ""),
      qty: Number(data.qty || 0),
      price_work: Number(data.price_work || 0),
      price_mat: Number(data.price_mat || 0),
      note: String(data.note || ""),
      rowType: data.rowType || "item",
    });

    setEditing((e) => {
      const c = { ...e };
      delete c[key];
      return c;
    });
    await loadAll();
  };

  const cancelNewItem = (key: string) => {
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
        name: it.name || "",
        sku: it.sku || "",
        vendor: it.vendor || "",
        unit: it.unit || "",
        qty: it.qty ?? 0,
        price_work: it.price_work ?? 0,
        price_mat: it.price_mat ?? 0,
        note: it.note || "",
        rowType: it.rowType || "item",
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
    const mode = sectionFinishMode[it.sectionId];
    if (!d) return;
    // В Заменить не коммитим поштучно - сохранится пакетно в v+1
    if (mode === "replace") return;

    const payload: Partial<Item> = {
      name: String(d.name || ""),
      sku: String(d.sku || ""),
      vendor: String(d.vendor || ""),
      unit: String(d.unit || ""),
      qty: d.rowType === "header" ? undefined : Number(d.qty || 0),
      price_work: d.rowType === "header" ? undefined : Number(d.price_work || 0),
      price_mat: d.rowType === "header" ? undefined : Number(d.price_mat || 0),
      note: String(d.note || ""),
      rowType: d.rowType || "item",
    };
    const res = await API.items.updateActive(it._id, payload);
    setItems((arr) => arr.map((x) => (x._id === it._id ? { ...x, ...res } : x)));
    cancelEditItem(it);
  };

  const toggleItemArchive = async (it: Item) => {
    await API.items.softDelete(it._id, !it.deleted);
    await loadAll();
  };

  const deleteItemForever = async (it: Item) => {
    if (!confirm("Удалить позицию безвозвратно?")) return;
    await API.items.deleteForever(it._id);
    await loadAll();
  };

  /* drag & drop */

  async function reorderWithinParent(
    s: Section,
    node: TreeNode,
    siblings: TreeNode[],
    targetIndex0: number
  ) {
    const clamped0 = Math.max(0, Math.min(siblings.length - 1, targetIndex0));
    const currentIndex0 = siblings.findIndex((x) => x._id === node._id);
    if (currentIndex0 === clamped0) return;

    await API.reorder({
      sectionId: s._id,
      itemId: node._id,
      targetParentId: (node.parentId ?? null) || null,
      targetIndex: clamped0 + 1,
      forVersion: sectionVersion(s),
    });

    await loadAll();
  }

  /* cells/actions */

  const cellInput = (
    id: string,
    field: keyof EditRow,
    w = "w-full",
    type: "text" | "number" = "text"
  ) => (
    <input
      className={`border rounded-md px-2 py-1 text-xs h-7 bg-background ${w}`}
      value={
        editing[id] && (editing[id] as any)[field] != null
          ? String((editing[id] as any)[field])
          : ""
      }
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

  const actionsForItem = (
    node: TreeNode,
    sectionEditing: boolean,
  ) => {
    if (onlyArchive) {
      return (
        <div className="flex gap-2 justify-end">
          <button
            className={iconBtn}
            title="Восстановить"
            onClick={() => toggleItemArchive(node)}
          >
            <Icon.Unarchive />
          </button>
          <button
            className={`${iconBtn} border-red-200 text-red-600 hover:bg-red-50`}
            title="Удалить навсегда"
            onClick={() => deleteItemForever(node)}
          >
            <Icon.Trash />
          </button>
        </div>
      );
    }

    const isEdit = !!editing[node._id];
    return (
      <div className="flex gap-2 justify-end">
        {isEdit ? (
          <>
            <button
              className={iconBtn}
              title="Сохранить"
              onClick={() => commitEditItem(node)}
            >
              <Icon.Check />
            </button>
            <button
              className={iconBtn}
              title="Отмена"
              onClick={() => cancelEditItem(node)}
            >
              <Icon.X />
            </button>
          </>
        ) : sectionEditing ? (
          <>
            <button
              className={iconBtn}
              title="Редактировать"
              onClick={() => startEditItem(node)}
            >
              <Icon.Pencil />
            </button>
            <button
              className={iconBtn}
              title={node.deleted ? "Восстановить" : "В архив"}
              onClick={() => toggleItemArchive(node)}
            >
              <Icon.Archive />
            </button>
          </>
        ) : (
          <div className="h-8" />
        )}
      </div>
    );
  };

  const visibleRows = (rows: Item[]) =>
    rows.filter((r) => (onlyArchive ? !!r.deleted : true));

  // Рендер ячеек строки по конфигу
  function renderRowCells(
    s: Section,
    itOrDraftKey: Item | string,
    data: Partial<Item> | any,
    isDraft: boolean
  ) {
    const cols = getSectionColumns(s);
    const order = cols.order.filter((k) => !cols.hidden.includes(k));
    const row: any = data;

    return order.map((key) => {
      const meta = COL_META[key];
      if (!meta) return null;

      if (isDraft) {
        const rowType = row.rowType || "item";
        if (rowType === "header") {
          if (key === "name") {
            return (
              <td
                key={key}
                className={`p-2 ${meta.w ?? ""} border-l border-border/40`}
              >
                {cellInput(
                  itOrDraftKey as string,
                  "name",
                  "w-full",
                  "text"
                )}
              </td>
            );
          }
          return (
            <td
              key={key}
              className={`p-2 ${meta.w ?? ""} border-l border-border/40`}
            />
          );
        }

        if (key === "total") {
          const d = row as any;
          const total = computeTotal(d);
          return (
            <td
              key={key}
              className={`p-2 ${meta.w ?? ""} border-l border-border/40`}
            >
              {money(total)}
            </td>
          );
        }
        if (key === "pos")
          return (
            <td
              key={key}
              className={`p-2 ${meta.w ?? ""} border-l border-border/40`}
            />
          );

        const fieldMap: Record<
          "name" | "sku" | "vendor" | "unit" | "qty" | "price_work" | "price_mat" | "note",
          keyof EditRow
        > = {
          name: "name",
          sku: "sku",
          vendor: "vendor",
          unit: "unit",
          qty: "qty",
          price_work: "price_work",
          price_mat: "price_mat",
          note: "note",
        };

        if (!(key in fieldMap)) {
          return (
            <td
              key={key}
              className={`p-2 ${meta.w ?? ""} border-l border-border/40`}
            />
          );
        }

        const field = fieldMap[key as keyof typeof fieldMap];

        return (
          <td
            key={key}
            className={`p-2 ${meta.w ?? ""} border-l border-border/40`}
          >
            {cellInput(
              itOrDraftKey as string,
              field,
              meta.w ?? "w-full",
              ["qty", "price_work", "price_mat"].includes(key)
                ? "number"
                : "text"
            )}
          </td>
        );
      } else {
        const it = row as Item;
        const rowType = it.rowType || "item";

        if (rowType === "header") {
          if (key === "name") {
            return (
              <td
                key={key}
                className={`p-2 ${meta.w ?? ""} border-l border-border/40`}
              >
                {it.name ?? ""}
              </td>
            );
          }
          return (
            <td
              key={key}
              className={`p-2 ${meta.w ?? ""} border-l border-border/40`}
            />
          );
        }

        if (key === "pos") {
          return (
            <td
              key={key}
              className={`p-2 ${meta.w ?? ""} border-l border-border/40`}
            >
              {/* нумерация слева */}
            </td>
          );
        }
        if (key === "total") {
          const calc = Number.isFinite(it.total as any)
            ? Number(it.total)
            : computeTotal(it as any);
          return (
            <td
              key={key}
              className={`p-2 ${meta.w ?? ""} border-l border-border/40`}
            >
              {money(calc)}
            </td>
          );
        }
        return (
          <td
            key={key}
            className={`p-2 ${meta.w ?? ""} border-l border-border/40`}
          >
            {(it as any)[key] ?? ""}
          </td>
        );
      }
    });
  }

  function buildCommitItemsPayload(section: Section) {
    const rowsAll = filterBySectionVersion(section, grouped[section._id] || []);
    const payload: any[] = [];

    for (const it of rowsAll) {
      const d = editing[it._id];
      if (!d) continue;
      payload.push({
        _id: it._id,
        pos: it.pos,
        name: String(d.name ?? it.name ?? ""),
        sku: String(d.sku ?? it.sku ?? ""),
        vendor: String(d.vendor ?? it.vendor ?? ""),
        unit: String(d.unit ?? it.unit ?? ""),
        qty:
          (d.rowType || it.rowType || "item") === "header"
            ? undefined
            : Number(d.qty ?? it.qty ?? 0),
        price_work:
          (d.rowType || it.rowType || "item") === "header"
            ? undefined
            : Number(d.price_work ?? it.price_work ?? 0),
        price_mat:
          (d.rowType || it.rowType || "item") === "header"
            ? undefined
            : Number(d.price_mat ?? it.price_mat ?? 0),
        note: String(d.note ?? it.note ?? ""),
        rowType: d.rowType || it.rowType || "item",
      });
    }

    const newKeys = Object.keys(editing).filter((k) =>
      k.startsWith(`new::${section._id}::`)
    );
    for (const key of newKeys) {
      const ed = editing[key];
      if (!ed || !String(ed.name || "").trim()) continue;

      const parts = key.split("::");
      const parentRaw = parts[2];
      const parentId = parentRaw === "root" ? null : parentRaw;

      payload.push({
        parentId,
        name: String(ed.name || ""),
        sku: String(ed.sku || ""),
        vendor: String(ed.vendor || ""),
        unit: String(ed.unit || ""),
        qty:
          (ed.rowType || "item") === "header"
            ? undefined
            : Number(ed.qty || 0),
        price_work:
          (ed.rowType || "item") === "header"
            ? undefined
            : Number(ed.price_work || 0),
        price_mat:
          (ed.rowType || "item") === "header"
            ? undefined
            : Number(ed.price_mat || 0),
        note: String(ed.note || ""),
        rowType: ed.rowType || "item",
      });
    }

    return payload;
  }

  function clearEditingForSection(sectionId: string) {
    setEditing((prev) => {
      const copy = { ...prev };
      for (const k of Object.keys(copy)) {
        if ((grouped[sectionId] || []).some((it) => it._id === k))
          delete (copy as any)[k];
        if (k.startsWith(`new::${sectionId}::`)) delete (copy as any)[k];
      }
      return copy;
    });
  }

  function renderNode(
    s: Section,
    node: TreeNode,
    sectionEditing: boolean,
    siblings: TreeNode[],
    _indexInSiblings: number,
    visibleColsCount: number,
    displayIndexById: Record<string, number | null>
  ): React.ReactNode {
    const ed = editing[node._id];
    const faded = node.deleted && !onlyArchive ? "opacity-50" : "";
    const hasChildren = (node.children || []).length > 0;
    const isHeader = (node.rowType || "item") === "header";
    const isDragOver = dragOverItemId === node._id;
    const canDrag = sectionEditing && !onlyArchive;

    // номер, рассчитанный с учётом заголовков
    const displayIndex = displayIndexById[node._id] ?? null;

    const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>) => {
      if (!canDrag) return;
      e.dataTransfer.effectAllowed = "move";
      setDragItem({
        sectionId: s._id,
        itemId: node._id,
        parentId: (node.parentId ?? null) || null,
      });
    };

    const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>) => {
      if (!dragItem) return;
      if (dragItem.sectionId !== s._id) return;
      const parentNorm = (node.parentId ?? null) || null;
      if (dragItem.parentId !== parentNorm) return;

      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (dragOverItemId !== node._id) {
        setDragOverItemId(node._id);
      }
    };

    const handleDrop = (e: React.DragEvent<HTMLTableRowElement>) => {
      if (!dragItem) return;
      e.preventDefault();
      setDragOverItemId(null);

      const parentNorm = (node.parentId ?? null) || null;
      if (dragItem.sectionId !== s._id || dragItem.parentId !== parentNorm)
        return;

      const siblingsArr = siblings as TreeNode[];
      const draggedNode = siblingsArr.find(
        (x) => x._id === dragItem.itemId
      );
      if (!draggedNode) return;

      const targetIndex0 = siblingsArr.findIndex(
        (x) => x._id === node._id
      );
      if (targetIndex0 === -1) return;

      void reorderWithinParent(s, draggedNode, siblingsArr, targetIndex0);
      setDragItem(null);
    };

    const handleDragEnd = () => {
      setDragItem(null);
      setDragOverItemId(null);
    };

    const handleDragLeave = () => {
      if (dragOverItemId === node._id) setDragOverItemId(null);
    };

    const rowCells = (ed
      ? renderRowCells(s, node._id, ed, true)
      : renderRowCells(s, node._id, node, false)
    ).filter((cell: any) => !(cell?.key && String(cell.key) === "pos"));

    return (
      <React.Fragment key={node._id}>
        <tr
          className={`border-b ${faded} ${
            isDragOver ? "bg-muted/40" : "hover:bg-muted/10"
          } transition-colors`}
          draggable={canDrag}
          onDragStart={canDrag ? handleDragStart : undefined}
          onDragOver={canDrag ? handleDragOver : undefined}
          onDrop={canDrag ? handleDrop : undefined}
          onDragEnd={canDrag ? handleDragEnd : undefined}
          onDragLeave={canDrag ? handleDragLeave : undefined}
        >
          <td className="p-2 w-16 border-r border-border/40">
            <div className="flex items-center gap-1">
              {!isHeader && hasChildren && (
                <span className="text-muted-foreground">
                  <Icon.ChevronRight />
                </span>
              )}
              {!isHeader && displayIndex != null && (
                <span>{displayIndex}</span>
              )}
            </div>
          </td>

          {isHeader ? (
            <>
              <td
                className="p-2 border-l border-border/40 font-semibold text-center bg-muted/40"
                colSpan={visibleColsCount}
              >
                {ed
                  ? cellInput(node._id, "name", "w-full", "text")
                  : node.name || ""}
              </td>
            </>
          ) : (
            rowCells
          )}

          <td className="p-2 border-l border-border/40">
            {actionsForItem(node, sectionEditing)}
          </td>
        </tr>

        {Object.keys(editing)
          .filter((k) => k.startsWith(`new::${s._id}::${node._id}::`))
          .map((key) => {
            const ed2 = editing[key]!;
            const isHeaderDraft = (ed2.rowType || "item") === "header";
            if (isHeaderDraft) {
              return (
                <tr key={key} className="border-b">
                  <td className="p-2 w-16 border-r border-border/40" />
                  <td
                    className="p-2 border-l border-border/40 bg-muted/40 font-semibold text-center"
                    colSpan={visibleColsCount}
                  >
                    {cellInput(key, "name", "w-full", "text")}
                  </td>
                  <td className="p-2 border-l border-border/40">
                    <div className="flex gap-2 justify-end">
                      <button
                        className={iconBtn}
                        title="Создать"
                        onClick={() => commitNewItem(s, key, node._id)}
                      >
                        <Icon.Check />
                      </button>
                      <button
                        className={iconBtn}
                        title="Отмена"
                        onClick={() => cancelNewItem(key)}
                      >
                        <Icon.X />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }

            return (
              <tr key={key} className="border-b">
                <td className="p-2 w-16 border-r border-border/40" />
                {renderRowCells(s, key, ed2, true).filter(
                  (cell: any) =>
                    !(cell?.key && String(cell.key) === "pos")
                )}
                <td className="p-2 border-l border-border/40">
                  <div className="flex gap-2 justify-end">
                    <button
                      className={iconBtn}
                      title="Создать"
                      onClick={() => commitNewItem(s, key, node._id)}
                    >
                      <Icon.Check />
                    </button>
                    <button
                      className={iconBtn}
                      title="Отмена"
                      onClick={() => cancelNewItem(key)}
                    >
                      <Icon.X />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
      </React.Fragment>
    );
  }

  // Рендер одного раздела
  const renderSectionBlock = (s: Section) => {
    const rowsAllAll = grouped[s._id] || [];
    const rowsAll = filterBySectionVersion(s, rowsAllAll);
    const rows = visibleRows(rowsAll);

    const cols = getSectionColumns(s);
    const visibleOrder = cols.order.filter((k) => !cols.hidden.includes(k));

    const draftRootKeys = Object.keys(editing).filter((k) =>
      k.startsWith(`new::${s._id}::root::`)
    );

    const sectionEditing = !!editSections[s._id];

    // Нумерация позиций внутри блока заголовка:
    const displayIndexById: Record<string, number | null> = {};
    let currentIndex = 0;

    for (const r of rows) {
      const isHeader = (r.rowType || "item") === "header";
      if (isHeader) {
        currentIndex = 0;
        displayIndexById[r._id] = null;
      } else {
        currentIndex += 1;
        displayIndexById[r._id] = currentIndex;
      }
    }

    return (
      <div key={s._id} className="rounded-2xl border overflow-visible">
        {/* Шапка раздела */}
        <div className="bg-muted/40 px-3 py-2 flex items-center gap-2">
          {/* заголовок / переименование */}
          <div className="font-medium">
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
                onBlur={() => saveSectionTitle(s)}
                onKeyDown={(e) => e.key === "Enter" && saveSectionTitle(s)}
              />
            ) : (
              <button
                type="button"
                title="Переименовать"
                className="hover:underline"
                onClick={() =>
                  setRenaming((r) => ({
                    ...r,
                    [s._id]: s.title || "",
                  }))
                }
              >
                {s.title || "Раздел"}
              </button>
            )}
          </div>

          {/* Версии раздела */}
          <div className="ml-2">
            <VersionSelect
              av={s.activeVersion || 1}
              versions={
                (s.versions || [])
                  .map((x) => x.v)
                  .filter((v) => Number.isFinite(v))
                  .sort((a, b) => a - b) || [1]
              }
              onPick={(v) => {
                void setSectionActiveVersion(s, v);
              }}
              onDelete={(v) => {
                void deleteSectionVersion(s, v);
              }}
            />
          </div>

          {/* режим редактирования */}
          <div className="ml-2 flex items-center gap-2">
            {!sectionEditing ? (
              <>
                <button
                  type="button"
                  className="rounded-md border px-3 h-8 text-sm"
                  onClick={() => {
                    setEditSections((m) => ({
                      ...m,
                      [s._id]: true,
                    }));
                    setSectionFinishMode((m) => ({
                      ...m,
                      [s._id]: "edit",
                    }));
                  }}
                >
                  Изменить
                </button>
                <button
                  type="button"
                  className="rounded-md border px-3 h-8 text-sm bg-muted/40"
                  onClick={() => {
                    setEditSections((m) => ({
                      ...m,
                      [s._id]: true,
                    }));
                    setSectionFinishMode((m) => ({
                      ...m,
                      [s._id]: "replace",
                    }));
                  }}
                >
                  Заменить
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="rounded-md border px-3 h-8 text-sm bg-muted/40"
                  onClick={async () => {
                    await saveSectionTitle(s);

                    if (sectionFinishMode[s._id] === "replace") {
                      const itemsPayload = buildCommitItemsPayload(s);

                      await API.sections.patch(s._id, {
                        commit: true,
                        items: itemsPayload,
                      });

                      clearEditingForSection(s._id);
                      await loadAll();
                    } else {
                    }

                    setEditSections((m) => ({
                      ...m,
                      [s._id]: false,
                    }));
                    setSectionFinishMode((m) => ({
                      ...m,
                      [s._id]: undefined,
                    }));
                  }}
                >
                  {sectionFinishMode[s._id] === "replace"
                    ? "Сохранить как v+1"
                    : "Сохранить"}
                </button>
                <button
                  type="button"
                  className="rounded-md border px-3 h-8 text-sm"
                  onClick={() => {
                    setEditSections((m) => ({
                      ...m,
                      [s._id]: false,
                    }));
                    setSectionFinishMode((m) => ({
                      ...m,
                      [s._id]: undefined,
                    }));
                    clearEditingForSection(s._id);
                    void loadAll();
                  }}
                >
                  Отмена
                </button>
              </>
            )}
          </div>

          {/* Кнопки справа + шестерёнка */}
          <div className="ml-auto flex items-center gap-2">
            {!onlyArchive ? (
              <>
                {sectionEditing && (
                  <>
                    <button
                      type="button"
                      className="rounded-md border px-2 py-1 inline-flex items-center gap-1"
                      title="Добавить позицию (уровень 1)"
                      onClick={() => startAddItem(s._id, null, "item")}
                    >
                      <Icon.Plus />
                      Позиция
                    </button>
                    <button
                      type="button"
                      className="rounded-md border px-2 py-1 inline-flex items-center gap-1"
                      title="Добавить заголовок"
                      onClick={() => startAddItem(s._id, null, "header")}
                    >
                      <Icon.Plus />
                      Заголовок
                    </button>
                  </>
                )}

                {/* Экспорт / импорт Excel */}
                <button
                  type="button"
                  className="rounded-md border px-2 py-1 inline-flex items-center gap-1"
                  title="Экспортировать раздел в Excel"
                  onClick={() => handleExportSection(s)}
                >
                  Экспорт
                </button>
                <button
                  type="button"
                  className="rounded-md border px-2 py-1 inline-flex items-center gap-1"
                  title="Импортировать раздел из Excel"
                  onClick={() => {
                    setImportingSectionId(s._id);
                    fileInputRef.current?.click();
                  }}
                >
                  Импорт
                </button>

                <button
                  type="button"
                  className={iconBtn}
                  title={s.deleted ? "Восстановить раздел" : "В архив"}
                  onClick={() => toggleSectionArchive(s)}
                >
                  <Icon.Archive />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={iconBtn}
                  title="Восстановить раздел"
                  onClick={() => toggleSectionArchive(s)}
                >
                  <Icon.Unarchive />
                </button>
                <button
                  type="button"
                  className={`${iconBtn} border-red-200 text-red-600 hover:bg-red-50`}
                  title="Удалить раздел навсегда"
                  onClick={() => deleteSectionForever(s)}
                >
                  <Icon.Trash />
                </button>
              </>
            )}

            {/* Шестерёнка */}
            <div className="relative inline-block">
              <button
                type="button"
                className={iconBtn}
                title="Отображаемые столбцы"
                onClick={() => {
                  startEditColumns(s);
                }}
              >
                <Icon.Gear />
              </button>

              {gearOpen === s._id && (
                <div
                  className="absolute right-0 top-[calc(100%+6px)] z-50 w-80 rounded-md border bg-background shadow-lg p-2"
                  data-gear-popover
                >
                  <div className="text-xs font-medium mb-2">
                    Отображаемые столбцы
                  </div>
                  <div className="max-h-64 overflow-auto pr-1 space-y-1">
                    {getSectionColumns(s).order.map((key) => (
                      <div
                        key={key}
                        className="flex items-center justify-between gap-2"
                      >
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={
                              !colDraft[s._id]?.hidden?.includes(key)
                            }
                            onChange={(e) =>
                              changeColumnVisibility(
                                s,
                                key,
                                e.target.checked
                              )
                            }
                          />
                          {COL_META[key]?.label || key}
                        </label>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className="rounded-md border px-2 h-7 text-xs"
                            onClick={() => moveColumn(s, key, -1)}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="rounded-md border px-2 h-7 text-xs"
                            onClick={() => moveColumn(s, key, 1)}
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      className="rounded-md border px-3 h-9 text-sm"
                      onClick={() => {
                        setGearOpen(null);
                        setColDraft((m) => ({
                          ...m,
                          [s._id]: null,
                        }));
                      }}
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      className="rounded-md border px-3 h-9 text-sm bg-muted"
                      onClick={() => {
                        setGearOpen(null);
                      }}
                    >
                      Применить
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Таблица */}
        <div className="relative overflow-x-auto overflow-y-visible max-h-none">
          <table className="w-full text-sm zebra">
            <thead className="sticky top-0 bg-background z-10">
              <tr className="border-b">
                <th className="p-2 text-left w-16 border-r border-border/40">
                  №
                </th>
                {visibleOrder
                  .filter((k) => k !== "pos")
                  .map((k) => (
                    <th
                      key={k}
                      className={`p-2 text-left ${
                        COL_META[k]?.w ?? ""
                      } border-l border-border/40`}
                    >
                      {COL_META[k]?.label || k}
                    </th>
                  ))}
                <th className="p-2 text-right w-40 border-l border-border/40" />
              </tr>
            </thead>
            <tbody>
              {/* черновики на корне */}
              {sectionEditing &&
                draftRootKeys.map((key) => {
                  const ed = editing[key]!;
                  const isHeaderDraft = (ed.rowType || "item") === "header";
                  if (isHeaderDraft) {
                    return (
                      <tr key={key} className="border-b">
                        <td className="p-2 w-16 border-r border-border/40" />
                        <td
                          className="p-2 border-l border-border/40 bg-muted/40 font-semibold text-center"
                          colSpan={visibleOrder.filter(
                            (k) => k !== "pos"
                          ).length}
                        >
                          {cellInput(key, "name", "w-full", "text")}
                        </td>
                        <td className="p-2 border-l border-border/40">
                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              className={iconBtn}
                              title="Создать"
                              onClick={() =>
                                commitNewItem(s, key, null)
                              }
                            >
                              <Icon.Check />
                            </button>
                            <button
                              type="button"
                              className={iconBtn}
                              title="Отмена"
                              onClick={() => cancelNewItem(key)}
                            >
                              <Icon.X />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={key} className="border-b">
                      <td className="p-2 w-16 border-r border-border/40" />
                      {renderRowCells(s, key, ed, true).filter(
                        (cell: any) =>
                          !(cell?.key && String(cell.key) === "pos")
                      )}
                      <td className="p-2 border-l border-border/40">
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            className={iconBtn}
                            title="Создать"
                            onClick={() =>
                              commitNewItem(s, key, null)
                            }
                          >
                            <Icon.Check />
                          </button>
                          <button
                            type="button"
                            className={iconBtn}
                            title="Отмена"
                            onClick={() => cancelNewItem(key)}
                          >
                            <Icon.X />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* дерево */}
              {buildTree(rows).map((node, idx, siblings) =>
                renderNode(
                  s,
                  node as TreeNode,
                  sectionEditing,
                  siblings as TreeNode[],
                  idx,
                  visibleOrder.filter((k) => k !== "pos").length,
                  displayIndexById
                )
              )}

              {!rows.length &&
                (!sectionEditing || draftRootKeys.length === 0) && (
                  <tr>
                    <td
                      colSpan={visibleOrder.length + 2}
                      className="p-3 text-center text-sm text-muted-foreground"
                    >
                      Позиции нет
                    </td>
                  </tr>
                )}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t bg-muted/20">
          <div className="text-xs mb-1 text-muted-foreground">
            Комментарий
          </div>
          <textarea
            className="w-full rounded-md border px-2 py-2 text-sm min-h-[64px]"
            defaultValue={s.comment || ""}
            placeholder="Добавьте комментарий к разделу…"
            onBlur={(e) => saveSectionComment(s, e.target.value)}
          />

          <div className="mt-3">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">Вложения</div>

              <button
                type="button"
                className="rounded-md border px-3 h-9 text-sm"
                onClick={() => {
                  setAttachPickSectionId(s._id);
                  attachInputRef.current?.click();
                }}
              >
                Добавить вложение
              </button>
            </div>

            {uploadingSectionId === s._id && (
              <div className="mt-2 text-xs text-muted-foreground">
                Загрузка…
              </div>
            )}

            {attachmentsLoading[s._id] ? (
              <div className="mt-2 text-sm text-muted-foreground">
                Загрузка списка…
              </div>
            ) : (attachmentsBySection[s._id] || []).length ? (
              <div className="mt-2 space-y-2">
                {(attachmentsBySection[s._id] || []).map((a) => {
                  const delKey = `${s._id}:${a._id}`;
                  const isDeleting = !!attachmentDeleting[delKey];
                  return (
                    <div
                      key={a._id}
                      className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 bg-background"
                    >
                      <button
                        type="button"
                        className="text-left hover:underline truncate"
                        title="Скачать"
                        onClick={() => downloadAttachment(s._id, a)}
                        disabled={isDeleting}
                      >
                        {a.filename}
                      </button>

                      <div className="flex items-center gap-3">
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatBytes(a.size)}
                        </div>

                        <button
                          type="button"
                          className={`${iconBtn} w-8 h-8 ${
                            isDeleting ? "opacity-50 pointer-events-none" : "border-red-200 text-red-600 hover:bg-red-50"
                          }`}
                          title="Удалить вложение"
                          onClick={() => deleteAttachment(s._id, a._id)}
                        >
                          <Icon.Trash />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-2 text-sm text-muted-foreground">
                Файлов нет.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const currentSection =
    selectedSectionId &&
    sections.find((s) => s._id === selectedSectionId);

  return (
    <div className="space-y-4 min-h-[calc(100vh-140px)] overflow-visible">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={handleImportFileChange}
      />
      <input
        ref={attachInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleAttachmentsFileChange}
      />
      {/* toolbar */}
      <div className="flex items-center gap-3">
        {selectedSectionId ? (
          <button
            className="rounded-md border px-3 py-2 inline-flex items-center gap-2"
            onClick={() => setSelectedSectionId(null)}
            type="button"
          >
            ← К списку разделов
          </button>
        ) : (
          <button
            className="rounded-md border px-3 py-2 inline-flex items-center gap-2"
            onClick={addSection}
            type="button"
          >
            <Icon.Plus />
            Раздел
          </button>
        )}

        {/* справа - фильтр Архив как кнопка */}
        <div className="ml-auto">
          <button
            type="button"
            className={`rounded-md border px-3 h-9 text-sm ${
              onlyArchive ? "bg-muted/60" : ""
            }`}
            onClick={() => setOnlyArchive((v) => !v)}
            title="Показать архивные позиции"
          >
            {onlyArchive ? "Архив: включён" : "Архив"}
          </button>
        </div>
      </div>

      {/* либо список разделов, либо один раздел */}
      {selectedSectionId ? (
        currentSection ? (
          renderSectionBlock(currentSection)
        ) : (
          <div className="text-sm text-muted-foreground">
            Раздел не найден.
          </div>
        )
      ) : (
        <>
          {sections.length ? (
            <div className="rounded-2xl border overflow-hidden">
              <div className="grid grid-cols-[minmax(0,2fr)_120px_100px_140px] px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/40">
                <div>Раздел</div>
                <div className="text-center">Статус</div>
                <div className="text-center">Позиции</div>
                <div className="text-right">Действия</div>
              </div>

              {sections.map((s) => {
                const rowsAllAll = grouped[s._id] || [];
                const rowsAll = filterBySectionVersion(s, rowsAllAll);
                const rows = visibleRows(rowsAll);

                const statusLabel = s.deleted ? "В архиве" : "Активен";

                return (
                  <div
                    key={s._id}
                    className="border-t bg-background hover:bg-muted/40 transition cursor-pointer"
                    onClick={() => setSelectedSectionId(s._id)}
                  >
                    <div className="grid grid-cols-[minmax(0,2fr)_120px_100px_140px] px-4 py-3 items-center text-sm">
                      {/* Раздел */}
                      <div className="flex flex-col gap-1">
                        <div className="font-medium">
                          {s.title || "Раздел"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Версия v{sectionVersion(s)}
                        </div>
                        {s.comment && (
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {s.comment}
                          </div>
                        )}
                      </div>

                      {/* Статус */}
                      <div className="text-center text-xs text-muted-foreground">
                        {statusLabel}
                      </div>

                      {/* Позиции */}
                      <div className="text-center text-sm">{rows.length}</div>

                      {/* архив/удаление */}
                      <div className="flex items-center justify-end gap-2">
                        {!onlyArchive ? (
                          <button
                            type="button"
                            className={iconBtn}
                            title={
                              s.deleted ? "Восстановить раздел" : "В архив"
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSectionArchive(s);
                            }}
                          >
                            {s.deleted ? <Icon.Unarchive /> : <Icon.Archive />}
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              className={iconBtn}
                              title="Восстановить раздел"
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
                              title="Удалить раздел навсегда"
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
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Разделов пока нет.
            </div>
          )}
        </>
      )}
    </div>
  );
}