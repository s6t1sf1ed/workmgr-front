import { useEffect, useMemo, useRef, useState } from "react";
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

export type ShipmentSection = {
  _id: string;
  projectId: string;
  title?: string;
  order?: number;
  deleted?: boolean;
  specSectionId?: string | null;
  comment?: string;
};

export type ShipmentItem = {
  _id: string;
  projectId: string;
  shipmentSectionId: string;
  specItemId?: string | null;
  specSectionId?: string | null;
  pos?: string | number;
  name?: string;
  unit?: string;
  qty?: number;
  price?: number;
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

type Attachment = {
  _id: string;
  filename: string;
  size: number;
  contentType?: string;
  uploadedAt?: string | null;
};

/* API */

const API = {
  sections: {
    list: (projectId: string, deleted = 0) =>
      api<{ items: ShipmentSection[] }>(
        `/api/projects/${projectId}/ship/sections?deleted=${deleted}`
      ),
    create: (projectId: string, payload: Partial<ShipmentSection>) =>
      api<ShipmentSection>(`/api/projects/${projectId}/ship/sections`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    patch: (id: string, payload: Partial<ShipmentSection>) =>
      api<ShipmentSection>(`/api/ship/sections/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    deleteForever: (id: string) =>
      api(`/api/ship/sections/${id}`, {
        method: "DELETE",
      }),

    attachmentsList: (sectionId: string) =>
      api<{ items: Attachment[] }>(`/api/ship/sections/${sectionId}/attachments`),

    attachmentsUpload: (sectionId: string, file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return api(`/api/ship/sections/${sectionId}/attachments`, {
        method: "POST",
        body: fd as any,
      });
    },

    attachmentsDelete: (sectionId: string, fileId: string) =>
      api(`/api/ship/sections/${sectionId}/attachments/${fileId}`, { method: "DELETE" }),

    attachmentsDownload: (sectionId: string, fileId: string) =>
      downloadBlob(`/api/ship/sections/${sectionId}/attachments/${fileId}/download`),

    importExcel: (sectionId: string, file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return api(`/api/ship/sections/${sectionId}/import`, {
        method: "POST",
        body: fd as any,
      });
    },

    exportExcel: (sectionId: string) =>
      downloadBlob(`/api/ship/sections/${sectionId}/export`),
  },
  items: {
    list: (projectId: string, deleted = 0) =>
      api<{ items: ShipmentItem[] }>(
        `/api/projects/${projectId}/ship/items?deleted=${deleted}`
      ),
    create: (projectId: string, payload: Partial<ShipmentItem>) =>
      api<ShipmentItem>(`/api/projects/${projectId}/ship/items`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    patch: (id: string, payload: Partial<ShipmentItem>) =>
      api<ShipmentItem>(`/api/ship/items/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    deleteForever: (id: string) =>
      api(`/api/ship/items/${id}`, {
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

/* utils */

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

function formatBytes(n?: number) {
  const x = Number(n || 0);
  if (!x) return "0 B";
  const k = 1024;
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(x) / Math.log(k)));
  const v = x / Math.pow(k, i);
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
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
  price?: number | string;
  specItemId?: string | null;
  specSectionId?: string | null;
};

type SectionDraft = {
  title: string;
};

export default function SpecsShipmentTab({ projectId }: Props) {
  const [sections, setSections] = useState<ShipmentSection[]>([]);
  const [items, setItems] = useState<ShipmentItem[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null); // открытая накладная
  const [onlyArchive, setOnlyArchive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // спецификация (для привязок)
  const [specSections, setSpecSections] = useState<SpecSectionLite[]>([]);
  const [specItems, setSpecItems] = useState<SpecItemLite[]>([]);

  // создание накладной
  const [creatingSection, setCreatingSection] = useState(false);
  const [sectionDraft, setSectionDraft] = useState<SectionDraft>({
    title: "",
  });

  // переименование накладной
  const [renaming, setRenaming] = useState<Record<string, string>>({});

  // редактирование / создание позиций
  const [editing, setEditing] = useState<Record<string, ItemDraft>>({});

  // поповер привязки к позиции спецификации
  const [linkPopover, setLinkPopover] = useState<{
    rowKey: string;
  } | null>(null);
  const [linkSearch, setLinkSearch] = useState("");
  const linkPopoverRef = useRef<HTMLDivElement | null>(null);

  const [attachments, setAttachments] = useState<Record<string, Attachment[]>>({});
  const [attLoading, setAttLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [attUploading, setAttUploading] = useState(false);
  const [attDeleting, setAttDeleting] = useState<Record<string, boolean>>({});
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);

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
      console.error("SpecsShipmentTab loadSpecs error:", e);
    }
  }

  /* загрузка отгрузок */

  async function loadShipments() {
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

      if (selectedSectionId && !secs.some((s) => s._id === selectedSectionId)) {
        setSelectedSectionId(null);
      }
    } catch (e: any) {
      console.error("SpecsShipmentTab loadShipments error:", e);
      const msg =
        e?.message ||
        e?.response?.data?.message ||
        e?.response?.data?.detail ||
        "Не удалось загрузить отгрузку";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function loadAttachments(sectionId: string) {
    setAttLoading(true);
    try {
      const res = await API.sections.attachmentsList(sectionId);
      setAttachments((m) => ({ ...m, [sectionId]: res.items || [] }));
    } catch (e) {
      console.error("loadAttachments error:", e);
    } finally {
      setAttLoading(false);
    }
  }

  const currentSection = useMemo(() => {
    if (!selectedSectionId) return null;
    return sections.find((s) => s._id === selectedSectionId) || null;
  }, [selectedSectionId, sections]);

  useEffect(() => {
    if (!currentSection?._id) return;
    loadAttachments(currentSection._id);
  }, [currentSection?._id]);

  useEffect(() => {
    loadSpecs();
  }, [projectId]);

  useEffect(() => {
    loadShipments();
  }, [projectId, onlyArchive]);

  /*  maps */

  const itemsBySection = useMemo(() => {
    const map: Record<string, ShipmentItem[]> = {};
    for (const it of items) {
      if (!map[it.shipmentSectionId]) map[it.shipmentSectionId] = [];
      map[it.shipmentSectionId].push(it);
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

  const filteredSections = sections.filter((s) => (onlyArchive ? !!s.deleted : !s.deleted));

  /* создание накладной */

  const startCreateSection = () => {
    setCreatingSection(true);
    setSectionDraft({
      title: "",
    });
  };

  const cancelCreateSection = () => {
    setCreatingSection(false);
    setSectionDraft({
      title: "",
    });
  };

  const saveCreateSection = async () => {
    if (!sectionDraft.title.trim()) {
      alert("Укажите название отгрузки (накладной)");
      return;
    }
    try {
      await API.sections.create(projectId, {
        title: sectionDraft.title.trim(),
      });
      cancelCreateSection();
      await loadShipments();
    } catch (e: any) {
      console.error("SpecsShipmentTab saveCreateSection error:", e);
      const msg =
        e?.message ||
        e?.response?.data?.message ||
        e?.response?.data?.detail ||
        "Не удалось создать отгрузку";
      alert(msg);
    }
  };

  /* накладные: переименование / архив / удаление */

  const saveSectionTitle = async (s: ShipmentSection) => {
    const title = (renaming[s._id] ?? s.title ?? "").trim();
    if (title && title !== s.title) {
      await API.sections.patch(s._id, { title });
      await loadShipments();
    }
    setRenaming((r) => {
      const c = { ...r };
      delete c[s._id];
      return c;
    });
  };

  const saveSectionComment = async (s: ShipmentSection, comment: string) => {
    const next = String(comment ?? "");
    const prev = String(s.comment ?? "");
    if (next === prev) return;
    try {
      await API.sections.patch(s._id, { comment: next });
      await loadShipments();
    } catch (e: any) {
      console.error("saveSectionComment error:", e);
      const msg =
        e?.message ||
        e?.response?.data?.message ||
        e?.response?.data?.detail ||
        "Не удалось сохранить комментарий";
      alert(msg);
    }
  };

  const toggleSectionArchive = async (s: ShipmentSection) => {
    try {
      await API.sections.patch(s._id, { deleted: !s.deleted });
      await loadShipments();
    } catch (e: any) {
      console.error("SpecsShipmentTab toggleSectionArchive error:", e);
      const msg =
        e?.message ||
        e?.response?.data?.message ||
        e?.response?.data?.detail ||
        "Не удалось изменить статус отгрузки";
      alert(msg);
    }
  };

  const deleteSectionForever = async (s: ShipmentSection) => {
    if (!confirm(`Удалить отгрузку «${s.title || s._id}» безвозвратно?`)) return;
    try {
      await API.sections.deleteForever(s._id);
      await loadShipments();
    } catch (e: any) {
      console.error("SpecsShipmentTab deleteSectionForever error:", e);
      const msg =
        e?.message ||
        e?.response?.data?.message ||
        e?.response?.data?.detail ||
        "Не удалось удалить отгрузку";
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
        qty: 1,
        price: "",
        specItemId: null,
        specSectionId: null,
      },
    }));
  };

  const startEditItem = (it: ShipmentItem) => {
    setEditing((e) => ({
      ...e,
      [it._id]: {
        pos: it.pos ?? "",
        name: it.name ?? "",
        unit: it.unit ?? "",
        qty: it.qty ?? "",
        price: it.price ?? "",
        specItemId: it.specItemId ?? null,
        specSectionId: it.specSectionId ?? null,
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

  const commitNewItem = async (rowKey: string, section: ShipmentSection) => {
    const draft = editing[rowKey];
    if (!draft || !String(draft.name || "").trim()) {
      alert("Укажите наименование позиции");
      return;
    }
    try {
      await API.items.create(projectId, {
        shipmentSectionId: section._id,
        pos: draft.pos,
        name: String(draft.name || ""),
        unit: String(draft.unit || ""),
        qty: Number(draft.qty || 0),
        price: draft.price !== undefined ? Number(draft.price || 0) : 0,
        specItemId: draft.specItemId || null,
        specSectionId: draft.specSectionId || null,
      });
      cancelEditItem(rowKey);
      await loadShipments();
    } catch (e: any) {
      console.error("SpecsShipmentTab commitNewItem error:", e);
      const msg =
        e?.message ||
        e?.response?.data?.message ||
        e?.response?.data?.detail ||
        "Не удалось создать позицию отгрузки";
      alert(msg);
    }
  };

  const commitEditItem = async (it: ShipmentItem) => {
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
        price: draft.price !== undefined ? Number(draft.price || 0) : 0,
        specItemId: draft.specItemId || null,
        specSectionId: draft.specSectionId || null,
      });
      cancelEditItem(it._id);
      await loadShipments();
    } catch (e: any) {
      console.error("SpecsShipmentTab commitEditItem error:", e);
      const msg =
        e?.message ||
        e?.response?.data?.message ||
        e?.response?.data?.detail ||
        "Не удалось сохранить позицию отгрузки";
      alert(msg);
    }
  };

  const toggleItemArchive = async (it: ShipmentItem) => {
    try {
      await API.items.patch(it._id, { deleted: !it.deleted });
      await loadShipments();
    } catch (e: any) {
      console.error("SpecsShipmentTab toggleItemArchive error:", e);
      const msg =
        e?.message ||
        e?.response?.data?.message ||
        e?.response?.data?.detail ||
        "Не удалось изменить статус позиции";
      alert(msg);
    }
  };

  const deleteItemForever = async (it: ShipmentItem) => {
    if (!confirm("Удалить позицию отгрузки безвозвратно?")) return;
    try {
      await API.items.deleteForever(it._id);
      await loadShipments();
    } catch (e: any) {
      console.error("SpecsShipmentTab deleteItemForever error:", e);
      const msg =
        e?.message ||
        e?.response?.data?.message ||
        e?.response?.data?.detail ||
        "Не удалось удалить позицию отгрузки";
      alert(msg);
    }
  };

  /* привязка к позиции спецификации */

  const openLinkPopover = (rowKey: string) => {
    setLinkPopover({ rowKey });
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

  /* вложения */

  const handleAttachmentsFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!currentSection?._id || files.length === 0) return;

    try {
      setAttUploading(true);
      for (const f of files) {
        await API.sections.attachmentsUpload(currentSection._id, f);
      }
      await loadAttachments(currentSection._id);
    } catch (err: any) {
      console.error("attachments upload error:", err);
      alert(err?.message || err?.response?.data?.detail || "Ошибка загрузки вложения");
    } finally {
      setAttUploading(false);
    }
  };

  const downloadAttachment = async (sectionId: string, a: Attachment) => {
    try {
      const blob = await API.sections.attachmentsDownload(sectionId, a._id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = a.filename || "file";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error("downloadAttachment error:", e);
      alert(e?.message || e?.response?.data?.detail || "Ошибка скачивания");
    }
  };

  const deleteAttachment = async (sectionId: string, a: Attachment) => {
    if (!confirm("Удалить вложение?")) return;
    const key = `${sectionId}:${a._id}`;
    setAttDeleting((m) => ({ ...m, [key]: true }));
    try {
      await API.sections.attachmentsDelete(sectionId, a._id);
      setAttachments((m) => ({
        ...m,
        [sectionId]: (m[sectionId] || []).filter((x) => x._id !== a._id),
      }));
    } catch (e: any) {
      console.error("deleteAttachment error:", e);
      alert(e?.message || e?.response?.data?.detail || "Ошибка удаления вложения");
    } finally {
      setAttDeleting((m) => {
        const c = { ...m };
        delete c[key];
        return c;
      });
    }
  };

  const handleImportFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!currentSection?._id || !files.length) return;

    const file = files[0];
    try {
      setImporting(true);
      const res: any = await API.sections.importExcel(currentSection._id, file);
      const n =
        res?.itemsImported ??
        res?.created ??
        res?.count ??
        0;
      if (n) {
        alert(`Импортировано позиций: ${n}`);
      }
      await loadShipments();
    } catch (err: any) {
      console.error("shipments import error:", err);
      alert(
        err?.message ||
          err?.response?.data?.detail ||
          "Ошибка импорта из Excel"
      );
    } finally {
      setImporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (!currentSection?._id) return;
    try {
      setExporting(true);
      const blob = await API.sections.exportExcel(currentSection._id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeTitle = (currentSection.title || "Отгрузка").replace(/[\\/:*?"<>|]/g, "_");
      link.href = url;
      link.download = `${safeTitle}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("shipments export error:", err);
      alert(
        err?.message ||
          err?.response?.data?.detail ||
          "Ошибка экспорта в Excel"
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4 min-h-[calc(100vh-140px)] overflow-visible">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleAttachmentsFileChange}
      />
      <input
        ref={importInputRef}
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={handleImportFileChange}
      />

      {/* toolbar */}
      <div className="flex items-center gap-3">
        {selectedSectionId ? (
          <>
            <button
              type="button"
              className="rounded-md border px-3 py-2 inline-flex items-center gap-2"
              onClick={() => setSelectedSectionId(null)}
            >
              ← К накладным
            </button>
            {currentSection && (
              <div className="text-sm text-muted-foreground">
                Открыта накладная «{currentSection.title || "Без названия"}»
              </div>
            )}
          </>
        ) : (
          <button
            type="button"
            className="rounded-md border px-3 py-2 inline-flex items-center gap-2"
            onClick={startCreateSection}
          >
            <Icon.Plus />
            Отгрузка
          </button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className={`rounded-md border px-3 h-9 text-sm ${onlyArchive ? "bg-muted/60" : ""}`}
            onClick={() => setOnlyArchive((v) => !v)}
          >
            {onlyArchive ? "Архив: включён" : "Архив"}
          </button>
        </div>
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      {/* СПИСОК НАКЛАДНЫХ */}
      {!selectedSectionId && (
        <>
          {/* форма создания накладной */}
          {creatingSection && (
            <div className="rounded-2xl border overflow-hidden">
              <div className="bg-muted/40 px-3 py-2 text-sm font-medium">Новая отгрузка</div>
              <div className="p-3 space-y-3">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Наименование накладной</div>
                  <input
                    className="w-full rounded-md border px-2 py-1 text-sm"
                    value={sectionDraft.title}
                    onChange={(e) => setSectionDraft((d) => ({ ...d, title: e.target.value }))}
                    placeholder="Например, Накладная №1"
                  />
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

          {/* таблица накладных */}
          <div className="rounded-2xl border overflow-auto">
            <table className="w-full text-sm zebra">
              <thead className="bg-muted/40 sticky top-0">
                <tr className="border-b">
                  <th className="p-2 text-left">Накладная</th>
                  <th className="p-2 text-left w-32">Статус</th>
                  <th className="p-2 text-right w-32">Позиций</th>
                  <th className="p-2 text-right w-40" />
                </tr>
              </thead>
              <tbody>
                {filteredSections.map((s) => {
                  const secItemsAll = itemsBySection[s._id] || [];
                  const itemsCount = secItemsAll.filter((it) => !it.deleted).length;
                  return (
                    <tr key={s._id} className={`border-b ${s.deleted && !onlyArchive ? "opacity-50" : ""}`}>
                      <td className="p-2">
                        <button
                          type="button"
                          className="text-left font-medium hover:underline"
                          onClick={() => setSelectedSectionId(s._id)}
                        >
                          {s.title || "Отгрузка"}
                        </button>
                      </td>
                      <td className="p-2 text-xs">{s.deleted ? "В архиве" : "Активна"}</td>
                      <td className="p-2 text-right">{itemsCount}</td>
                      <td className="p-2">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            className="rounded-md border px-2 h-8 text-xs"
                            onClick={() => setSelectedSectionId(s._id)}
                          >
                            Открыть
                          </button>
                          {!onlyArchive ? (
                            <button
                              type="button"
                              className={iconBtn}
                              title={s.deleted ? "Восстановить отгрузку" : "В архив"}
                              onClick={() => toggleSectionArchive(s)}
                            >
                              {s.deleted ? <Icon.Unarchive /> : <Icon.Archive />}
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                className={iconBtn}
                                title="Восстановить отгрузку"
                                onClick={() => toggleSectionArchive(s)}
                              >
                                <Icon.Unarchive />
                              </button>
                              <button
                                type="button"
                                className={`${iconBtn} border-red-200 text-red-600 hover:bg-red-50`}
                                title="Удалить отгрузку навсегда"
                                onClick={() => deleteSectionForever(s)}
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
                    <td className="p-3 text-center text-sm text-muted-foreground" colSpan={4}>
                      Отгрузок пока нет.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {loading && !filteredSections.length && (
            <div className="text-sm text-muted-foreground">Загрузка…</div>
          )}
        </>
      )}

      {/* ОТКРЫТАЯ НАКЛАДНАЯ */}
      {selectedSectionId && currentSection && (
        <div className="rounded-2xl border overflow-visible">
          {/* header */}
          <div className="bg-muted/40 px-3 py-2 flex items-center gap-2">
            <div className="flex flex-col">
              {/* название / переименование */}
              {renaming[currentSection._id] !== undefined ? (
                <input
                  autoFocus
                  className="rounded-md border px-2 py-1 text-sm"
                  value={renaming[currentSection._id]}
                  onChange={(e) =>
                    setRenaming((r) => ({
                      ...r,
                      [currentSection._id]: e.target.value,
                    }))
                  }
                  onBlur={() => saveSectionTitle(currentSection)}
                  onKeyDown={(e) => e.key === "Enter" && void saveSectionTitle(currentSection)}
                />
              ) : (
                <button
                  type="button"
                  className="text-sm font-medium text-left hover:underline"
                  title="Переименовать накладную"
                  onClick={() =>
                    setRenaming((r) => ({
                      ...r,
                      [currentSection._id]: currentSection.title || "",
                    }))
                  }
                >
                  {currentSection.title || "Отгрузка"}
                </button>
              )}

              {/* подсказка */}
              <div className="text-xs text-muted-foreground mt-0.5">
                Позиции отгрузки с привязкой к спецификации
              </div>
            </div>

            {/* actions справа */}
            <div className="ml-auto flex items-center gap-2">
              {/* импорт / экспорт Excel */}
              <button
                type="button"
                className="rounded-md border px-3 h-8 text-sm inline-flex items-center gap-1"
                onClick={handleExportExcel}
                disabled={exporting}
              >
                {exporting ? "Экспорт…" : "Экспорт"}
              </button>
              <button
                type="button"
                className="rounded-md border px-3 h-8 text-sm inline-flex items-center gap-1"
                onClick={() => importInputRef.current?.click()}
                disabled={onlyArchive || importing}
              >
                {importing ? "Импорт…" : "Импорт"}
              </button>
              

              {!onlyArchive && (
                <button
                  type="button"
                  className="rounded-md border px-3 h-8 text-sm inline-flex items-center gap-1"
                  onClick={() => startAddItem(currentSection._id)}
                >
                  <Icon.Plus />
                  Позиция
                </button>
              )}

              {!onlyArchive ? (
                <button
                  type="button"
                  className={iconBtn}
                  title={currentSection.deleted ? "Восстановить отгрузку" : "В архив"}
                  onClick={() => toggleSectionArchive(currentSection)}
                >
                  {currentSection.deleted ? <Icon.Unarchive /> : <Icon.Archive />}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className={iconBtn}
                    title="Восстановить отгрузку"
                    onClick={() => toggleSectionArchive(currentSection)}
                  >
                    <Icon.Unarchive />
                  </button>
                  <button
                    type="button"
                    className={`${iconBtn} border-red-200 text-red-600 hover:bg-red-50`}
                    title="Удалить отгрузку навсегда"
                    onClick={() => deleteSectionForever(currentSection)}
                  >
                    <Icon.Trash />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* таблица позиций */}
          <div className="relative overflow-x-auto overflow-y-visible max-h-none">
            {(() => {
              const s = currentSection;
              const secItemsAll = itemsBySection[s._id] || [];
              const secItems = secItemsAll.filter((it) => (onlyArchive ? !!it.deleted : !it.deleted));

              return (
                <table className="w-full text-sm zebra">
                  <thead className="sticky top-0 bg-background z-10">
                    <tr className="border-b border-border divide-x divide-border">
                      <th className="p-2 text-left w-16">№</th>
                      <th className="p-2 text-left">Наименование</th>
                      <th className="p-2 text-left w-48">Раздел</th>
                      <th className="p-2 text-right w-32">Количество</th>
                      <th className="p-2 text-right w-32">Цена</th>
                      <th className="p-2 text-right w-40" />
                    </tr>
                  </thead>
                  <tbody>
                    {/* новые строки */}
                    {Object.keys(editing)
                      .filter((k) => k.startsWith(`new::${s._id}::`))
                      .map((rowKey) => {
                        const d = editing[rowKey] || {};
                        const linked = d.specItemId && specItemById[d.specItemId];
                        const sectionSpecItems = d.specSectionId
                          ? specItemsBySection[d.specSectionId] || []
                          : [];

                        return (
                          <tr key={rowKey} className="border-b border-border divide-x divide-border">
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
                                  onClick={() => openLinkPopover(rowKey)}
                                  disabled={!sectionSpecItems.length}
                                >
                                  <Icon.Link />
                                  {linked ? "Изменить привязку" : "Привязать к позиции спецификации"}
                                </button>

                                {/* поповер выбора позиции спецификации */}
                                {linkPopover && linkPopover.rowKey === rowKey && (
                                  <div
                                    ref={linkPopoverRef}
                                    className="mt-1 rounded-md border bg-background shadow-lg p-2 text-xs max-h-64 overflow-auto"
                                  >
                                    {!d.specSectionId ? (
                                      <div className="text-muted-foreground">
                                        Для позиции не выбран раздел спецификации.
                                      </div>
                                    ) : !sectionSpecItems.length ? (
                                      <div className="text-muted-foreground">
                                        В выбранном разделе спецификации нет позиций.
                                      </div>
                                    ) : (
                                      <>
                                        <div className="flex items-center gap-2 mb-2">
                                          <input
                                            className="flex-1 rounded-md border px-2 py-1 text-xs"
                                            placeholder="Поиск по имени"
                                            value={linkSearch}
                                            onChange={(e) => setLinkSearch(e.target.value)}
                                          />
                                          <button
                                            type="button"
                                            className="rounded-md border px-2 h-7 text-xs"
                                            onClick={() => setRowSpecItem(rowKey, null)}
                                          >
                                            Сбросить
                                          </button>
                                        </div>
                                        {sectionSpecItems
                                          .filter((it) =>
                                            linkSearch
                                              ? (it.name || "")
                                                  .toLowerCase()
                                                  .includes(linkSearch.toLowerCase())
                                              : true
                                          )
                                          .map((it) => (
                                            <button
                                              key={it._id}
                                              type="button"
                                              className={`w-full text-left px-2 py-1 rounded-md hover:bg-muted ${
                                                d.specItemId === it._id ? "bg-muted" : ""
                                              }`}
                                              onClick={() => {
                                                setRowSpecItem(rowKey, it._id);
                                                setLinkPopover(null);
                                                setLinkSearch("");
                                              }}
                                            >
                                              <div className="font-medium">
                                                {it.posStr && <span className="mr-1">{it.posStr}</span>}
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
                            <td className="p-2 w-48">
                              <select
                                className="w-full rounded-md border px-2 py-1 text-sm bg-background"
                                value={d.specSectionId || ""}
                                onChange={(e) =>
                                  setEditing((st) => ({
                                    ...st,
                                    [rowKey]: {
                                      ...(st[rowKey] || {}),
                                      specSectionId: e.target.value || null,
                                      // смена раздела - сбрасываем привязку
                                      specItemId: null,
                                    },
                                  }))
                                }
                              >
                                <option value="">— не выбран —</option>
                                {specSections.map((ss) => (
                                  <option key={ss._id} value={ss._id}>
                                    {ss.title || "Без названия"} · v{sectionVersionLite(ss)}
                                  </option>
                                ))}
                              </select>
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
                            <td className="p-2 w-32 text-right">
                              <input
                                type="number"
                                className="w-full rounded-md border px-2 py-1 text-sm text-right"
                                value={d.price ?? ""}
                                onChange={(e) =>
                                  setEditing((st) => ({
                                    ...st,
                                    [rowKey]: {
                                      ...(st[rowKey] || {}),
                                      price: e.target.value,
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
                                  onClick={() => commitNewItem(rowKey, s)}
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
                    {secItems.map((it, idx) => {
                      const draft = editing[it._id];
                      const currentSectionIdForItem = draft?.specSectionId ?? it.specSectionId ?? null;
                      const sectionSpecItems = currentSectionIdForItem
                        ? specItemsBySection[currentSectionIdForItem] || []
                        : [];
                      const linked =
                        (draft?.specItemId ?? it.specItemId) &&
                        specItemById[(draft?.specItemId ?? it.specItemId) as string];
                      const itemSpecSection =
                        currentSectionIdForItem && specSectionById[currentSectionIdForItem];
                      const faded = it.deleted && !onlyArchive ? "opacity-50" : "";

                      // режим редактирования
                      if (draft) {
                        return (
                          <tr key={it._id} className={`border-b border-border divide-x divide-border ${faded}`}>
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
                                  onClick={() => openLinkPopover(it._id)}
                                  disabled={!sectionSpecItems.length}
                                >
                                  <Icon.Link />
                                  {linked ? "Изменить привязку" : "Привязать к позиции спецификации"}
                                </button>

                                {linkPopover && linkPopover.rowKey === it._id && (
                                  <div
                                    ref={linkPopoverRef}
                                    className="mt-1 rounded-md border bg-background shadow-lg p-2 text-xs max-h-64 overflow-auto"
                                  >
                                    {!currentSectionIdForItem ? (
                                      <div className="text-muted-foreground">
                                        Для позиции не выбран раздел спецификации.
                                      </div>
                                    ) : !sectionSpecItems.length ? (
                                      <div className="text-muted-foreground">
                                        В выбранном разделе спецификации нет позиций.
                                      </div>
                                    ) : (
                                      <>
                                        <div className="flex items-center gap-2 mb-2">
                                          <input
                                            className="flex-1 rounded-md border px-2 py-1 text-xs"
                                            placeholder="Поиск по имени"
                                            value={linkSearch}
                                            onChange={(e) => setLinkSearch(e.target.value)}
                                          />
                                          <button
                                            type="button"
                                            className="rounded-md border px-2 h-7 text-xs"
                                            onClick={() => setRowSpecItem(it._id, null)}
                                          >
                                            Сбросить
                                          </button>
                                        </div>
                                        {sectionSpecItems
                                          .filter((si) =>
                                            linkSearch
                                              ? (si.name || "")
                                                  .toLowerCase()
                                                  .includes(linkSearch.toLowerCase())
                                              : true
                                          )
                                          .map((si) => (
                                            <button
                                              key={si._id}
                                              type="button"
                                              className={`w-full text-left px-2 py-1 rounded-md hover:bg-muted ${
                                                draft.specItemId === si._id ? "bg-muted" : ""
                                              }`}
                                              onClick={() => {
                                                setRowSpecItem(it._id, si._id);
                                                setLinkPopover(null);
                                                setLinkSearch("");
                                              }}
                                            >
                                              <div className="font-medium">
                                                {si.posStr && <span className="mr-1">{si.posStr}</span>}
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
                            <td className="p-2 w-48">
                              <select
                                className="w-full rounded-md border px-2 py-1 text-sm bg-background"
                                value={draft.specSectionId || ""}
                                onChange={(e) =>
                                  setEditing((st) => ({
                                    ...st,
                                    [it._id]: {
                                      ...(st[it._id] || {}),
                                      specSectionId: e.target.value || null,
                                      specItemId: null,
                                    },
                                  }))
                                }
                              >
                                <option value="">— не выбран —</option>
                                {specSections.map((ss) => (
                                  <option key={ss._id} value={ss._id}>
                                    {ss.title || "Без названия"} · v{sectionVersionLite(ss)}
                                  </option>
                                ))}
                              </select>
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
                            <td className="p-2 w-32 text-right">
                              <input
                                type="number"
                                className="w-full rounded-md border px-2 py-1 text-sm text-right"
                                value={draft.price ?? ""}
                                onChange={(e) =>
                                  setEditing((st) => ({
                                    ...st,
                                    [it._id]: {
                                      ...(st[it._id] || {}),
                                      price: e.target.value,
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
                        <tr key={it._id} className={`border-b border-border divide-x divide-border ${faded}`}>
                          <td className="p-2 w-16">{it.pos ?? idx + 1}</td>
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
                          <td className="p-2 w-48">
                            {itemSpecSection ? (
                              <>
                                {itemSpecSection.title || "Без названия"} · v{sectionVersionLite(itemSpecSection)}
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground">Не выбран</span>
                            )}
                          </td>
                          <td className="p-2 w-32 text-right">{it.qty ?? ""}</td>
                          <td className="p-2 w-32 text-right">{it.price ?? ""}</td>
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
                                    {it.deleted ? <Icon.Unarchive /> : <Icon.Archive />}
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
                      !Object.keys(editing).some((k) => k.startsWith(`new::${s._id}::`)) && (
                        <tr>
                          <td className="p-3 text-center text-sm text-muted-foreground" colSpan={6}>
                            Позиции отгрузки отсутствуют.
                          </td>
                        </tr>
                      )}
                  </tbody>
                </table>
              );
            })()}
          </div>

          {/* комментарий + вложения под таблицей */}
          <div className="p-3 border-t bg-muted/20">
            <div className="text-xs text-muted-foreground mb-1">Комментарий</div>
            <textarea
              key={`${currentSection._id}:${currentSection.comment || ""}`}
              className="w-full rounded-md border px-2 py-2 text-sm min-h-[70px] bg-background"
              placeholder="Комментарий к накладной…"
              defaultValue={currentSection.comment || ""}
              onBlur={(e) => saveSectionComment(currentSection, e.target.value)}
            />

            <div className="mt-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">Вложения</div>
                <button
                  type="button"
                  className="rounded-md border px-3 h-9 text-sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={attUploading}
                >
                  {attUploading ? "Загрузка…" : "Добавить вложение"}
                </button>
              </div>

              {attLoading ? (
                <div className="mt-2 text-sm text-muted-foreground">Загрузка списка…</div>
              ) : (attachments[currentSection._id] || []).length ? (
                <div className="mt-2 space-y-2">
                  {(attachments[currentSection._id] || []).map((a) => {
                    const delKey = `${currentSection._id}:${a._id}`;
                    const isDeleting = !!attDeleting[delKey];
                    return (
                      <div
                        key={a._id}
                        className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 bg-background"
                      >
                        <button
                          type="button"
                          className="text-left hover:underline truncate"
                          title="Скачать"
                          onClick={() => downloadAttachment(currentSection._id, a)}
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
                              isDeleting
                                ? "opacity-50 pointer-events-none"
                                : "border-red-200 text-red-600 hover:bg-red-50"
                            }`}
                            title="Удалить вложение"
                            onClick={() => deleteAttachment(currentSection._id, a)}
                          >
                            <Icon.Trash />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-2 text-sm text-muted-foreground">Файлов нет.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedSectionId && !currentSection && !loading && (
        <div className="text-sm text-muted-foreground">Отгрузка не найдена.</div>
      )}
    </div>
  );
}