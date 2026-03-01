import { useEffect, useMemo, useState } from "react";
import { api, downloadBlob, PersonFiles } from "../lib/api";
import DynamicForm from "./DynamicForm";
import { formatDateTimeRu } from "../lib/dates";

type Entity = "project" | "person" | "task";

type Person = {
  _id?: string;
  lastName?: string;
  firstName?: string;
  middleName?: string;
  email?: string;
  telegramId?: string | number;
  position?: string;

  phone?: string;
  address?: string;
  passport?: string;

  accessProjects?: string[];
};

type Project = {
  _id?: string;
  name?: string;
  description?: string;
  accessPersons?: string[];
  address?: string;
  latitude?: number | string;
  longitude?: number | string;
  ask_location?: boolean;
};

/* = inline icons = */
const Icon = {
  Pencil: (p: any) => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden {...p}>
      <path
        fill="currentColor"
        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm14.71-9.04a1 1 0 000-1.41l-1.51-1.49a1 1 0 00-1.41 0l-1.34 1.34 3.75 3.75 1.51-1.49z"
      />
    </svg>
  ),
  Archive: (p: any) => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden {...p}>
      <path fill="currentColor" d="M3 3h18v4H3V3zm2 6h14v12H5V9zm3 3v2h8v-2H8z" />
    </svg>
  ),
  Unarchive: (p: any) => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden {...p}>
      <path
        fill="currentColor"
        d="M20 7V3H4v4h16zM6 9v10h12V9H6zm6 7l-4-4h3V9h2v3h3l-4 4z"
      />
    </svg>
  ),
  Trash: (p: any) => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden {...p}>
      <path
        fill="currentColor"
        d="M6 19a2 2 0 002 2h8a2 2 0 002-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
      />
    </svg>
  ),
};

const iconBtn =
  "inline-flex items-center justify-center rounded-md border w-8 h-8 text-foreground/80 hover:text-foreground hover:bg-muted transition";

type PersonFile = {
  _id: string;
  origName?: string;
  kind?: string | null;
  description?: string | null;
  size?: number;
  uploadedAt?: string;
};

export default function EntityTable({
  entity,
  archived = false,
  onOpenProject,
}: {
  entity: Entity;
  archived?: boolean;
  onOpenProject?: (id: string) => void;
}) {
  const [items, setItems] = useState<any[]>([]);
  const lsKey = `ui.search.${entity}`;
  const [query, setQuery] = useState<any>({
    page: 1,
    limit: 25,
    sort: "-updatedAt",
    q: localStorage.getItem(lsKey) || "",
  });
  const [edit, setEdit] = useState<any | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [allPersons, setAllPersons] = useState<Person[]>([]);

  // Документы сотрудника
  const [pFiles, setPFiles] = useState<PersonFile[]>([]);
  const [pFilesErr, setPFilesErr] = useState<string | null>(null);
  const [pFilesKind, setPFilesKind] = useState<string>("passport");
  const [pFilesDesc, setPFilesDesc] = useState<string>("");
  const [pFilesBusy, setPFilesBusy] = useState<boolean>(false);

  const unwrap = (res: any) =>
    Array.isArray(res)
      ? res
      : Array.isArray(res?.items)
      ? res.items
      : Array.isArray(res?.data)
      ? res.data
      : Array.isArray(res?.results)
      ? res.results
      : [];

  async function load() {
    try {
      const qs = new URLSearchParams(
        { ...query, archived: archived ? "1" : "0" } as any
      ).toString();

      const res = await api<any>(`/api/${entity}?${qs}`);
      const rows = unwrap(res);

      setItems(rows);
      setErr(null);
    } catch (e: any) {
      console.error("LIST error", e);
      setErr(e.message || "Ошибка загрузки");
      setItems([]);
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem(`ui.search.${entity}`) || "";
    setQuery((prev: any) => ({ ...prev, q: saved }));
  }, [entity]);

  useEffect(() => {
    localStorage.setItem(lsKey, query.q ?? "");
  }, [lsKey, query.q]);

  useEffect(() => {
    load();
  }, [entity, archived, query.page, query.q, query.status, query.updatedFrom, query.updatedTo]);

  // Подгрузка справочников
  useEffect(() => {
    (async () => {
      try {
        if (entity === "person" || entity === "project" || entity === "task") {
          const pr = await api<any>(`/api/project?archived=0&limit=1000`);
          setAllProjects(unwrap(pr));
        }
        if (entity === "person" || entity === "project") {
          const pe = await api<any>(`/api/person?archived=0&limit=2000`);
          setAllPersons(unwrap(pe));
        }
      } catch {
      }
    })();
  }, [entity]);

  function fio(it: Person) {
    return [it?.lastName, it?.firstName, it?.middleName].filter(Boolean).join(" ");
  }

  const rows = useMemo(() => {
    if (entity === "task") return items;
    const key = (it: any) => {
      if (entity === "project") return String(it.name || "");
      if (entity === "person") return fio(it) || String(it.email || "");
      return "";
    };

    return [...items].sort((a, b) =>
      key(a).localeCompare(key(b), "ru", { sensitivity: "base" })
    );
  }, [items, entity]);

  // загрузка документов сотрудника
  useEffect(() => {
    (async () => {
      if (entity !== "person") return;
      if (!edit?._id) return;
      try {
        setPFilesErr(null);
        const res = await PersonFiles.list(String(edit._id));
        const list = Array.isArray(res?.items) ? res.items : [];
        setPFiles(list);
      } catch (e: any) {
        setPFiles([]);
        setPFilesErr(e?.message || "Ошибка загрузки документов");
      }
    })();
  }, [entity, edit?._id]);

  async function refreshPersonFiles() {
    if (entity !== "person" || !edit?._id) return;
    const res = await PersonFiles.list(String(edit._id));
    setPFiles(Array.isArray(res?.items) ? res.items : []);
  }

  async function onUploadPersonFile(file: File) {
    if (!edit?._id) return;
    try {
      setPFilesBusy(true);
      setPFilesErr(null);
      await PersonFiles.upload(String(edit._id), file, {
        kind: pFilesKind,
        description: pFilesDesc?.trim() ? pFilesDesc.trim() : undefined,
      });
      setPFilesDesc("");
      await refreshPersonFiles();
    } catch (e: any) {
      setPFilesErr(e?.message || "Ошибка загрузки файла");
    } finally {
      setPFilesBusy(false);
    }
  }

  async function onDownloadPersonFile(fileId: string, filename?: string) {
    const blob = await downloadBlob(`/api/person-files/${fileId}/download`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "file";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function onDeletePersonFile(fileId: string) {
    await PersonFiles.delete(fileId);
    await refreshPersonFiles();
  }

  // Формы "ядра" + доступы
  function coreFieldsForm() {
    const v = edit || { extra: {} };
    const set = (k: string, val: any) => setEdit({ ...v, [k]: val });

    if (entity === "project")
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-sm">
            Название
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={v.name || ""}
              onChange={(e) => set("name", e.target.value)}
            />
          </label>
          <label className="text-sm">
            Описание
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={v.description || ""}
              onChange={(e) => set("description", e.target.value)}
            />
          </label>

          <label className="text-sm md:col-span-2">
            Адрес
            <input
              className="w-full rounded-xl border px-3 py-2"
              placeholder="г. Москва, ул. Пример, д. 1"
              value={v.address || ""}
              onChange={(e) => set("address", e.target.value)}
            />
          </label>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:col-span-2">
            <label className="text-sm">
              Широта
              <input
                className="w-full rounded-xl border px-3 py-2"
                inputMode="decimal"
                value={v.latitude ?? ""}
                onChange={(e) => set("latitude", e.target.value)}
              />
            </label>
            <label className="text-sm">
              Долгота
              <input
                className="w-full rounded-xl border px-3 py-2"
                inputMode="decimal"
                value={v.longitude ?? ""}
                onChange={(e) => set("longitude", e.target.value)}
              />
            </label>
          </div>

          <label className="text-sm flex items-center gap-2 md:col-span-2">
            <input
              type="checkbox"
              checked={!!v.ask_location}
              onChange={(e) => set("ask_location", e.target.checked)}
            />
            Запрашивать геолокацию у проекта
          </label>

          <div className="md:col-span-2 rounded-xl border p-3 space-y-2">
            <div className="text-sm font-medium">Сотрудники с доступом</div>
            <AccessChecklist
              options={allPersons
                .slice()
                .sort((a, b) => fio(a).localeCompare(fio(b), "ru"))
                .map((p) => ({
                  id: p._id as string,
                  label:
                    fio(p) ||
                    p.email ||
                    String(p.telegramId ?? "") ||
                    String(p._id || ""),
                }))}
              value={(v.accessPersons as string[]) || []}
              onChange={(ids) => set("accessPersons", ids)}
              emptyText="Нет сотрудников"
            />
          </div>
        </div>
      );

    if (entity === "person")
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="text-sm">
            Фамилия
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={v.lastName || ""}
              onChange={(e) => set("lastName", e.target.value)}
            />
          </label>
          <label className="text-sm">
            Имя
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={v.firstName || ""}
              onChange={(e) => set("firstName", e.target.value)}
            />
          </label>
          <label className="text-sm">
            Отчество
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={v.middleName || ""}
              onChange={(e) => set("middleName", e.target.value)}
            />
          </label>

          <label className="text-sm md:col-span-2">
            Email
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={v.email || ""}
              onChange={(e) => set("email", e.target.value)}
            />
          </label>
          <label className="text-sm">
            Telegram ID
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={v.telegramId || ""}
              onChange={(e) => set("telegramId", e.target.value)}
            />
          </label>

          <label className="text-sm md:col-span-3">
            Должность
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={v.position || ""}
              onChange={(e) => set("position", e.target.value)}
            />
          </label>

          {/* поля как у бота */}
          <label className="text-sm">
            Телефон
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={v.phone || ""}
              onChange={(e) => set("phone", e.target.value)}
            />
          </label>
          <label className="text-sm md:col-span-2">
            Адрес
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={v.address || ""}
              onChange={(e) => set("address", e.target.value)}
            />
          </label>
          <label className="text-sm md:col-span-3">
            Паспорт
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={v.passport || ""}
              onChange={(e) => set("passport", e.target.value)}
            />
          </label>

          <div className="md:col-span-3 rounded-xl border p-3 space-y-2">
            <div className="text-sm font-medium">Доступ к проектам</div>
            <AccessChecklist
              options={allProjects
                .slice()
                .sort((a, b) =>
                  String(a.name || "").localeCompare(String(b.name || ""), "ru")
                )
                .map((p) => ({
                  id: p._id as string,
                  label: p.name || String(p._id || ""),
                }))}
              value={(v.accessProjects as string[]) || []}
              onChange={(ids) => set("accessProjects", ids)}
              emptyText="Нет проектов"
            />
          </div>
        </div>
      );

    if (entity === "task")
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="text-sm md:col-span-2">
            Заголовок
            <input
              className="w-full rounded-xl border px-3 py-2"
              value={v.title || ""}
              onChange={(e) => set("title", e.target.value)}
            />
          </label>
          <label className="text-sm">
            Статус
            <select
              className="w-full rounded-xl border px-3 py-2"
              value={v.status || "new"}
              onChange={(e) => set("status", e.target.value)}
            >
              <option value="new">Новая</option>
              <option value="in_progress">В работе</option>
              <option value="done">Готово</option>
            </select>
          </label>

          <label className="text-sm md:col-span-3">
            Проект
            <select
              className="w-full rounded-xl border px-3 py-2"
              value={v.projectId ?? v.project_id ?? ""}
              onChange={(e) => set("projectId", e.target.value)}
            >
              <option value="">— без проекта —</option>
              {allProjects
                .slice()
                .sort((a, b) =>
                  String(a.name || "").localeCompare(String(b.name || ""), "ru")
                )
                .map((p) => (
                  <option key={String(p._id)} value={String(p._id)}>
                    {p.name || String(p._id || "")}
                  </option>
                ))}
            </select>
          </label>
        </div>
      );

    return null;
  }

  async function save() {
    try {
      setErr(null);
      const payload = { ...(edit || {}) };
      if (payload.extra == null) payload.extra = {};

      if (entity === "person") {
        payload.accessProjects = Array.isArray(payload.accessProjects)
          ? payload.accessProjects
          : [];
      }
      if (entity === "project") {
        payload.accessPersons = Array.isArray(payload.accessPersons)
          ? payload.accessPersons
          : [];
      }

      const body = JSON.stringify(payload);

      let saved: any;
      if (edit._id) {
        saved = await api(`/api/${entity}/${edit._id}`, { method: "PATCH", body });
      } else {
        saved = await api(`/api/${entity}`, { method: "POST", body });
      }

      if (entity === "person") {
        const personId = saved?._id || edit?._id;
        await api(`/api/person/${personId}/access`, {
          method: "POST",
          body: JSON.stringify({ projectIds: payload.accessProjects || [] }),
        });
      }
      if (entity === "project") {
        const projectId = saved?._id || edit?._id;
        await api(`/api/project/${projectId}/access`, {
          method: "POST",
          body: JSON.stringify({ personIds: payload.accessPersons || [] }),
        });
      }

      setEdit(null);
      await load();
    } catch (e: any) {
      setErr(e.message || "Ошибка сохранения");
    }
  }

  async function toggleArchive(it: any) {
    const next = !!it.archived ? false : true;
    await api(`/api/${entity}/${it._id}`, {
      method: "PATCH",
      body: JSON.stringify({ archived: next }),
    });
    await load();
  }

  const newDefaults: Record<string, any> = {
    project: {
      name: "",
      description: "",
      extra: {},
      accessPersons: [],
      address: "",
      latitude: "",
      longitude: "",
      ask_location: true,
    },
    person: {
      lastName: "",
      firstName: "",
      middleName: "",
      email: "",
      telegramId: "",
      position: "",
      phone: "",
      address: "",
      passport: "",
      extra: {},
      accessProjects: [],
    },
    task: { title: "", status: "new", extra: {}, projectId: "" },
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          placeholder="Поиск"
          className="rounded-xl border px-3 py-2"
          value={query.q ?? ""}
          onChange={(e) =>
            setQuery((prev: any) => ({ ...prev, q: e.target.value, page: 1 }))
          }
        />

        <div className="ml-auto flex gap-2">
          <button
            className="rounded-xl border px-3 py-2"
            onClick={() => setEdit(newDefaults[entity])}
          >
            + Добавить
          </button>
        </div>
      </div>

      <div className="rounded-2xl border max-h-[70vh] overflow-auto">
        <table className="w-full text-sm zebra">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="p-2 text-left">№</th>
              <th className="p-2 text-left">Основное</th>
              <th className="p-2 text-left">Обновлено</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((it, idx) => {
              const extraLine =
                entity === "person"
                  ? `Доступ к : ${
                      Array.isArray(it.accessProjects) ? it.accessProjects.length : 0
                    } проектам`
                  : entity === "project"
                  ? `${
                      Array.isArray(it.accessPersons) ? it.accessPersons.length : 0
                    } Сотрудников с доступом`
                  : "";

              const onRowClick = () => {
                if (entity === "project" && onOpenProject && it._id) {
                  onOpenProject(String(it._id));
                  return;
                }
                setEdit(it);
              };

              return (
                <tr
                  key={it._id || `${idx}`}
                  className="border-t hover:bg-muted/30 cursor-pointer"
                  onClick={onRowClick}
                >
                  <td className="p-2 align-top">{it.seq ?? idx + 1}</td>
                  <td className="p-2 align-top">
                    {entity === "project" && (
                      <div className="flex items-start justify-between gap-3">
                        <div className="font-medium truncate">
                          {it.name || "Без названия"}
                        </div>

                        <div className="text-xs text-muted-foreground text-right flex-1 flex justify-end flex-wrap gap-x-3 gap-y-0.5">
                          {it.description && (
                            <span className="truncate max-w-[24ch]">
                              {it.description}
                            </span>
                          )}
                          {(it.address || (it.latitude && it.longitude)) && (
                            <span className="truncate max-w-[28ch]">
                              {it.address
                                ? it.address
                                : it.latitude && it.longitude
                                ? `(${it.latitude}, ${it.longitude})`
                                : ""}
                            </span>
                          )}
                          {it.ask_location && <span>запрашивать гео</span>}
                          <span>
                            {Array.isArray(it.accessPersons)
                              ? it.accessPersons.length
                              : 0}{" "}
                            сотрудников с доступом
                          </span>
                        </div>
                      </div>
                    )}

                    {entity === "person" && (
                      <div>
                        <div className="font-medium">{fio(it) || "(Без имени)"}</div>
                        <div className="text-muted-foreground">
                          {it.email || ""}
                          {it.position ? ` * ${it.position}` : ""}
                          {it.phone ? ` * ${it.phone}` : ""}
                          {it.telegramId ? ` * tg:${it.telegramId}` : ""}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {extraLine}
                        </div>
                      </div>
                    )}

                    {entity === "task" && (
                      <div>
                        <div className="font-medium">
                          {it.title || "Без названия"}
                        </div>
                        <div className="text-muted-foreground">{it.status}</div>
                      </div>
                    )}
                  </td>

                  <td className="p-2 align-top">
                    {formatDateTimeRu(it.updatedAt || it.createdAt)}
                  </td>

                  <td className="p-2 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        className={iconBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEdit(it);
                        }}
                        title="Изменить"
                        aria-label="Изменить"
                      >
                        <Icon.Pencil />
                      </button>

                      <button
                        className={iconBtn}
                        onClick={async (e) => {
                          e.stopPropagation();
                          await toggleArchive(it);
                        }}
                        title={!!it.archived ? "Убрать из архива" : "В архив"}
                        aria-label={!!it.archived ? "Убрать из архива" : "В архив"}
                      >
                        {!!it.archived ? <Icon.Unarchive /> : <Icon.Archive />}
                      </button>

                      <button
                        className={`${iconBtn} border-red-200 hover:bg-red-50 text-red-600`}
                        onClick={async (e) => {
                          e.stopPropagation();
                          await api(`/api/${entity}/${it._id}`, { method: "DELETE" });
                          load();
                        }}
                        title="Удалить"
                        aria-label="Удалить"
                      >
                        <Icon.Trash />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {rows.length === 0 && (
              <tr>
                <td className="p-4 text-center text-muted-foreground" colSpan={4}>
                  Данных нет
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Модал */}
      {edit && (
        <div className="fixed inset-0 bg-black/40 z-50 overflow-y-auto">
          <div className="min-h-full flex items-start justify-center p-4">
            <div className="w-full max-w-3xl rounded-2xl border bg-background p-4 space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="text-lg font-semibold">
                {edit._id ? "Карточка" : "Создание"} -{" "}
                {entity === "person"
                  ? fio(edit) || "Без имени"
                  : edit.title || edit.name || "Без названия"}
              </div>

              {err && <div className="text-red-600 text-sm">{err}</div>}

              {coreFieldsForm()}

              {/* Документы сотрудника */}
              {entity === "person" && edit?._id && (
                <div className="rounded-xl border p-3 space-y-3">
                  <div className="text-sm font-medium">Документы</div>

                  {pFilesErr && (
                    <div className="text-sm text-red-600">{pFilesErr}</div>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      className="rounded-xl border px-3 py-2 text-sm"
                      value={pFilesKind}
                      onChange={(e) => setPFilesKind(e.target.value)}
                      disabled={pFilesBusy}
                    >
                      <option value="passport">Паспорт</option>
                      <option value="registration">Прописка</option>
                      <option value="face">Фото лица</option>
                      <option value="other">Другое</option>
                    </select>

                    <input
                      className="rounded-xl border px-3 py-2 text-sm flex-1 min-w-[220px]"
                      placeholder="Описание (необязательно)"
                      value={pFilesDesc}
                      onChange={(e) => setPFilesDesc(e.target.value)}
                      disabled={pFilesBusy}
                    />

                    <label className="rounded-xl border px-3 py-2 text-sm cursor-pointer hover:bg-muted/40">
                      {pFilesBusy ? "Загрузка..." : "Загрузить файл"}
                      <input
                        type="file"
                        className="hidden"
                        disabled={pFilesBusy}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          e.currentTarget.value = "";
                          if (f) onUploadPersonFile(f);
                        }}
                      />
                    </label>
                  </div>

                  <div className="max-h-56 overflow-auto rounded-xl border">
                    {pFiles.length === 0 ? (
                      <div className="p-3 text-sm text-muted-foreground">
                        Документов нет
                      </div>
                    ) : (
                      <div className="divide-y">
                        {pFiles.map((f) => (
                          <div
                            key={f._id}
                            className="p-2 flex items-center gap-2"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="text-sm truncate">
                                {f.origName || f._id}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {f.kind ? `тип: ${f.kind}` : ""}
                                {f.uploadedAt ? ` • ${formatDateTimeRu(f.uploadedAt)}` : ""}
                              </div>
                              {f.description ? (
                                <div className="text-xs text-muted-foreground truncate">
                                  {f.description}
                                </div>
                              ) : null}
                            </div>

                            <button
                              className={iconBtn}
                              onClick={() => onDownloadPersonFile(f._id, f.origName)}
                              title="Скачать"
                              aria-label="Скачать"
                            >
                              ⬇
                            </button>

                            <button
                              className={`${iconBtn} border-red-200 hover:bg-red-50 text-red-600`}
                              onClick={() => onDeletePersonFile(f._id)}
                              title="Удалить"
                              aria-label="Удалить"
                            >
                              <Icon.Trash />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <DynamicForm
                key={`df-${entity}-${edit?._id || "new"}`}
                entity={entity}
                value={edit}
                onChange={setEdit}
              />

              <div className="flex justify-between">
                <button
                  className="rounded-xl border px-4 py-2"
                  onClick={async () => {
                    await toggleArchive(edit);
                    setEdit(null);
                  }}
                >
                  {!!edit.archived ? "Вернуть из архива" : "В архив"}
                </button>
                <div className="flex gap-2">
                  <button
                    className="rounded-xl border px-4 py-2"
                    onClick={() => setEdit(null)}
                  >
                    Закрыть
                  </button>
                  <button className="rounded-xl border px-4 py-2" onClick={save}>
                    Сохранить
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* = мультивыбор = */

function AccessChecklist({
  options,
  value,
  onChange,
  emptyText = "Пусто",
}: {
  options: { id: string; label: string }[];
  value: string[];
  onChange: (ids: string[]) => void;
  emptyText?: string;
}) {
  const set = (id: string, checked: boolean) => {
    if (checked) onChange(Array.from(new Set([...(value || []), id])));
    else onChange((value || []).filter((x) => x !== id));
  };

  const allIds = useMemo(() => options.map((o) => o.id), [options]);
  const allChecked = (value || []).length > 0 && allIds.every((id) => value.includes(id));

  const toggleAll = () => {
    if (allChecked) onChange([]);
    else onChange(allIds);
  };

  return (
    <div className="space-y-2">
      {options.length === 0 ? (
        <div className="text-xs text-muted-foreground">{emptyText}</div>
      ) : (
        <>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={allChecked} onChange={toggleAll} />
            Выбрать все
          </label>
          <div className="max-h-60 overflow-auto rounded-xl border p-2">
            {options.map((op) => (
              <label key={op.id} className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  checked={(value || []).includes(op.id)}
                  onChange={(e) => set(op.id, e.target.checked)}
                />
                <span className="truncate">{op.label}</span>
              </label>
            ))}
          </div>
        </>
      )}
    </div>
  );
}