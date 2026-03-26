import { useEffect, useMemo, useState } from "react";
import { Projects, Tasks, ProjectFiles, api, apiBlob } from "../lib/api";
import { formatDateTimeRu } from "../lib/dates";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { createPortal } from "react-dom";

import SpecsTab from "../components/SpecsTab";
import SpecsShipmentTab from "../components/SpecsShipmentTab";
import SpecsExecutionTab from "../components/SpecsExecutionTab";
import SpecsSummaryTab from "../components/SpecsSummaryTab";
import SpecsVorTab from "../components/SpecsVorTab";

/* иконки */
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
      <path
        fill="currentColor"
        d="M3 3h18v4H3V3zm2 6h14v12H5V9zm3 3v2h8v-2H8z"
      />
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
  MapPin: (p: any) => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden {...p}>
      <path
        fill="currentColor"
        d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"
      />
    </svg>
  ),
  Check: (p: any) => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden {...p}>
      <path
        fill="currentColor"
        d="M9 16.2l-3.5-3.5-1.4 1.4L9 19 20.3 7.7l-1.4-1.4z"
      />
    </svg>
  ),
  X: (p: any) => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden {...p}>
      <path
        fill="currentColor"
        d="M18.3 5.7L12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3z"
      />
    </svg>
  ),
  Calendar: (p: any) => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden {...p}>
      <path
        fill="currentColor"
        d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 14H5V9h14v9Z"
      />
    </svg>
  ),
  CalendarCheck: (p: any) => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden {...p}>
      <path
        fill="currentColor"
        d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 14H5V9h14v9Zm-8.2-3.3-2.1-2.1-1.4 1.4 2.8 2.8a1 1 0 0 0 1.4 0l5-5-1.4-1.4-4.3 4.3Z"
      />
    </svg>
  ),
  CalendarDays: (p: any) => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden {...p}>
      <path
        fill="currentColor"
        d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 14H5V9h14v9ZM7 11h2v2H7v-2Zm4 0h2v2h-2v-2Zm4 0h2v2h-2v-2ZM7 15h2v2H7v-2Zm4 0h2v2h-2v-2Zm4 0h2v2h-2v-2Z"
      />
    </svg>
  ),
};

const iconBtn =
  "inline-flex items-center justify-center rounded-md border w-8 h-8 text-foreground/80 hover:text-foreground hover:bg-muted transition";

/* типы */

type Task = {
  _id: string;
  title?: string;
  status?: string;
  updatedAt?: string;
  archived?: boolean;
};

type Person = {
  _id: string;
  lastName?: string;
  firstName?: string;
  middleName?: string;
  email?: string;
};

type FileItem = {
  _id?: string;
  id?: string;
  name?: string;
  originalName?: string;
  size?: number;
  createdAt?: string;
  uploadedAt?: string;
};

function fio(p: Person) {
  return [p?.lastName, p?.firstName, p?.middleName].filter(Boolean).join(" ");
}

/* чеклист */

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
  const allIds = useMemo(() => options.map((o) => o.id), [options]);
  const allChecked =
    (value || []).length > 0 && allIds.every((id) => value.includes(id));

  const toggleAll = () => onChange(allChecked ? [] : allIds);

  const set = (id: string, checked: boolean) =>
    onChange(
      checked
        ? Array.from(new Set([...(value || []), id]))
        : (value || []).filter((x) => x !== id)
    );

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
          <div className="max-h-[52vh] overflow-auto rounded-xl border p-2">
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

export default function ProjectViewPage({
  projectId,
  onBack,
}: {
  projectId: string;
  onBack: () => void;
}) {
  const [project, setProject] = useState<any>(null);

  const [tab, setTab] = useState<
    "tasks" | "access" | "files" | "worklog" | "specs"
  >("specs");

  // режим внутри вкладки Спецификации
  const [specMode, setSpecMode] = useState<
    "editor" | "shipment" | "execution" | "summary" | "vor"
  >("editor");

  // задачи
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState({
    title: "",
    status: "new" as "new" | "in_progress" | "done",
  });

  async function createTask() {
    const title = newTask.title.trim();
    if (!title) return;
    await api("/api/task", {
      method: "POST",
      body: JSON.stringify({
        title,
        status: newTask.status,
        projectId,
      }),
    });
    setNewTask({ title: "", status: "new" });
    await loadTasks();
  }

  // доступы
  const [allPersons, setAllPersons] = useState<Person[]>([]);
  const [accessIds, setAccessIds] = useState<string[]>([]);

  // файлы
  const [files, setFiles] = useState<FileItem[]>([]);
  const [uploading, setUploading] = useState(false);

  // О проекте / Адрес
  const [geoOpen, setGeoOpen] = useState(false);
  const [projectModalTab, setProjectModalTab] = useState<"about" | "address">(
    "about"
  );

  const [geoForm, setGeoForm] = useState({
    // вкладка "О проекте"
    name: "",
    start_date: "",
    end_date: "",
    investor: "",
    customer: "",
    executor: "",
    responsible_id: "",
    // вкладка "Адрес"
    address: "",
    latitude: "",
    longitude: "",
    ask_location: true,
    radius_m: 350,
  });

  useEffect(() => {
    if (!project) return;
    setGeoForm({
      // О проекте
      name: project.name || "",
      start_date: project.start_date
        ? String(project.start_date).slice(0, 10)
        : "",
      end_date: project.end_date ? String(project.end_date).slice(0, 10) : "",
      investor: project.investor || "",
      customer: project.customer || "",
      executor: project.executor || "",
      responsible_id: project.responsible_id || "",
      // Адрес
      address: project.address || "",
      latitude: String(project.latitude ?? ""),
      longitude: String(project.longitude ?? ""),
      ask_location: !!project.ask_location,
      radius_m: Number(project.radius_m ?? 350),
    });
  }, [project]);

  async function loadProject() {
    const p = await Projects.get(projectId);
    setProject(p);
    setAccessIds(Array.isArray(p?.accessPersons) ? p.accessPersons : []);
  }

  async function loadTasks() {
    const res = await Tasks.list({
      projectId,
      archived: 0,
      limit: 1000,
      sort: "-updatedAt",
    });
    setTasks(res.items || []);
  }

  async function loadPersons() {
    const res = await api<any>("/api/person?archived=0&limit=2000");
    const items = Array.isArray(res?.items)
      ? res.items
      : Array.isArray(res)
      ? res
      : [];
    setAllPersons(items);
  }

  async function loadFiles() {
    const res = await ProjectFiles.list(projectId);
    const items = Array.isArray(res?.items)
      ? res.items
      : Array.isArray(res)
      ? res
      : [];
    setFiles(items);
  }

  useEffect(() => {
    loadProject();
    loadTasks();
    loadPersons();
    loadFiles();
  }, [projectId]);

  // задачи
  async function toggleTaskArchive(t: Task) {
    await api(`/api/task/${t._id}`, {
      method: "PATCH",
      body: JSON.stringify({ archived: !t.archived }),
    });
    await loadTasks();
  }

  async function removeTask(t: Task) {
    if (!confirm("Удалить задачу?")) return;
    await api(`/api/task/${t._id}`, {
      method: "DELETE",
    });
    await loadTasks();
  }

  // доступы
  async function saveAccess() {
    await api(`/api/project/${projectId}/access`, {
      method: "POST",
      body: JSON.stringify({ personIds: accessIds }),
    });
    await loadProject();
    alert("Сохранено");
  }

  // файлы
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      setUploading(true);
      await ProjectFiles.upload(projectId, f);
      await loadFiles();
      e.target.value = "";
    } finally {
      setUploading(false);
    }
  }

  async function openFile(file: FileItem) {
    const id = String(file._id || file.id);
    if (!id) return;
    const blob = await apiBlob(`/api/files/${id}`);
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  async function removeFile(file: FileItem) {
    const id = String(file._id || file.id);
    if (!id) return;
    const name = file.name || file.originalName || id;
    if (!confirm(`Удалить файл «${name}»?`)) return;
    await ProjectFiles.delete(id);
    await loadFiles();
  }

  // люди для чеклиста
  const personsOptions = useMemo(
    () =>
      allPersons.map((p) => ({
        id: p._id!,
        label: fio(p) || p.email || p._id,
      })),
    [allPersons]
  );

  // карты (ссылки - показываем в модалке)
  const mapLinks = (() => {
    const lat = project?.latitude;
    const lon = project?.longitude;
    if (lat == null || lon == null || lat === "" || lon === "") return null;

    const yandex = `https://yandex.ru/maps/?text=${encodeURIComponent(
      `${lat},${lon}`
    )}`;
    const google = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${lat},${lon}`
    )}`;
    return { yandex, google };
  })();

  async function saveGeo() {
    const payload: any = {
      // О проекте
      name: geoForm.name || "",
      start_date: geoForm.start_date || "",
      end_date: geoForm.end_date || "",
      investor: geoForm.investor || "",
      customer: geoForm.customer || "",
      executor: geoForm.executor || "",
      responsible_id: geoForm.responsible_id || "",
      // Адрес
      address: geoForm.address || "",
      ask_location: !!geoForm.ask_location,
      radius_m: Number(geoForm.radius_m) || 350,
    };

    const lat = geoForm.latitude?.toString().trim();
    const lon = geoForm.longitude?.toString().trim();
    payload.latitude = lat === "" ? "" : Number(lat);
    payload.longitude = lon === "" ? "" : Number(lon);

    await api(`/api/project/${projectId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    await loadProject();
    setGeoOpen(false);
  }

  return (
    <div className="space-y-4">
      {/* Шапка */}
      <div className="flex items-start gap-3 flex-wrap">
        <button
          className="rounded-xl border px-3 py-2 mt-1"
          onClick={onBack}
          type="button"
        >
          ← Назад
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-semibold truncate">
              {project?.name || "Проект"}{" "}
            </div>

            {/* гео-кнопка + вкладки */}
            <div className="rounded-md px-2 py-1 inline-flex items-center gap-1">
              <button
                className="rounded-md border px-2 py-1 inline-flex items-center gap-1"
                onClick={() => {
                  setProjectModalTab("about");
                  setGeoOpen(true);
                }}
                type="button"
              >
                <Icon.MapPin />
                О проекте
              </button>
            </div>

            <div className="flex items-center gap-2 ml-2 flex-wrap">
              <button
                type="button"
                className={`rounded-xl border px-3 py-1 ${
                  tab === "specs" ? "bg-muted/50" : ""
                }`}
                onClick={() => setTab("specs")}
              >
                Спецификации
              </button>
              <button
                type="button"
                className={`rounded-xl border px-3 py-1 ${
                  tab === "tasks" ? "bg-muted/50" : ""
                }`}
                onClick={() => setTab("tasks")}
              >
                Задачи
              </button>
              <button
                type="button"
                className={`rounded-xl border px-3 py-1 ${
                  tab === "access" ? "bg-muted/50" : ""
                }`}
                onClick={() => setTab("access")}
              >
                Сотрудники с доступом
              </button>
              <button
                type="button"
                className={`rounded-xl border px-3 py-1 ${
                  tab === "files" ? "bg-muted/50" : ""
                }`}
                onClick={() => setTab("files")}
              >
                Диск
              </button>
              <button
                type="button"
                className={`rounded-xl border px-3 py-1 ${
                  tab === "worklog" ? "bg-muted/50" : ""
                }`}
                onClick={() => setTab("worklog")}
              >
                Журнал работ
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* содержимое вкладок */}
      {tab === "tasks" && (
        <>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <input
              className="rounded-xl border px-3 py-2 text-sm w-full md:w-1/2"
              placeholder="Новая задача…"
              value={newTask.title}
              onChange={(e) =>
                setNewTask((t) => ({ ...t, title: e.target.value }))
              }
            />
            <select
              className="rounded-xl border px-3 py-2 text-sm"
              value={newTask.status}
              onChange={(e) =>
                setNewTask((t) => ({
                  ...t,
                  status: e.target.value as "new" | "in_progress" | "done",
                }))
              }
            >
              <option value="new">Новая</option>
              <option value="in_progress">В работе</option>
              <option value="done">Готово</option>
            </select>
            <button
              type="button"
              className="rounded-xl border px-3 py-2 text-sm"
              onClick={createTask}
            >
              + Добавить
            </button>
          </div>

          <div className="rounded-2xl border overflow-auto">
            <table className="w-full text-sm zebra">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="p-2 text-left">№</th>
                  <th className="p-2 text-left">Название</th>
                  <th className="p-2 text-left">Статус</th>
                  <th className="p-2 text-left">Обновлено</th>
                  <th className="p-2 text-left w-24" />
                </tr>
              </thead>
              <tbody>
                {tasks.map((t, i) => (
                  <tr key={t._id} className="border-t">
                    <td className="p-2 align-top">{i + 1}</td>
                    <td className="p-2 align-top">
                      {t.title || "(без названия)"}
                    </td>
                    <td className="p-2 align-top">{t.status || ""}</td>
                    <td className="p-2 align-top">
                      {formatDateTimeRu(t.updatedAt)}
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className={iconBtn}
                          title={t.archived ? "Убрать из архива" : "В архив"}
                          aria-label={
                            t.archived ? "Убрать из архива" : "В архив"
                          }
                          onClick={() => toggleTaskArchive(t)}
                        >
                          {t.archived ? <Icon.Unarchive /> : <Icon.Archive />}
                        </button>
                        <button
                          type="button"
                          className={`${iconBtn} border-red-200 hover:bg-red-50 text-red-600`}
                          title="Удалить"
                          aria-label="Удалить"
                          onClick={() => removeTask(t)}
                        >
                          <Icon.Trash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {tasks.length === 0 && (
                  <tr>
                    <td
                      className="p-4 text-center text-muted-foreground"
                      colSpan={5}
                    >
                      Задач нет
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "access" && (
        <div className="rounded-2xl border p-3 space-y-3">
          <div className="text-sm font-medium">Сотрудники с доступом</div>
          <AccessChecklist
            options={personsOptions}
            value={accessIds}
            onChange={setAccessIds}
            emptyText="Нет сотрудников"
          />
          <div className="text-right">
            <button
              type="button"
              className="rounded-xl border px-3 py-2"
              onClick={saveAccess}
            >
              Сохранить
            </button>
          </div>
        </div>
      )}

      {tab === "files" && (
        <div className="space-y-3">
          <input type="file" onChange={handleUpload} disabled={uploading} />
          <div className="rounded-2xl border overflow-auto">
            <table className="w-full text-sm zebra">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="p-2 text-left">Имя файла</th>
                  <th className="p-2 text-left">Размер</th>
                  <th className="p-2 text-left">Загружен</th>
                  <th className="p-2 text-left w-20" />
                </tr>
              </thead>
              <tbody>
                {files.map((f) => {
                  const id = String(f._id || f.id);
                  const name = f.name || f.originalName || id;
                  const sizeMb =
                    (Number(f.size || 0) / (1024 * 1024)).toFixed(2) + " МБ";
                  const dt = formatDateTimeRu(f.uploadedAt || f.createdAt);
                  return (
                    <tr key={id} className="border-t">
                      <td className="p-2">
                        <button
                          type="button"
                          className="underline hover:no-underline"
                          onClick={() => openFile(f)}
                        >
                          {name}
                        </button>
                      </td>
                      <td className="p-2">{sizeMb}</td>
                      <td className="p-2">{dt}</td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className={`${iconBtn} border-red-200 hover:bg-red-50 text-red-600`}
                            title="Удалить"
                            aria-label="Удалить"
                            onClick={() => removeFile(f)}
                          >
                            <Icon.Trash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {files.length === 0 && (
                  <tr>
                    <td
                      className="p-4 text-center text-muted-foreground"
                      colSpan={4}
                    >
                      Файлов нет
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "worklog" && <WorkLogInline projectId={projectId} />}

      {tab === "specs" && (
        <div className="space-y-3">
          {/* подвкладки внутри "Спецификации" */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`rounded-xl border px-3 py-1 text-sm ${
                specMode === "summary" ? "bg-muted/60" : ""
              }`}
              onClick={() => setSpecMode("summary")}
            >
              Свод
            </button>
            <button
              type="button"
              className={`rounded-xl border px-3 py-1 text-sm ${
                specMode === "editor" ? "bg-muted/60" : ""
              }`}
              onClick={() => setSpecMode("editor")}
            >
              Спецификация
            </button>
            <button
              type="button"
              className={`rounded-xl border px-3 py-1 text-sm ${
                specMode === "shipment" ? "bg-muted/60" : ""
              }`}
              onClick={() => setSpecMode("shipment")}
            >
              Отгрузка
            </button>
            <button
              type="button"
              className={`rounded-xl border px-3 py-1 text-sm ${
                specMode === "execution" ? "bg-muted/60" : ""
              }`}
              onClick={() => setSpecMode("execution")}
            >
              Выполнение
            </button>
            <button
              type="button"
              className={`rounded-xl border px-3 py-1 text-sm ${
                specMode === "vor" ? "bg-muted/60" : ""
              }`}
              onClick={() => setSpecMode("vor")}
            >
              ВОР
            </button>
          </div>
          {specMode === "summary" && <SpecsSummaryTab projectId={projectId} />}
          {specMode === "editor" && <SpecsTab projectId={projectId} />}
          {specMode === "shipment" && <SpecsShipmentTab projectId={projectId} />}
          {specMode === "execution" && <SpecsExecutionTab projectId={projectId} />}
          {specMode === "vor" && <SpecsVorTab projectId={projectId} />}
        </div>
      )}

      {/* О проекте / Адрес */}
      {geoOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setGeoOpen(false)}
          />
          <div className="relative w-[min(720px,96vw)] rounded-2xl bg-background p-6 shadow-2xl space-y-4">
            {/* заголовок */}
            <div className="text-lg font-semibold inline-flex items-center gap-2">
              <Icon.MapPin />
              О проекте
            </div>

            {/* вкладки внутри модалки */}
            <div className="flex gap-2 border-b pb-2">
              <button
                type="button"
                className={`rounded-xl px-3 py-1 text-sm ${
                  projectModalTab === "about" ? "bg-muted/70 border" : ""
                }`}
                onClick={() => setProjectModalTab("about")}
              >
                О проекте
              </button>
              <button
                type="button"
                className={`rounded-xl px-3 py-1 text-sm ${
                  projectModalTab === "address" ? "bg-muted/70 border" : ""
                }`}
                onClick={() => setProjectModalTab("address")}
              >
                Адрес
              </button>
            </div>

            {/* содержимое вкладок */}
            {projectModalTab === "about" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="text-sm md:col-span-2">
                  Наименование проекта
                  <input
                    className="w-full rounded-xl border px-3 py-2 mt-1"
                    value={geoForm.name}
                    onChange={(e) =>
                      setGeoForm((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                </label>

                <label className="text-sm">
                  Дата начала
                  <input
                    type="date"
                    className="w-full rounded-xl border px-3 py-2 mt-1"
                    value={geoForm.start_date || ""}
                    onChange={(e) =>
                      setGeoForm((f) => ({
                        ...f,
                        start_date: e.target.value,
                      }))
                    }
                  />
                </label>

                <label className="text-sm">
                  Дата окончания
                  <input
                    type="date"
                    className="w-full rounded-xl border px-3 py-2 mt-1"
                    value={geoForm.end_date || ""}
                    onChange={(e) =>
                      setGeoForm((f) => ({
                        ...f,
                        end_date: e.target.value,
                      }))
                    }
                  />
                </label>

                <label className="text-sm md:col-span-2">
                  Инвестор
                  <input
                    className="w-full rounded-xl border px-3 py-2 mt-1"
                    value={geoForm.investor}
                    onChange={(e) =>
                      setGeoForm((f) => ({
                        ...f,
                        investor: e.target.value,
                      }))
                    }
                  />
                </label>

                <label className="text-sm md:col-span-2">
                  Заказчик
                  <input
                    className="w-full rounded-xl border px-3 py-2 mt-1"
                    value={geoForm.customer}
                    onChange={(e) =>
                      setGeoForm((f) => ({
                        ...f,
                        customer: e.target.value,
                      }))
                    }
                  />
                </label>

                <label className="text-sm md:col-span-2">
                  Исполнитель
                  <input
                    className="w-full rounded-xl border px-3 py-2 mt-1"
                    value={geoForm.executor}
                    onChange={(e) =>
                      setGeoForm((f) => ({
                        ...f,
                        executor: e.target.value,
                      }))
                    }
                  />
                </label>

                <label className="text-sm md:col-span-2">
                  Ответственный
                  <select
                    className="w-full rounded-xl border px-3 py-2 mt-1"
                    value={geoForm.responsible_id ?? ""}
                    onChange={(e) =>
                      setGeoForm((f) => ({
                        ...f,
                        responsible_id: e.target.value || "",
                      }))
                    }
                  >
                    <option value="">— не выбран —</option>
                    {personsOptions.map((p) => (
                      <option key={String(p.id)} value={String(p.id)}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            {projectModalTab === "address" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="text-sm md:col-span-2">
                  Адрес
                  <input
                    className="w-full rounded-xl border px-3 py-2 mt-1"
                    value={geoForm.address}
                    onChange={(e) =>
                      setGeoForm((f) => ({ ...f, address: e.target.value }))
                    }
                  />
                </label>

                <label className="text-sm">
                  Широта
                  <input
                    className="w-full rounded-xl border px-3 py-2 mt-1"
                    inputMode="decimal"
                    placeholder="55.7558"
                    value={geoForm.latitude}
                    onChange={(e) =>
                      setGeoForm((f) => ({ ...f, latitude: e.target.value }))
                    }
                  />
                </label>

                <label className="text-sm">
                  Долгота
                  <input
                    className="w-full rounded-xl border px-3 py-2 mt-1"
                    inputMode="decimal"
                    placeholder="37.6176"
                    value={geoForm.longitude}
                    onChange={(e) =>
                      setGeoForm((f) => ({ ...f, longitude: e.target.value }))
                    }
                  />
                </label>

                {mapLinks && (
                  <div className="md:col-span-2 text-xs text-muted-foreground">
                    Открыть в картах:{" "}
                    <a
                      href={mapLinks.yandex}
                      target="_blank"
                      rel="noreferrer"
                      className="underline hover:no-underline"
                    >
                      Яндекс.Карты
                    </a>{" "}
                    {" · "}
                    <a
                      href={mapLinks.google}
                      target="_blank"
                      rel="noreferrer"
                      className="underline hover:no-underline"
                    >
                      Google Maps
                    </a>
                  </div>
                )}

                <label className="text-sm md:col-span-2">
                  Радиус (м)
                  <input
                    type="number"
                    min={10}
                    max={5000}
                    step={10}
                    className="w-full rounded-xl border px-3 py-2 mt-1"
                    value={geoForm.radius_m}
                    onChange={(e) =>
                      setGeoForm((f) => ({
                        ...f,
                        radius_m: Math.max(
                          10,
                          Math.min(5000, Number(e.target.value) || 0)
                        ),
                      }))
                    }
                  />
                  <span className="text-xs text-muted-foreground">
                    Радиус допуска (10-5000)
                  </span>
                </label>

                <label className="flex items-center gap-2 md:col-span-2 text-sm">
                  <input
                    type="checkbox"
                    checked={geoForm.ask_location}
                    onChange={(e) =>
                      setGeoForm((f) => ({
                        ...f,
                        ask_location: e.target.checked,
                      }))
                    }
                  />
                  Запрашивать геолокацию у проекта
                </label>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded-xl border px-4 py-2 inline-flex items-center gap-2"
                onClick={() => setGeoOpen(false)}
              >
                <Icon.X />
                Закрыть
              </button>
              <button
                type="button"
                className="rounded-xl border px-4 py-2 inline-flex items-center gap-2 bg-muted/50"
                onClick={saveGeo}
              >
                <Icon.Check />
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* WorkLogInline */

function WorkLogInline({ projectId }: { projectId: string }) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [newWork, setNewWork] = useState("");
  const [works, setWorks] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [daysWithWorks, setDaysWithWorks] = useState<string[]>([]);
  const [daysWithReports, setDaysWithReports] = useState<string[]>([]);
  const [calOpen, setCalOpen] = useState(false);

  // хелперы
  const ymd = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const ymdEnd = (d: Date) => `${ymd(d)}T23:59:59`;

  const dateStr = ymd(selectedDate);
  const human = dateStr.split("-").reverse().join(".");

  // загрузки 
  async function load() {
    setLoading(true);
    try {
      const [w, r] = await Promise.all([
        api<{ items: any[] }>(
          `/api/projects/${projectId}/worklog?date=${dateStr}`
        ),
        api<{ items: any[] }>(
          `/api/reports?projectId=${projectId}` +
            `&startFrom=${dateStr}&startTo=${encodeURIComponent(
              ymdEnd(selectedDate)
            )}` +
            `&archived=0&limit=2000&page=1&sort=-start_time`
        ),
      ]);

      setWorks(Array.isArray(w.items) ? w.items : []);
      setReports(Array.isArray(r.items) ? r.items : []);
    } finally {
      setLoading(false);
    }
  }

  async function loadMarkedDays(month: Date) {
    const from = new Date(month.getFullYear(), month.getMonth(), 1);
    const to = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    const w = await api<{ dates: string[] }>(
      `/api/projects/${projectId}/worklog/dates?from=${ymd(from)}&to=${ymd(to)}`
    );
    setDaysWithWorks(Array.isArray(w?.dates) ? w.dates : []);

    const r = await api<{ items: any[] }>(
      `/api/reports?projectId=${projectId}` +
        `&startFrom=${ymd(from)}&startTo=${ymd(to)}T23:59:59` +
        `&archived=0&limit=2000&page=1&sort=-start_time`
    );

    const repDates = new Set<string>();
    (Array.isArray(r?.items) ? r.items : []).forEach((it: any) => {
      const d = it.start_time || it.date || it.createdAt;
      if (!d) return;
      const ds = (typeof d === "string" ? d : new Date(d).toISOString()).slice(
        0,
        10
      );
      repDates.add(ds);
    });
    setDaysWithReports(Array.from(repDates));
  }

  useEffect(() => {
    load();
  }, [projectId, dateStr]);

  useEffect(() => {
    loadMarkedDays(selectedDate);
  }, [projectId, selectedDate]);

  // CRUD
  async function addWork() {
    const text = newWork.trim();
    if (!text) return;
    const res = await api<{ item: any }>(
      `/api/projects/${projectId}/worklog`,
      {
        method: "POST",
        body: JSON.stringify({ text, date: dateStr }),
      }
    );
    setNewWork("");
    const item = (res as any)?.item || res;
    setWorks((prev) => (item ? [item, ...prev] : prev));
    if (!daysWithWorks.includes(dateStr))
      setDaysWithWorks((d) => [...d, dateStr]);
  }

  async function removeWork(id: string) {
    await api(`/api/projects/${projectId}/worklog/${id}`, {
      method: "DELETE",
    });
    setWorks((prev) => prev.filter((x) => String(x._id) !== String(id)));
    setTimeout(() => {
      load();
      loadMarkedDays(selectedDate);
    }, 0);
  }

  // выделяем дни с работами
  const hasWork = (day: Date) => daysWithWorks.includes(ymd(day));
  const hasReport = (day: Date) => daysWithReports.includes(ymd(day));
  const hasBoth = (day: Date) => hasWork(day) && hasReport(day);

  const modifiers = { hasWork, hasReport, hasBoth };

  // Кольца
  const modifiersStyles: any = {
    hasWork: {
      boxShadow: "inset 0 0 0 1.5px #16a34a",
      borderRadius: "9999px",
    },
    hasReport: {
      boxShadow: "inset 0 0 0 1.5px #f59e0b",
      borderRadius: "9999px",
    },
    hasBoth: {
      boxShadow:
        "inset 0 0 0 1.5px #16a34a, inset 0 0 0 3px #f59e0b",
      borderRadius: "9999px",
    },
  };

  const dayPickerStyles: any = {
    root: {
      ["--rdp-cell-size" as any]: "24px",
    },
    day: {
      borderRadius: "9999px",
    },
    day_selected: {
      background: "transparent",
      color: "inherit",
      boxShadow: "inset 0 0 0 2px #2563eb",
    },
  };

  // поповер календаря
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [calStyle, setCalStyle] = useState<React.CSSProperties>({
    position: "fixed",
    top: -9999,
    left: -9999,
    zIndex: 60,
  });

  useEffect(() => {
    if (!calOpen || !anchorEl) return;
    const r = anchorEl.getBoundingClientRect();
    setCalStyle({
      position: "fixed",
      top: r.bottom + 6,
      left: r.left,
      zIndex: 60,
      maxHeight: "70vh",
    });
  }, [calOpen, anchorEl]);

  useEffect(() => {
    if (!calOpen) return;
    const onDown = (e: MouseEvent) => {
      const pnl = document.getElementById("wl-calendar-panel");
      if (!pnl) return;
      if (pnl.contains(e.target as Node)) return;
      if (anchorEl && anchorEl.contains(e.target as Node)) return;
      setCalOpen(false);
    };
    window.addEventListener("pointerdown", onDown, true);
    return () => window.removeEventListener("pointerdown", onDown, true);
  }, [calOpen, anchorEl]);

  return (
    <div className="space-y-3">
      {/* кнопка + дата */}
      <div className="relative inline-block">
        <button
          ref={setAnchorEl as any}
          className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm hover:bg-muted/40"
          type="button"
          onClick={() => setCalOpen((v) => !v)}
        >
          <Icon.Calendar />
          {human}
        </button>
        {loading && (
          <span className="ml-2 text-sm opacity-70">Загрузка…</span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* выполненные работы */}
        <div className="rounded-2xl border overflow-hidden">
          <div className="bg-muted/50 px-3 py-2 text-sm font-medium">
            Выполненные работы ({human})
          </div>
          <div className="p-3 border-b">
            <textarea
              className="w-full rounded-xl border px-3 py-2 text-sm"
              rows={4}
              placeholder="Что сделано?…"
              value={newWork}
              onChange={(e) => setNewWork(e.target.value)}
            />
            <div className="mt-2 text-right">
              <button
                type="button"
                className="rounded-xl border px-3 py-2 text-sm hover:bg-muted/50"
                onClick={addWork}
              >
                Добавить запись
              </button>
            </div>
          </div>
          <div className="max-h-[40vh] overflow-y-auto">
            {works.length === 0 && (
              <div className="p-3 text-sm opacity-70">
                Пока нет записей.
              </div>
            )}
            {works.map((w) => (
              <div
                key={String(w._id)}
                className="border-b px-3 py-2"
              >
                <div className="text-sm whitespace-pre-wrap">
                  {w.text}
                </div>
                <div className="mt-1 flex items-center justify-between text-xs opacity-70">
                  <span>{w.authorName || "—"}</span>
                  <button
                    type="button"
                    className="hover:underline"
                    onClick={() => removeWork(String(w._id))}
                  >
                    удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* отчёты сотрудников */}
        <div className="rounded-2xl border overflow-hidden">
          <div className="bg-muted/50 px-3 py-2 text-sm font-medium">
            Отчёты сотрудников (за день)
          </div>
          <div className="max-h-[55vh] overflow-y-auto">
            {reports.length === 0 && (
              <div className="p-3 text-sm opacity-70">
                Отчётов нет.
              </div>
            )}
            {reports.map((r: any) => (
              <div
                key={String(r._id)}
                className="border-b px-3 py-2"
              >
                <div className="text-sm font-medium">
                  {r.person?.name || "Сотрудник"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {r.project?.name || ""}
                </div>
                <div className="text-sm whitespace-pre-wrap mt-1">
                  {r.text_report || ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Календарь */}
      {calOpen &&
        createPortal(
          <div
            id="wl-calendar-panel"
            style={calStyle}
            className="rounded-2xl border bg-background p-2 shadow-xl"
          >
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={(d) => {
                if (d) setSelectedDate(d);
                setCalOpen(false);
              }}
              onMonthChange={(d) => loadMarkedDays(d)}
              weekStartsOn={1}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              styles={dayPickerStyles}
            />
          </div>,
          document.body
        )}
    </div>
  );
}