import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
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
  // Новое:
  accessProjects?: string[];
};

type Project = {
  _id?: string;
  name?: string;
  description?: string;
  // Новое:
  accessPersons?: string[];
  // Геолокация + адрес + флаг запроса геолокации (для бота)
  address?: string;
  latitude?: number | string;
  longitude?: number | string;
  ask_location?: boolean;
};

/* ===== inline icons для действий ===== */
const Icon = {
  Pencil: (p: any) => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden {...p}>
      <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm14.71-9.04a1 1 0 000-1.41l-1.51-1.49a1 1 0 00-1.41 0l-1.34 1.34 3.75 3.75 1.51-1.49z"/>
    </svg>
  ),
  Archive: (p: any) => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden {...p}>
      <path fill="currentColor" d="M3 3h18v4H3V3zm2 6h14v12H5V9zm3 3v2h8v-2H8z"/>
    </svg>
  ),
  Unarchive: (p: any) => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden {...p}>
      <path fill="currentColor" d="M20 7V3H4v4h16zM6 9v10h12V9H6zm6 7l-4-4h3V9h2v3h3l-4 4z"/>
    </svg>
  ),
  Trash: (p: any) => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden {...p}>
      <path fill="currentColor" d="M6 19a2 2 0 002 2h8a2 2 0 002-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
    </svg>
  ),
  Target: (p: any) => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden {...p}>
      <path fill="currentColor" d="M12 2a1 1 0 011 1v1.06A8.004 8.004 0 0120.94 11H22a1 1 0 110 2h-1.06A8.004 8.004 0 0113 20.94V22a1 1 0 11-2 0v-1.06A8.004 8.004 0 013.06 13H2a1 1 0 110-2h1.06A8.004 8.004 0 0111 4.06V3a1 1 0 011-1zm0 4a6 6 0 100 12A6 6 0 0012 6zm0 3a3 3 0 110 6 3 3 0 010-6z"/>
    </svg>
  ),
};
const iconBtn =
  "inline-flex items-center justify-center rounded-md border w-8 h-8 text-foreground/80 hover:text-foreground hover:bg-muted transition";

export default function EntityTable({
  entity,
  archived = false,
  onOpenProject,
}: {
  entity: Entity;
  archived?: boolean;
  /** B:@KBL AB@0=8FC ?@>5:B0 ?> :;8:C =0 AB@>:C ?@>5:B0 */
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

  // !?@02>G=8:8 4;O <C;LB82K1>@0
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [allPersons, setAllPersons] = useState<Person[]>([]);

  //     0A?0:>2:0 D>@<0B0 >B25B0
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
  }, [
    entity,
    archived,
    query.page,
    query.q,
    query.status,
    query.updatedFrom,
    query.updatedTo,
  ]);

  // Подгрузка справочников
  useEffect(() => {
    (async () => {
      try {
        // Проекты нужны для person/project (доступы) и для task (селект проекта)
        if (entity === "person" || entity === "project" || entity === "task") {
          const pr = await api<any>(`/api/project?archived=0&limit=1000`);
          setAllProjects(unwrap(pr));
        }
        // Сотрудники нужны только для person/project (доступы)
        if (entity === "person" || entity === "project") {
          const pe = await api<any>(`/api/person?archived=0&limit=2000`);
          setAllPersons(unwrap(pe));
        }
      } catch {
        // молча
      }
    })();
  }, [entity]);

  function fio(it: Person) {
    return [it?.lastName, it?.firstName, it?.middleName].filter(Boolean).join(" ");
  }

  // ======= Формы "ядра" + доступы
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

          {/* Адрес (для бота) */}
          <label className="text-sm md:col-span-2">
            Адрес
            <input
              className="w-full rounded-xl border px-3 py-2"
              placeholder="г. Москва, ул. Пример, д. 1"
              value={v.address || ""}
              onChange={(e) => set("address", e.target.value)}
            />
          </label>

          {/* Геолокация */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:col-span-2">
            <label className="text-sm">
              Широта
              <input
                className="w-full rounded-xl border px-3 py-2"
                inputMode="decimal"
                placeholder=""
                value={v.latitude ?? ""}
                onChange={(e) => set("latitude", e.target.value)}
              />
            </label>
            <label className="text-sm">
              Долгота
              <input
                className="w-full rounded-xl border px-3 py-2"
                inputMode="decimal"
                placeholder=""
                value={v.longitude ?? ""}
                onChange={(e) => set("longitude", e.target.value)}
              />
            </label>
          </div>

          {/* Флаг «запрашивать геолокацию» */}
          <label className="text-sm flex items-center gap-2 md:col-span-2">
            <input
              type="checkbox"
              checked={!!v.ask_location}
              onChange={(e) => set("ask_location", e.target.checked)}
            />
            Запрашивать геолокацию у проекта
          </label>

          {/* Доступы сотрудников у проектов */}
          <div className="md:col-span-2 rounded-xl border p-3 space-y-2">
            <div className="text-sm font-medium">Сотрудники с доступом</div>
            <AccessChecklist
              // Список всех сотрудников
              options={allPersons.map((p) => ({
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

          {/* Доступ к проектам у сотрудника */}
          <div className="md:col-span-3 rounded-xl border p-3 space-y-2">
            <div className="text-sm font-medium">Доступ к проектам</div>
            <AccessChecklist
              options={allProjects.map((p) => ({
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
              {allProjects.map((p) => (
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

      // нормализуем массивы чтобы не сыпаться на null/undefined
      if (entity === "person") {
        payload.accessProjects = Array.isArray(payload.accessProjects) ? payload.accessProjects : [];
      }
      if (entity === "project") {
        payload.accessPersons = Array.isArray(payload.accessPersons) ? payload.accessPersons : [];
      }

      const body = JSON.stringify(payload);

      let saved: any;
      if (edit._id) {
        saved = await api(`/api/${entity}/${edit._id}`, { method: "PATCH", body });
      } else {
        saved = await api(`/api/${entity}`, { method: "POST", body });
      }

      // ── важное: синк связей после базового сохранения ──
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
      extra: {},
      accessProjects: [],
    },
    task: { title: "", status: "new", extra: {}, projectId: "" }, // ← projectId по умолчанию
  };

  return (
    <div className="space-y-3">
      {/* панель поиска/фильтров */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          placeholder="Поиск"
          className="rounded-xl border px-3 py-2"
          value={query.q ?? ""}
          onChange={(e) =>
            setQuery((prev: any) => ({ ...prev, q: e.target.value, page: 1 }))
          }
        />
        {entity === "task" && (
          <>
            <select
              className="rounded-xl border px-3 py-2"
              value={query.status || ""}
              onChange={(e) =>
                setQuery({ ...query, status: e.target.value, page: 1 })
              }
            >
              <option value="">Все статусы</option>
              <option value="new">Новые</option>
              <option value="in_progress">В работе</option>
              <option value="done">Готово</option>
            </select>
            <input
              type="date"
              className="rounded-xl border px-3 py-2"
              value={query.updatedFrom ?? ""}
              onChange={(e) =>
                setQuery({
                  ...query,
                  updatedFrom: e.target.value || undefined,
                  page: 1,
                })
              }
            />
            <input
              type="date"
              className="rounded-xl border px-3 py-2"
              value={query.updatedTo ?? ""}
              onChange={(e) =>
                setQuery({
                  ...query,
                  updatedTo: e.target.value || undefined,
                  page: 1,
                })
              }
            />
          </>
        )}
        <div className="ml-auto flex gap-2">
          <button
            className="rounded-xl border px-3 py-2"
            onClick={() => setEdit(newDefaults[entity])}
          >
            + Добавить
          </button>
        </div>
      </div>

      {/* Таблица */}
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
            {items.map((it, idx) => {
              const extraLine =
                entity === "person"
                  ? `Доступ к : ${Array.isArray(it.accessProjects) ? it.accessProjects.length : 0} проектам`
                  : entity === "project"
                  ? `${Array.isArray(it.accessPersons) ? it.accessPersons.length : 0} Сотрудников с доступом`
                  : "";

              // клик по строке: если проект и есть onOpenProject — открываем страницу проекта, иначе редактирование
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
                      <div>
                        <div className="font-medium">
                          {it.name || "Без названия"}
                        </div>
                        <div className="text-muted-foreground">
                          {it.description || ""}
                        </div>
                        {/* при наличии адреса/координат подскажем в списке маленькой строкой */}
                        {(it.address || (it.latitude && it.longitude)) && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {it.address ? `${it.address} · ` : ""}
                            {(it.latitude && it.longitude) ? `(${it.latitude}, ${it.longitude})` : ""}
                            {it.ask_location ? " · запрашивать гео" : ""}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">{extraLine}</div>
                      </div>
                    )}
                    {entity === "person" && (
                      <div>
                        <div className="font-medium">
                          {fio(it) || "(Без имени)"}
                        </div>
                        <div className="text-muted-foreground">
                          {it.email || ""}
                          {it.position ? ` * ${it.position}` : ""}
                          {it.telegramId ? ` * tg:${it.telegramId}` : ""}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{extraLine}</div>
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
                          await api(`/api/${entity}/${it._id}`, {
                            method: "DELETE",
                          });
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
            {items.length === 0 && (
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-2xl border bg-background p-4 space-y-4">
            <div className="text-lg font-semibold">
              {edit._id ? "Карточка" : "Создание"} -{" "}
              {entity === "person"
                ? fio(edit) || "Без имени"
                : edit.title || edit.name || "Без названия"}
            </div>

            {err && <div className="text-red-600 text-sm">{err}</div>}

            {coreFieldsForm()}

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
                <button
                  className="rounded-xl border px-4 py-2"
                  onClick={save}
                >
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===== простая чеклист-компонента для мультивыбора ===== */

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