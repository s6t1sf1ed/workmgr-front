import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";

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
};

const iconBtn =
  "inline-flex items-center justify-center rounded-md border w-8 h-8 hover:bg-muted transition";

type VorSection = {
  _id: string;
  projectId: string;
  title?: string;
  number?: string;
  date?: string;
  specSectionId?: string | null;
  order?: number;
  deleted?: boolean;
  isActual?: boolean;
  actualityKey?: string;
};

type VorWork = {
  _id: string;
  projectId: string;
  vorSectionId: string;
  name?: string;
  order?: number;
  isCollapsed?: boolean;
  deleted?: boolean;
};

type VorItem = {
  _id: string;
  projectId: string;
  vorSectionId: string;
  workId: string;
  specItemId?: string | null;
  posStr?: string;
  name?: string;
  unit?: string;
  qty?: number;
  order?: number;
  deleted?: boolean;
};

type SpecSectionLite = {
  _id: string;
  title?: string;
  activeVersion?: number;
  version?: number;
  isActual?: boolean;
};

type SourceItem = {
  specItemId: string;
  posStr?: string;
  name?: string;
  unit?: string;
  qty?: number;
  qtyUsed?: number;
  qtyRemaining?: number;
};

type ProjectLite = {
  _id: string;
  name?: string;
};

const API = {
  project: {
    get: (projectId: string) => api<ProjectLite>(`/api/project/${projectId}`),
  },
  specs: {
    sections: (projectId: string) =>
      api<{ items: SpecSectionLite[] }>(
        `/api/projects/${projectId}/spec/sections?deleted=0`
      ),
  },
  sections: {
    list: (projectId: string, deleted = 0) =>
      api<{ items: VorSection[] }>(
        `/api/projects/${projectId}/vor/sections?deleted=${deleted}`
      ),
    create: (projectId: string, payload: Partial<VorSection>) =>
      api<VorSection>(`/api/projects/${projectId}/vor/sections`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    patch: (id: string, payload: Partial<VorSection>) =>
      api<VorSection>(`/api/vor/sections/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    deleteForever: (id: string) =>
      api(`/api/vor/sections/${id}`, {
        method: "DELETE",
      }),
  },
  works: {
    list: (projectId: string, vorSectionId: string, deleted = 0) =>
      api<{ items: VorWork[] }>(
        `/api/projects/${projectId}/vor/works?vorSectionId=${encodeURIComponent(
          vorSectionId
        )}&deleted=${deleted}`
      ),
    create: (projectId: string, payload: Partial<VorWork>) =>
      api<VorWork>(`/api/projects/${projectId}/vor/works`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    patch: (id: string, payload: Partial<VorWork>) =>
      api<VorWork>(`/api/vor/works/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    deleteForever: (id: string) =>
      api(`/api/vor/works/${id}`, {
        method: "DELETE",
      }),
  },
  items: {
    list: (projectId: string, vorSectionId: string, deleted = 0) =>
      api<{ items: VorItem[] }>(
        `/api/projects/${projectId}/vor/items?vorSectionId=${encodeURIComponent(
          vorSectionId
        )}&deleted=${deleted}`
      ),
    source: (projectId: string, vorSectionId: string) =>
      api<{ items: SourceItem[] }>(
        `/api/projects/${projectId}/vor/source-items?vorSectionId=${encodeURIComponent(
          vorSectionId
        )}`
      ),
    create: (projectId: string, payload: Partial<VorItem> & { qty: number }) =>
      api<VorItem>(`/api/projects/${projectId}/vor/items`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    patch: (id: string, payload: Partial<VorItem>) =>
      api<VorItem>(`/api/vor/items/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    deleteForever: (id: string) =>
      api(`/api/vor/items/${id}`, {
        method: "DELETE",
      }),
  },
};

function comparePosStr(a?: string, b?: string) {
  const as = String(a || "")
    .split(".")
    .map((x) => parseInt(x, 10) || 0);
  const bs = String(b || "")
    .split(".")
    .map((x) => parseInt(x, 10) || 0);
  const len = Math.max(as.length, bs.length);
  for (let i = 0; i < len; i++) {
    const av = as[i] ?? 0;
    const bv = bs[i] ?? 0;
    if (av !== bv) return av - bv;
  }
  return 0;
}

function formatQty(v?: number) {
  const n = Number(v || 0);
  if (Number.isInteger(n)) return String(n);
  return n.toLocaleString("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

type Props = {
  projectId: string;
};

type SectionDraft = {
  number: string;
  date: string;
  specSectionId: string;
  title: string;
  isActual: boolean;
};

type WorkDraft = {
  name: string;
};

type TransferState = {
  item: SourceItem;
  qty: string;
};

export default function SpecsVorTab({ projectId }: Props) {
  const [projectName, setProjectName] = useState("");
  const [specSections, setSpecSections] = useState<SpecSectionLite[]>([]);
  const [sections, setSections] = useState<VorSection[]>([]);
  const [works, setWorks] = useState<VorWork[]>([]);
  const [items, setItems] = useState<VorItem[]>([]);
  const [sourceItems, setSourceItems] = useState<SourceItem[]>([]);

  const [onlyArchive, setOnlyArchive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [activeWorkId, setActiveWorkId] = useState<string | null>(null);

  const [creatingSection, setCreatingSection] = useState(false);
  const [createDraft, setCreateDraft] = useState<SectionDraft>({
    number: "",
    date: todayIso(),
    specSectionId: "",
    title: "",
    isActual: true,
  });

  const [sectionForm, setSectionForm] = useState<SectionDraft>({
    number: "",
    date: todayIso(),
    specSectionId: "",
    title: "",
    isActual: true,
  });

  const [newWork, setNewWork] = useState<WorkDraft>({ name: "" });
  const [workEditing, setWorkEditing] = useState<Record<string, string>>({});
  const [transfer, setTransfer] = useState<TransferState | null>(null);
  const [savingSection, setSavingSection] = useState(false);
  const [submittingTransfer, setSubmittingTransfer] = useState(false);

  const specsById = useMemo(
    () => Object.fromEntries(specSections.map((x) => [x._id, x])),
    [specSections]
  );

  const activeSection = useMemo(
    () => sections.find((x) => x._id === selectedSectionId) || null,
    [sections, selectedSectionId]
  );

  const worksForActive = useMemo(() => {
    const rows = works.filter((x) => x.vorSectionId === selectedSectionId);
    return rows.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [works, selectedSectionId]);

  const itemsByWork = useMemo(() => {
    const by: Record<string, VorItem[]> = {};
    for (const row of items) {
      if (!row.workId) continue;
      if (!by[row.workId]) by[row.workId] = [];
      by[row.workId].push(row);
    }
    for (const key of Object.keys(by)) {
      by[key].sort((a, b) => {
        const orderDiff = (a.order ?? 0) - (b.order ?? 0);
        if (orderDiff !== 0) return orderDiff;
        return comparePosStr(a.posStr, b.posStr);
      });
    }
    return by;
  }, [items]);

  const sortedSourceItems = useMemo(
    () => [...sourceItems].sort((a, b) => comparePosStr(a.posStr, b.posStr)),
    [sourceItems]
  );

  useEffect(() => {
    void loadBase();
  }, [projectId]);

  useEffect(() => {
    void loadSections();
  }, [projectId, onlyArchive]);

  useEffect(() => {
    if (!activeSection) {
      setSectionForm({
        number: "",
        date: todayIso(),
        specSectionId: "",
        title: "",
        isActual: true,
      });
      return;
    }
    setSectionForm({
      number: activeSection.number || activeSection.title || "",
      date: activeSection.date || todayIso(),
      specSectionId: activeSection.specSectionId || "",
      title: activeSection.title || activeSection.number || "",
      isActual: activeSection.isActual !== false,
    });
  }, [activeSection]);

  useEffect(() => {
    if (!selectedSectionId) {
      setWorks([]);
      setItems([]);
      setSourceItems([]);
      setActiveWorkId(null);
      return;
    }
    void loadSectionDetails(selectedSectionId);
  }, [projectId, selectedSectionId, onlyArchive]);

  useEffect(() => {
    if (activeWorkId && !worksForActive.some((x) => x._id === activeWorkId)) {
      setActiveWorkId(worksForActive[0]?._id || null);
    }
    if (!activeWorkId && worksForActive.length) {
      setActiveWorkId(worksForActive[0]._id);
    }
  }, [worksForActive, activeWorkId]);

  async function loadBase() {
    try {
      const [project, specs] = await Promise.all([
        API.project.get(projectId),
        API.specs.sections(projectId),
      ]);
      setProjectName(project?.name || "Проект");
      const specRows = specs.items || [];
      setSpecSections(specRows);
      if (specRows.length && !createDraft.specSectionId) {
        const preferredSpec = specRows.find((row) => row.isActual !== false) || specRows[0];
        setCreateDraft((prev) => ({
          ...prev,
          specSectionId: prev.specSectionId || preferredSpec._id,
        }));
      }
    } catch (e: any) {
      console.error("SpecsVorTab loadBase error:", e);
    }
  }

  async function loadSections() {
    setLoading(true);
    setError(null);
    try {
      const res = await API.sections.list(projectId, onlyArchive ? 1 : 0);
      const rows = res.items || [];
      setSections(rows);
      if (selectedSectionId && !rows.some((x) => x._id === selectedSectionId)) {
        setSelectedSectionId(null);
      }
    } catch (e: any) {
      setError(e?.message || "Не удалось загрузить ВОР");
    } finally {
      setLoading(false);
    }
  }

  async function loadSectionDetails(vorSectionId: string) {
    try {
      const [worksRes, itemsRes] = await Promise.all([
        API.works.list(projectId, vorSectionId, onlyArchive ? 1 : 0),
        API.items.list(projectId, vorSectionId, onlyArchive ? 1 : 0),
      ]);
      setWorks(worksRes.items || []);
      setItems(itemsRes.items || []);

      if (!onlyArchive) {
        const srcRes = await API.items.source(projectId, vorSectionId);
        setSourceItems(srcRes.items || []);
      } else {
        setSourceItems([]);
      }
    } catch (e: any) {
      alert(e?.message || "Не удалось загрузить ВОР");
    }
  }

  async function reloadActiveSection() {
    await loadSections();
    if (selectedSectionId) {
      await loadSectionDetails(selectedSectionId);
    }
  }

  async function createSection() {
    if (!createDraft.number.trim()) {
      alert("Укажите номер ВОР");
      return;
    }
    try {
      const created = await API.sections.create(projectId, {
        number: createDraft.number.trim(),
        title: createDraft.title.trim() || createDraft.number.trim(),
        date: createDraft.date || todayIso(),
        specSectionId: createDraft.specSectionId || null,
        isActual: createDraft.isActual,
      });
      setCreatingSection(false);
      setCreateDraft({
        number: "",
        date: todayIso(),
        specSectionId: createDraft.specSectionId,
        title: "",
        isActual: true,
      });
      await loadSections();
      setSelectedSectionId(created._id);
    } catch (e: any) {
      alert(e?.message || "Не удалось создать ВОР");
    }
  }

  async function saveSection() {
    if (!activeSection) return;
    if (!sectionForm.number.trim()) {
      alert("Укажите номер ВОР");
      return;
    }
    try {
      setSavingSection(true);
      await API.sections.patch(activeSection._id, {
        number: sectionForm.number.trim(),
        title: sectionForm.title.trim() || sectionForm.number.trim(),
        date: sectionForm.date || todayIso(),
        specSectionId: sectionForm.specSectionId || null,
        isActual: sectionForm.isActual,
      });
      await reloadActiveSection();
    } catch (e: any) {
      alert(e?.message || "Не удалось сохранить ВОР");
    } finally {
      setSavingSection(false);
    }
  }

  async function toggleSectionArchive(section: VorSection) {
    try {
      await API.sections.patch(section._id, { deleted: !section.deleted });
      await reloadActiveSection();
    } catch (e: any) {
      alert(e?.message || "Не удалось изменить статус ВОР");
    }
  }

  async function toggleSectionActuality(section: VorSection) {
    try {
      await API.sections.patch(section._id, { isActual: !(section.isActual !== false) });
      await reloadActiveSection();
    } catch (e: any) {
      alert(e?.message || "Не удалось изменить актуальность ВОР");
    }
  }

  async function deleteSectionForever(section: VorSection) {
    if (!confirm("Удалить ВОР безвозвратно?")) return;
    try {
      await API.sections.deleteForever(section._id);
      if (selectedSectionId === section._id) {
        setSelectedSectionId(null);
      }
      await loadSections();
    } catch (e: any) {
      alert(e?.message || "Не удалось удалить ВОР");
    }
  }

  async function addWork() {
    if (!selectedSectionId) return;
    const name = newWork.name.trim();
    if (!name) return;
    try {
      await API.works.create(projectId, {
        vorSectionId: selectedSectionId,
        name,
      });
      setNewWork({ name: "" });
      await loadSectionDetails(selectedSectionId);
    } catch (e: any) {
      alert(e?.message || "Не удалось создать работу");
    }
  }

  async function saveWorkName(work: VorWork) {
    const name = (workEditing[work._id] ?? work.name ?? "").trim();
    if (!name) return;
    try {
      await API.works.patch(work._id, { name });
      setWorkEditing((prev) => {
        const copy = { ...prev };
        delete copy[work._id];
        return copy;
      });
      if (selectedSectionId) await loadSectionDetails(selectedSectionId);
    } catch (e: any) {
      alert(e?.message || "Не удалось сохранить работу");
    }
  }

  async function toggleWorkCollapsed(work: VorWork) {
    try {
      await API.works.patch(work._id, {
        isCollapsed: !work.isCollapsed,
      });
      if (selectedSectionId) await loadSectionDetails(selectedSectionId);
    } catch (e: any) {
      alert(e?.message || "Не удалось обновить работу");
    }
  }

  async function deleteWorkForever(work: VorWork) {
    if (!confirm("Удалить работу и все перенесённые в неё позиции?")) return;
    try {
      await API.works.deleteForever(work._id);
      if (selectedSectionId) await loadSectionDetails(selectedSectionId);
    } catch (e: any) {
      alert(e?.message || "Не удалось удалить работу");
    }
  }

  function openTransfer(item: SourceItem) {
    if (!activeWorkId) {
      alert("Сначала выбери работу слева");
      return;
    }
    setTransfer({
      item,
      qty: String(item.qtyRemaining ?? 0),
    });
  }

  async function submitTransfer() {
    if (!selectedSectionId || !activeWorkId || !transfer) return;
    const qty = Number(String(transfer.qty).replace(",", "."));
    if (!Number.isFinite(qty) || qty <= 0) {
      alert("Укажи корректное количество");
      return;
    }
    try {
      setSubmittingTransfer(true);
      await API.items.create(projectId, {
        vorSectionId: selectedSectionId,
        workId: activeWorkId,
        specItemId: transfer.item.specItemId,
        qty,
      });
      setTransfer(null);
      await loadSectionDetails(selectedSectionId);
    } catch (e: any) {
      alert(e?.message || "Не удалось перенести позицию");
    } finally {
      setSubmittingTransfer(false);
    }
  }

  async function deleteVorItem(row: VorItem) {
    if (!confirm("Удалить перенесённую позицию из работы?")) return;
    try {
      await API.items.deleteForever(row._id);
      if (selectedSectionId) await loadSectionDetails(selectedSectionId);
    } catch (e: any) {
      alert(e?.message || "Не удалось удалить позицию");
    }
  }

  function specTitle(section?: VorSection | null) {
    const spec = section?.specSectionId ? specsById[section.specSectionId] : null;
    if (!spec) return "— не выбрана —";
    return `${spec.title || "Спецификация"}${spec.isActual === false ? " · неактуальна" : ""}`;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {selectedSectionId ? (
          <button
            className="rounded-md border px-3 py-2 inline-flex items-center gap-2"
            onClick={() => setSelectedSectionId(null)}
            type="button"
          >
            ← К списку ВОР
          </button>
        ) : (
          <button
            className="rounded-md border px-3 py-2 inline-flex items-center gap-2"
            onClick={() => {
              setCreatingSection((v) => !v);
              setCreateDraft((prev) => ({
                number: prev.number || `ВОР-${sections.length + 1}`,
                date: prev.date || todayIso(),
                specSectionId:
                  prev.specSectionId || specSections[0]?._id || "",
                title: prev.title,
                isActual: prev.isActual,
              }));
            }}
            type="button"
          >
            <Icon.Plus />
            ВОР
          </button>
        )}

        <div className="ml-auto">
          <button
            type="button"
            className={`rounded-md border px-3 h-9 text-sm ${
              onlyArchive ? "bg-muted/60" : ""
            }`}
            onClick={() => setOnlyArchive((v) => !v)}
          >
            {onlyArchive ? "Архив: включён" : "Архив"}
          </button>
        </div>
      </div>

      {creatingSection && !selectedSectionId && (
        <div className="rounded-2xl border p-4 space-y-3">
          <div className="text-sm font-medium">Новый ВОР</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <label className="text-sm">
              Номер
              <input
                className="w-full rounded-xl border px-3 py-2 mt-1"
                value={createDraft.number}
                onChange={(e) =>
                  setCreateDraft((prev) => ({ ...prev, number: e.target.value }))
                }
              />
            </label>
            <label className="text-sm">
              Дата
              <input
                type="date"
                className="w-full rounded-xl border px-3 py-2 mt-1"
                value={createDraft.date}
                onChange={(e) =>
                  setCreateDraft((prev) => ({ ...prev, date: e.target.value }))
                }
              />
            </label>
            <label className="text-sm">
              Проект
              <input
                className="w-full rounded-xl border px-3 py-2 mt-1 bg-muted/30"
                value={projectName}
                readOnly
              />
            </label>
            <label className="text-sm">
              Спецификация
              <select
                className="w-full rounded-xl border px-3 py-2 mt-1"
                value={createDraft.specSectionId}
                onChange={(e) =>
                  setCreateDraft((prev) => ({
                    ...prev,
                    specSectionId: e.target.value,
                  }))
                }
              >
                <option value="">— не выбрана —</option>
                {specSections.map((spec) => (
                  <option key={spec._id} value={spec._id}>
                    {spec.title || "Спецификация"}{spec.isActual === false ? " · неактуальна" : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={createDraft.isActual}
              onChange={(e) =>
                setCreateDraft((prev) => ({ ...prev, isActual: e.target.checked }))
              }
            />
            Актуальный ВОР
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-xl border px-4 py-2"
              onClick={() => setCreatingSection(false)}
            >
              Отмена
            </button>
            <button
              type="button"
              className="rounded-xl border px-4 py-2 bg-muted/50"
              onClick={createSection}
            >
              Создать
            </button>
          </div>
        </div>
      )}

      {!selectedSectionId ? (
        <>
          {loading && (
            <div className="text-sm text-muted-foreground">Загрузка…</div>
          )}
          {error && <div className="text-sm text-red-600">{error}</div>}
          {sections.length ? (
            <div className="rounded-2xl border overflow-hidden">
              <div className="grid grid-cols-[minmax(0,1.6fr)_160px_minmax(0,1.2fr)_140px] px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/40">
                <div>ВОР</div>
                <div className="text-center">Дата</div>
                <div>Спецификация</div>
                <div className="text-right">Действия</div>
              </div>

              {sections.map((section) => (
                <div
                  key={section._id}
                  className={`border-t bg-background hover:bg-muted/40 transition cursor-pointer ${
                    section.isActual === false ? "bg-amber-50/30" : ""
                  }`}
                  onClick={() => setSelectedSectionId(section._id)}
                >
                  <div className="grid grid-cols-[minmax(0,1.6fr)_160px_minmax(0,1.2fr)_140px] px-4 py-3 items-center text-sm gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="font-medium truncate">
                          {section.number || section.title || "ВОР"}
                        </div>
                        {section.isActual === false && (
                          <span className="shrink-0 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700">
                            Неактуальна
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {section.title && section.title !== section.number
                          ? section.title
                          : projectName}
                      </div>
                    </div>
                    <div className="text-center text-sm">
                      {section.date || "—"}
                    </div>
                    <div className="text-sm text-muted-foreground truncate">
                      {specTitle(section)}
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      {!onlyArchive && (
                        <button
                          type="button"
                          className={`rounded-xl border px-2 py-1 text-xs ${
                            section.isActual === false
                              ? "border-amber-300 bg-amber-50 text-amber-700"
                              : ""
                          }`}
                          title="Переключить актуальность"
                          onClick={(e) => {
                            e.stopPropagation();
                            void toggleSectionActuality(section);
                          }}
                        >
                          {section.isActual === false ? "Неактуальна" : "Актуальна"}
                        </button>
                      )}
                      {!onlyArchive ? (
                        <button
                          type="button"
                          className={iconBtn}
                          title={section.deleted ? "Восстановить" : "В архив"}
                          onClick={(e) => {
                            e.stopPropagation();
                            void toggleSectionArchive(section);
                          }}
                        >
                          {section.deleted ? <Icon.Unarchive /> : <Icon.Archive />}
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            className={iconBtn}
                            title="Восстановить"
                            onClick={(e) => {
                              e.stopPropagation();
                              void toggleSectionArchive(section);
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
                              void deleteSectionForever(section);
                            }}
                          >
                            <Icon.Trash />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">ВОР пока нет.</div>
          )}
        </>
      ) : activeSection ? (
        <div className="space-y-4">
          <div className="rounded-2xl border overflow-hidden">
            <div className="p-4 border-b grid grid-cols-1 md:grid-cols-4 gap-3">
              <label className="text-sm">
                Номер
                <input
                  className="w-full rounded-xl border px-3 py-2 mt-1"
                  value={sectionForm.number}
                  onChange={(e) =>
                    setSectionForm((prev) => ({ ...prev, number: e.target.value }))
                  }
                />
              </label>
              <label className="text-sm">
                Дата
                <input
                  type="date"
                  className="w-full rounded-xl border px-3 py-2 mt-1"
                  value={sectionForm.date}
                  onChange={(e) =>
                    setSectionForm((prev) => ({ ...prev, date: e.target.value }))
                  }
                />
              </label>
              <label className="text-sm">
                Проект
                <input
                  className="w-full rounded-xl border px-3 py-2 mt-1 bg-muted/30"
                  value={projectName}
                  readOnly
                />
              </label>
              <label className="text-sm">
                Спецификация
                <select
                  className="w-full rounded-xl border px-3 py-2 mt-1"
                  value={sectionForm.specSectionId}
                  onChange={(e) =>
                    setSectionForm((prev) => ({
                      ...prev,
                      specSectionId: e.target.value,
                    }))
                  }
                >
                  <option value="">— не выбрана —</option>
                  {specSections.map((spec) => (
                    <option key={spec._id} value={spec._id}>
                      {spec.title || "Спецификация"}{spec.isActual === false ? " · неактуальна" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="inline-flex items-center gap-2 text-sm md:col-span-4">
                <input
                  type="checkbox"
                  checked={sectionForm.isActual}
                  onChange={(e) =>
                    setSectionForm((prev) => ({ ...prev, isActual: e.target.checked }))
                  }
                />
                Актуальный ВОР
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-b bg-muted/20">
              {!onlyArchive ? (
                <>
                  <button
                    type="button"
                    className={`rounded-xl border px-3 py-2 text-sm ${
                      activeSection.isActual === false
                        ? "border-amber-300 bg-amber-50 text-amber-700"
                        : ""
                    }`}
                    onClick={() => void toggleSectionActuality(activeSection)}
                  >
                    {activeSection.isActual === false ? "Неактуальна" : "Актуальна"}
                  </button>
                  <button
                    type="button"
                    className={`${iconBtn} w-auto px-3 gap-2`}
                    onClick={saveSection}
                    disabled={savingSection}
                  >
                    <Icon.Check />
                    Сохранить
                  </button>
                  <button
                    type="button"
                    className={`${iconBtn} w-auto px-3 gap-2`}
                    onClick={() => void toggleSectionArchive(activeSection)}
                  >
                    <Icon.Archive />
                    В архив
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className={`${iconBtn} w-auto px-3 gap-2`}
                    onClick={() => void toggleSectionArchive(activeSection)}
                  >
                    <Icon.Unarchive />
                    Восстановить
                  </button>
                  <button
                    type="button"
                    className={`${iconBtn} w-auto px-3 gap-2 border-red-200 text-red-600 hover:bg-red-50`}
                    onClick={() => void deleteSectionForever(activeSection)}
                  >
                    <Icon.Trash />
                    Удалить
                  </button>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2">
              <div className="border-r border-border/60">
                <div className="p-4 border-b bg-muted/30 space-y-3">
                  <div className="font-medium">Работы</div>
                  {!onlyArchive && (
                    <div className="flex gap-2">
                      <input
                        className="flex-1 rounded-xl border px-3 py-2 text-sm"
                        placeholder="Новая работа…"
                        value={newWork.name}
                        onChange={(e) => setNewWork({ name: e.target.value })}
                      />
                      <button
                        type="button"
                        className="rounded-xl border px-3 py-2 text-sm inline-flex items-center gap-2"
                        onClick={addWork}
                      >
                        <Icon.Plus />
                        Добавить
                      </button>
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Выбери работу слева, затем нажми на позицию справа, чтобы перенести количество.
                  </div>
                </div>

                <div className="overflow-auto max-h-[65vh]">
                  <table className="w-full text-sm zebra">
                    <thead className="sticky top-0 bg-background z-10">
                      <tr className="border-b">
                        <th className="p-2 text-left w-20">№</th>
                        <th className="p-2 text-left">Работы</th>
                        <th className="p-2 text-left w-28">Ед. изм.</th>
                        <th className="p-2 text-left w-28">Кол-во</th>
                        <th className="p-2 text-right w-28" />
                      </tr>
                    </thead>
                    <tbody>
                      {worksForActive.map((work, index) => {
                        const childRows = itemsByWork[work._id] || [];
                        const isSelected = activeWorkId === work._id;
                        const isEditing = workEditing[work._id] !== undefined;
                        return (
                          <FragmentWorkRows
                            key={work._id}
                            work={work}
                            index={index + 1}
                            childRows={childRows}
                            isSelected={isSelected}
                            isEditing={isEditing}
                            editValue={workEditing[work._id] ?? work.name ?? ""}
                            setEditValue={(value) =>
                              setWorkEditing((prev) => ({ ...prev, [work._id]: value }))
                            }
                            onSelect={() => setActiveWorkId(work._id)}
                            onToggle={() => void toggleWorkCollapsed(work)}
                            onSave={() => void saveWorkName(work)}
                            onCancel={() =>
                              setWorkEditing((prev) => {
                                const copy = { ...prev };
                                delete copy[work._id];
                                return copy;
                              })
                            }
                            onEdit={() =>
                              setWorkEditing((prev) => ({
                                ...prev,
                                [work._id]: work.name || "",
                              }))
                            }
                            onDelete={() => void deleteWorkForever(work)}
                            onDeleteItem={(row) => void deleteVorItem(row)}
                            readOnly={onlyArchive}
                          />
                        );
                      })}
                      {!worksForActive.length && (
                        <tr>
                          <td colSpan={5} className="p-4 text-center text-muted-foreground">
                            Работ пока нет.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <div className="p-4 border-b bg-muted/30 space-y-2">
                  <div className="font-medium">Спецификация</div>
                  <div className="text-xs text-muted-foreground">
                    {sectionForm.specSectionId
                      ? `${specTitle(activeSection)}${activeWorkId ? "" : " · сначала выбери работу слева"}`
                      : "Для ВОР пока не выбрана спецификация"}
                  </div>
                </div>

                <div className="overflow-auto max-h-[65vh]">
                  <table className="w-full text-sm zebra">
                    <thead className="sticky top-0 bg-background z-10">
                      <tr className="border-b">
                        <th className="p-2 text-left w-20">№</th>
                        <th className="p-2 text-left">Спецификация</th>
                        <th className="p-2 text-left w-28">Ед. изм.</th>
                        <th className="p-2 text-left w-32">Остаток</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedSourceItems.map((row) => (
                        <tr
                          key={row.specItemId}
                          className={`border-b transition ${
                            onlyArchive
                              ? "opacity-60"
                              : activeWorkId
                              ? "cursor-pointer hover:bg-muted/40"
                              : "cursor-not-allowed opacity-80"
                          }`}
                          onClick={() => !onlyArchive && openTransfer(row)}
                        >
                          <td className="p-2 align-top">{row.posStr || "—"}</td>
                          <td className="p-2 align-top">
                            <div>{row.name || "—"}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Всего: {formatQty(row.qty)} · распределено: {formatQty(row.qtyUsed)}
                            </div>
                          </td>
                          <td className="p-2 align-top">{row.unit || "—"}</td>
                          <td className="p-2 align-top font-medium">
                            {formatQty(row.qtyRemaining)}
                          </td>
                        </tr>
                      ))}
                      {!sortedSourceItems.length && (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-muted-foreground">
                            {sectionForm.specSectionId
                              ? "Свободных позиций не осталось."
                              : "Сначала выбери спецификацию сверху."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {transfer && activeWorkId && (
            <div className="fixed inset-0 z-50 grid place-items-center">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setTransfer(null)}
              />
              <div className="relative w-[min(520px,96vw)] rounded-2xl bg-background p-6 shadow-2xl space-y-4">
                <div className="text-lg font-semibold">Перенести позицию</div>
                <div className="text-sm text-muted-foreground">
                  <div>
                    Работа: <span className="text-foreground">
                      {worksForActive.find((x) => x._id === activeWorkId)?.name || "—"}
                    </span>
                  </div>
                  <div className="mt-1">
                    Позиция: <span className="text-foreground">
                      {transfer.item.posStr ? `${transfer.item.posStr} ` : ""}
                      {transfer.item.name || "—"}
                    </span>
                  </div>
                  <div className="mt-1">
                    Доступный остаток: <span className="text-foreground">
                      {formatQty(transfer.item.qtyRemaining)} {transfer.item.unit || ""}
                    </span>
                  </div>
                </div>
                <label className="text-sm block">
                  Какое количество нужно перенести?
                  <input
                    className="w-full rounded-xl border px-3 py-2 mt-1"
                    value={transfer.qty}
                    onChange={(e) =>
                      setTransfer((prev) =>
                        prev ? { ...prev, qty: e.target.value } : prev
                      )
                    }
                    inputMode="decimal"
                  />
                </label>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-xl border px-4 py-2 inline-flex items-center gap-2"
                    onClick={() => setTransfer(null)}
                  >
                    <Icon.X />
                    Отмена
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border px-4 py-2 inline-flex items-center gap-2 bg-muted/50"
                    onClick={submitTransfer}
                    disabled={submittingTransfer}
                  >
                    <Icon.Check />
                    Перенести
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">ВОР не найден.</div>
      )}
    </div>
  );
}

function FragmentWorkRows({
  work,
  index,
  childRows,
  isSelected,
  isEditing,
  editValue,
  setEditValue,
  onSelect,
  onToggle,
  onSave,
  onCancel,
  onEdit,
  onDelete,
  onDeleteItem,
  readOnly,
}: {
  work: VorWork;
  index: number;
  childRows: VorItem[];
  isSelected: boolean;
  isEditing: boolean;
  editValue: string;
  setEditValue: (value: string) => void;
  onSelect: () => void;
  onToggle: () => void;
  onSave: () => void;
  onCancel: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDeleteItem: (row: VorItem) => void;
  readOnly: boolean;
}) {
  return (
    <>
      <tr className={`border-b ${isSelected ? "bg-blue-50/60" : "hover:bg-muted/20"}`}>
        <td className="p-2 align-top">
          <button
            type="button"
            className="inline-flex items-center gap-1"
            onClick={onToggle}
          >
            {work.isCollapsed ? <Icon.ChevronRight /> : <Icon.ChevronDown />}
            <span>{index}</span>
          </button>
        </td>
        <td className="p-2 align-top">
          {isEditing ? (
            <input
              className="w-full rounded-xl border px-3 py-2 text-sm"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
            />
          ) : (
            <button
              type="button"
              className="text-left w-full"
              onClick={onSelect}
            >
              <div className="font-medium">{work.name || "Работа"}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {isSelected ? "Выбрана для переноса" : "Нажми, чтобы выбрать"}
              </div>
            </button>
          )}
        </td>
        <td className="p-2 align-top">—</td>
        <td className="p-2 align-top">—</td>
        <td className="p-2 align-top">
          <div className="flex items-center justify-end gap-2">
            {readOnly ? null : isEditing ? (
              <>
                <button type="button" className={iconBtn} title="Сохранить" onClick={onSave}>
                  <Icon.Check />
                </button>
                <button type="button" className={iconBtn} title="Отмена" onClick={onCancel}>
                  <Icon.X />
                </button>
              </>
            ) : (
              <>
                <button type="button" className={iconBtn} title="Редактировать" onClick={onEdit}>
                  <Icon.Pencil />
                </button>
                <button
                  type="button"
                  className={`${iconBtn} border-red-200 text-red-600 hover:bg-red-50`}
                  title="Удалить"
                  onClick={onDelete}
                >
                  <Icon.Trash />
                </button>
              </>
            )}
          </div>
        </td>
      </tr>

      {!work.isCollapsed &&
        childRows.map((row) => (
          <tr key={row._id} className="border-b bg-muted/35">
            <td className="p-2" />
            <td className="p-2 align-top pl-6">
              <div>
                {row.posStr ? `${row.posStr} ` : ""}
                {row.name || "—"}
              </div>
            </td>
            <td className="p-2 align-top">{row.unit || "—"}</td>
            <td className="p-2 align-top">{formatQty(row.qty)}</td>
            <td className="p-2 align-top">
              {!readOnly && (
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    className={`${iconBtn} border-red-200 text-red-600 hover:bg-red-50`}
                    title="Удалить позицию"
                    onClick={() => onDeleteItem(row)}
                  >
                    <Icon.Trash />
                  </button>
                </div>
              )}
            </td>
          </tr>
        ))}
    </>
  );
}