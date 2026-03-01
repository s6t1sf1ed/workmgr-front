import { useEffect, useMemo, useState, Fragment } from "react";
import type { KeyboardEvent } from "react";
import { api, downloadBlob } from "../lib/api";
import type { Section, Item } from "./SpecsTab";
import { filterBySectionVersion, money } from "./SpecsTab";

/* доп. типы */

type ShipmentSection = {
  _id: string;
  projectId: string;
  title?: string;
  specSectionId?: string | null;
  deleted?: boolean;
};

type ShipmentItem = {
  _id: string;
  projectId: string;
  shipmentSectionId: string;
  specItemId?: string | null;
  name?: string;
  unit?: string;
  qty?: number;
  deleted?: boolean;
};

type ExecSection = {
  _id: string;
  projectId: string;
  title?: string;
  specSectionId?: string | null;
  deleted?: boolean;
};

type ExecItem = {
  _id: string;
  projectId: string;
  execSectionId: string;
  specItemId?: string | null;
  qty?: number;
  deleted?: boolean;
};

type Work = {
  _id: string;
  projectId: string;
  itemId: string;
  name?: string;
  unit?: string;
  qty_plan?: number;
  qty_fact?: number;
  deleted?: boolean;
};

/* API */

const API = {
  spec: {
    sections: (projectId: string) =>
      api<{ items: Section[] }>(
        `/api/projects/${projectId}/spec/sections?deleted=0`
      ),
    items: (projectId: string) =>
      api<{ items: Item[] }>(
        `/api/projects/${projectId}/spec/items?deleted=0`
      ),
  },
  ship: {
    sections: (projectId: string) =>
      api<{ items: ShipmentSection[] }>(
        `/api/projects/${projectId}/ship/sections?deleted=0`
      ),
    items: (projectId: string) =>
      api<{ items: ShipmentItem[] }>(
        `/api/projects/${projectId}/ship/items?deleted=0`
      ),
  },
  exec: {
    sections: (projectId: string) =>
      api<{ items: ExecSection[] }>(
        `/api/projects/${projectId}/exec/sections?deleted=0`
      ),
    items: (projectId: string) =>
      api<{ items: ExecItem[] }>(
        `/api/projects/${projectId}/exec/items?deleted=0`
      ),
  },
  works: {
    list: (projectId: string) =>
      api<{ items: Work[] }>(
        `/api/projects/${projectId}/spec/works?deleted=0`
      ),
    patch: (id: string, payload: Partial<Work>) =>
      api<Work>(`/api/spec/works/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
  },
};

type Props = {
  projectId: string;
};

type WorkDraft = {
  qty_fact?: string;
};

type Group = {
  header?: Item;
  items: Item[];
};

/* helpers */

function isHeaderRow(item: Item): boolean {
  const anyItem = item as any;
  return Boolean(
    anyItem.isHeader ||
      anyItem.header ||
      anyItem.rowType === "header"
  );
}

export default function SpecsSummaryTab({ projectId }: Props) {
  const [sections, setSections] = useState<Section[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  const [, setShipSections] = useState<ShipmentSection[]>([]);
  const [shipItems, setShipItems] = useState<ShipmentItem[]>([]);

  const [execItems, setExecItems] = useState<ExecItem[]>([]);

  const [works, setWorks] = useState<Work[]>([]);
  const [workDrafts, setWorkDrafts] = useState<Record<string, WorkDraft>>({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // скрыты ли работы по каждому разделу
  const [hiddenWorks, setHiddenWorks] = useState<Record<string, boolean>>({});

  // какой раздел свода открыт (null = список сводов)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null
  );

  /* загрузка данных */

  useEffect(() => {
    if (!projectId) return;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [
          secRes,
          itRes,
          shipSecRes,
          shipItemRes,
          execItemRes,
          worksRes,
        ] = await Promise.all([
          API.spec.sections(projectId),
          API.spec.items(projectId),
          API.ship.sections(projectId),
          API.ship.items(projectId),
          API.exec.items(projectId),
          API.works.list(projectId),
        ]);

        setSections(
          (secRes.items || []).sort(
            (a, b) => (a.order ?? 0) - (b.order ?? 0)
          )
        );
        setItems(itRes.items || []);

        setShipSections(shipSecRes.items || []);
        setShipItems(shipItemRes.items || []);

        setExecItems(execItemRes.items || []);

        setWorks((worksRes.items || []).filter((w) => !w.deleted));
      } catch (e: any) {
        console.error("SpecsSummaryTab load error:", e);
        const msg =
          e?.message ||
          e?.response?.data?.message ||
          e?.response?.data?.detail ||
          "Не удалось загрузить свод";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [projectId]);

  /* группировки */

  const specItemsBySection = useMemo(() => {
    const by: Record<string, Item[]> = {};
    for (const it of items) {
      const sid = (it as any).sectionId as string | undefined;
      if (!sid) continue;
      if (!by[sid]) by[sid] = [];
      by[sid].push(it);
    }
    for (const sid of Object.keys(by)) {
      by[sid].sort((a, b) => Number(a.pos ?? 0) - Number(b.pos ?? 0));
    }
    return by;
  }, [items]);

  const shipItemsBySpecItem = useMemo(() => {
    const map: Record<string, ShipmentItem[]> = {};
    for (const it of shipItems) {
      if (!it.specItemId || it.deleted) continue;
      const key = String(it.specItemId);
      if (!map[key]) map[key] = [];
      map[key].push(it);
    }
    return map;
  }, [shipItems]);

  const execItemsBySpecItem = useMemo(() => {
    const map: Record<string, ExecItem[]> = {};
    for (const it of execItems) {
      if (!it.specItemId || it.deleted) continue;
      const key = String(it.specItemId);
      if (!map[key]) map[key] = [];
      map[key].push(it);
    }
    return map;
  }, [execItems]);

  const worksByItem = useMemo(() => {
    const map: Record<string, Work[]> = {};
    for (const w of works) {
      if (!w.itemId || w.deleted) continue;
      const key = String(w.itemId);
      if (!map[key]) map[key] = [];
      map[key].push(w);
    }
    return map;
  }, [works]);

  /* helpers */

  const getSectionData = (sec: Section) => {
    const allRows = specItemsBySection[sec._id] || [];
    const visibleRows = filterBySectionVersion(sec, allRows).filter(
      (r) => !(r as any).deleted
    );

    const groups: Group[] = [];
    let current: Group | null = null;

    for (const row of visibleRows) {
      if (isHeaderRow(row)) {
        current = { header: row, items: [] };
        groups.push(current);
      } else {
        if (!current) {
          current = { items: [] };
          groups.push(current);
        }
        current.items.push(row);
      }
    }

    const flatItems = groups.flatMap((g) => g.items);

    const sectionTotals = flatItems.reduce(
      (acc, it) => {
        const anyItem = it as any;
        const qty = Number(anyItem.qty ?? 0);
        const pw = Number(anyItem.price_work ?? 0);
        const pm = Number(anyItem.price_mat ?? 0);
        const work = qty * pw;
        const mat = qty * pm;
        acc.work += work;
        acc.mat += mat;
        acc.total += work + mat;
        return acc;
      },
      { work: 0, mat: 0, total: 0 }
    );

    return { specRows: flatItems, groups, sectionTotals };
  };

  const renderSectionBlock = (sec: Section) => {
    const { specRows, groups, sectionTotals } = getSectionData(sec);
    if (!specRows.length) return null;

    const sectionWorksHidden = !!hiddenWorks[sec._id];

    return (
      <div
        key={sec._id}
        className="rounded-2xl border overflow-hidden"
      >
        {/* заголовок раздела */}
        <div className="bg-muted/40 px-3 py-2 flex items-center justify-between">
          <div className="text-sm font-medium">
            {sec.title || "Раздел"}{" "}
            <span className="text-xs text-muted-foreground">
              · v{(sec.activeVersion || sec.version || 1).toString()}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="space-x-3">
              <span>
                Работы:{" "}
                <span className="font-semibold">
                  {money(sectionTotals.work)}
                </span>
              </span>
              <span>
                Материалы:{" "}
                <span className="font-semibold">
                  {money(sectionTotals.mat)}
                </span>
              </span>
              <span>
                Всего:{" "}
                <span className="font-semibold">
                  {money(sectionTotals.total)}
                </span>
              </span>
            </div>
            {/* кнопка показать/скрыть работы для этого раздела */}
            <button
              type="button"
              className="rounded-xl border px-2 py-1 text-[11px] hover:bg-muted"
              onClick={() =>
                setHiddenWorks((prev) => ({
                  ...prev,
                  [sec._id]: !sectionWorksHidden,
                }))
              }
            >
              {sectionWorksHidden ? "Показать работы" : "Скрыть работы"}
            </button>
          </div>
        </div>

        {/* таблица по позициям */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm zebra">
            <thead className="sticky top-0 bg-background z-10 border-b">
              <tr className="divide-x divide-border">
                <th className="p-2 text-left w-10">№</th>
                <th className="p-2 text-left">Наименование</th>
                <th className="p-2 text-left w-24">Единица измерения</th>
                <th className="p-2 text-right w-32">
                  Количество по спецификации
                </th>
                <th className="p-2 text-right w-32">
                  Количество по отгрузке
                </th>
                <th className="p-2 text-right w-32">
                  Количество фактическое
                </th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group, groupIndex) => {
                let localIndex = 0;

                return (
                  <Fragment
                    key={
                      group.header
                        ? `group-${group.header._id}`
                        : `group-${groupIndex}`
                    }
                  >
                    {group.header && (
                      <tr className="border-b border-border bg-muted/40">
                        <td
                          className="p-2 text-sm font-semibold"
                          colSpan={6}
                        >
                          {group.header.name || "—"}
                        </td>
                      </tr>
                    )}

                    {group.items.map((it) => {
                      const anyItem = it as any;
                      const specQty =
                        Number(anyItem.qty ?? 0) || "";
                      const shipList =
                        shipItemsBySpecItem[String(it._id)] || [];
                      const execList =
                        execItemsBySpecItem[String(it._id)] || [];
                      const workList = sectionWorksHidden
                        ? []
                        : worksByItem[String(it._id)] || [];

                      const qtyShipment = shipList.reduce(
                        (acc, s) => acc + Number(s.qty ?? 0),
                        0
                      );
                      const qtyExec = execList.reduce(
                        (acc, e) => acc + Number(e.qty ?? 0),
                        0
                      );

                      const shipItemNames = Array.from(
                        new Set(
                          shipList
                            .map((si) => si.name)
                            .filter(
                              (n): n is string =>
                                Boolean(n && n.trim())
                            )
                        )
                      );

                      const index = localIndex++;

                      return (
                        <FragmentWithWorks
                          key={it._id}
                          index={index}
                          item={it}
                          specQty={specQty}
                          qtyShipment={qtyShipment || ""}
                          qtyExec={qtyExec || ""}
                          shipItemNames={shipItemNames}
                          works={workList}
                          workDrafts={workDrafts}
                          setWorkDrafts={setWorkDrafts}
                          onSaveWork={saveWorkFact}
                          onWorkKeyDown={handleWorkFactKey}
                        />
                      );
                    })}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /* редактирование факта по работам */

  async function saveWorkFact(work: Work) {
    const draft = workDrafts[work._id];
    const raw = draft?.qty_fact ?? (work.qty_fact ?? "").toString();
    const num =
      raw.trim() === "" ? null : Number(raw.replace(",", "."));
    if (num !== null && !Number.isFinite(num)) {
      alert("Некорректное фактическое количество");
      return;
    }

    try {
      const res = await API.works.patch(work._id, {
        qty_fact: num === null ? undefined : num,
      });
      setWorks((prev) =>
        prev.map((w) => (w._id === work._id ? res : w))
      );
      setWorkDrafts((prev) => {
        const next = { ...prev };
        delete next[work._id];
        return next;
      });
    } catch (e: any) {
      console.error("SpecsSummaryTab saveWorkFact error:", e);
      const msg =
        e?.message ||
        e?.response?.data?.message ||
        e?.response?.data?.detail ||
        "Не удалось сохранить фактическое количество";
      alert(msg);
    }
  }

  const handleWorkFactKey = (
    e: KeyboardEvent<HTMLInputElement>,
    work: Work
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void saveWorkFact(work);
    }
  };

  const currentSection =
    (selectedSectionId &&
      sections.find((s) => s._id === selectedSectionId)) ||
    null;

  /* экспорт свода в Excel */

  const handleExportExcel = async () => {
    if (!selectedSectionId || !currentSection) return;
    try {
      const blob = await downloadBlob(
        `/api/spec/summary/${selectedSectionId}/export`
      );

      const url = URL.createObjectURL(blob);
      const rawTitle = currentSection.title?.trim() || "Свод";
      const safeTitle = rawTitle.replace(/[\\/:*?"<>|]/g, "_");
      const a = document.createElement("a");
      a.href = url;
      a.download = `${safeTitle}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error("SpecsSummaryTab export error:", e);
      const msg =
        e?.message ||
        e?.response?.data?.message ||
        e?.response?.data?.detail ||
        "Не удалось экспортировать свод";
      alert(msg);
    }
  };

  /* рендер */

  if (loading && !sections.length) {
    return (
      <div className="text-sm text-muted-foreground">
        Загрузка свода…
      </div>
    );
  }

  if (!loading && sections.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Разделов спецификации нет.
      </div>
    );
  }

  return (
    <div className="space-y-4 min-h-[calc(100vh-140px)] overflow-visible">
      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      {/* toolbar */}
      <div className="flex items-center gap-3">
        {selectedSectionId ? (
          <>
            <button
              className="rounded-md border px-3 py-2 inline-flex items-center gap-2"
              onClick={() => setSelectedSectionId(null)}
              type="button"
            >
              ← К списку сводов
            </button>
            {currentSection && (
              <button
                type="button"
                className="rounded-md border px-3 py-2 inline-flex items-center gap-2"
                onClick={handleExportExcel}
              >
                Экспорт в Excel
              </button>
            )}
          </>
        ) : null}
      </div>

      {/* либо список сводов, либо один свод */}
      {selectedSectionId ? (
        currentSection ? (
          renderSectionBlock(currentSection)
        ) : (
          <div className="text-sm text-muted-foreground">
            Свод не найден.
          </div>
        )
      ) : sections.length ? (
        <div className="rounded-2xl border overflow-hidden">
          {/* шапка списка сводов */}
          <div className="grid grid-cols-[minmax(0,2fr)_140px_140px_140px_80px] px-4 py-2 text-xs font-medium text-muted-foreground bg-muted/40">
            <div>Свод по разделу</div>
            <div className="text-right">Работы</div>
            <div className="text-right">Материалы</div>
            <div className="text-right">Всего</div>
            <div className="text-right">Позиции</div>
          </div>

          {sections.map((sec) => {
            const { specRows, sectionTotals } = getSectionData(sec);
            if (!specRows.length) return null;

            return (
              <div
                key={sec._id}
                className="border-t bg-background hover:bg-muted/40 transition cursor-pointer"
                onClick={() => setSelectedSectionId(sec._id)}
              >
                <div className="grid grid-cols-[minmax(0,2fr)_140px_140px_140px_80px] px-4 py-3 items-center text-sm">
                  <div className="flex flex-col gap-1">
                    <div className="font-medium">
                      {sec.title || "Раздел"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Версия v
                      {(
                        sec.activeVersion || sec.version || 1
                      ).toString()}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    {money(sectionTotals.work)}
                  </div>
                  <div className="text-right text-sm">
                    {money(sectionTotals.mat)}
                  </div>
                  <div className="text-right text-sm">
                    {money(sectionTotals.total)}
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {specRows.length}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

/* вспомогательный компонент для строки материала + работ */

type FragmentProps = {
  index: number;
  item: Item;
  specQty: number | string;
  qtyShipment: number | string;
  qtyExec: number | string;
  shipItemNames: string[];
  works: Work[];
  workDrafts: Record<string, WorkDraft>;
  setWorkDrafts: React.Dispatch<
    React.SetStateAction<Record<string, WorkDraft>>
  >;
  onSaveWork: (w: Work) => Promise<void>;
  onWorkKeyDown: (
    e: KeyboardEvent<HTMLInputElement>,
    w: Work
  ) => void;
};

function FragmentWithWorks({
  index,
  item,
  specQty,
  qtyShipment,
  qtyExec,
  shipItemNames,
  works,
  workDrafts,
  setWorkDrafts,
  onSaveWork,
  onWorkKeyDown,
}: FragmentProps) {
  return (
    <>
      {/* строка материала */}
      <tr className="border-b border-border divide-x divide-border">
        <td className="p-2 align-top">{index + 1}</td>
        <td className="p-2 align-top">
          <div className="font-medium">{item.name || "—"}</div>
          {shipItemNames.length > 0 && (
            <div className="text-xs text-muted-foreground">
              из отгрузки: {shipItemNames.join(", ")}
            </div>
          )}
        </td>
        <td className="p-2 align-top w-24">
          {(item as any).unit || ""}
        </td>
        <td className="p-2 align-top w-32 text-right">
          {specQty !== 0 ? specQty : ""}
        </td>
        <td className="p-2 align-top w-32 text-right">
          {qtyShipment !== 0 ? qtyShipment : ""}
        </td>
        <td className="p-2 align-top w-32 text-right">
          {qtyExec !== 0 ? qtyExec : ""}
        </td>
      </tr>

      {/* строки работ по этой позиции */}
      {works.map((w) => {
        const draft = workDrafts[w._id];
        const value =
          draft?.qty_fact ??
          (w.qty_fact !== undefined && w.qty_fact !== null
            ? w.qty_fact.toString()
            : "");

        return (
          <tr key={w._id} className="border-b border-border divide-x divide-border">
            <td className="p-2" />
            <td className="p-2 align-top">
              <div className="pl-6 text-xs">
                {w.name || "Работа"}
              </div>
            </td>
            <td className="p-2 align-top w-24 text-xs text-muted-foreground">
              {w.unit || ""}
            </td>
            <td className="p-2 align-top w-32 text-right text-xs">
              {w.qty_plan ?? ""}
            </td>
            <td className="p-2 align-top w-32" />
            <td className="p-2 align-top w-32 text-right">
              <input
                type="number"
                className="w-full rounded-md border px-2 py-1 text-xs text-right"
                value={value}
                onChange={(e) =>
                  setWorkDrafts((prev) => ({
                    ...prev,
                    [w._id]: {
                      ...(prev[w._id] || {}),
                      qty_fact: e.target.value,
                    },
                  }))
                }
                onBlur={() => void onSaveWork(w)}
                onKeyDown={(e) => onWorkKeyDown(e, w)}
                placeholder="Факт"
              />
            </td>
          </tr>
        );
      })}
    </>
  );
}
