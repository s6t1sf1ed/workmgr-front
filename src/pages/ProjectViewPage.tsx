import { useEffect, useMemo, useState } from "react";
import { Projects, Tasks, ProjectFiles, api, apiBlob } from "../lib/api";
import { formatDateTimeRu } from "../lib/dates";

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
  MapPin: (p: any) => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden {...p}>
      <path fill="currentColor" d="M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/>
    </svg>
  ),
  Check: (p: any) => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden {...p}>
      <path fill="currentColor" d="M9 16.2l-3.5-3.5-1.4 1.4L9 19 20.3 7.7l-1.4-1.4z"/>
    </svg>
  ),
  X: (p: any) => (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden {...p}>
      <path fill="currentColor" d="M18.3 5.7L12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3z"/>
    </svg>
  ),
};
const iconBtn =
  "inline-flex items-center justify-center rounded-md border w-8 h-8 text-foreground/80 hover:text-foreground hover:bg-muted transition";

/* ======== types ======== */
type Task = { _id: string; title?: string; status?: string; updatedAt?: string; archived?: boolean; };
type Person = { _id: string; lastName?: string; firstName?: string; middleName?: string; email?: string; };
type FileItem = { _id?: string; id?: string; name?: string; originalName?: string; size?: number; createdAt?: string; uploadedAt?: string; };

function fio(p: Person) { return [p?.lastName, p?.firstName, p?.middleName].filter(Boolean).join(" "); }

/* простой чеклист (оставил как было) */
function AccessChecklist({ options, value, onChange, emptyText = "Пусто" }:{
  options:{id:string;label:string}[]; value:string[]; onChange:(ids:string[])=>void; emptyText?:string;
}) {
  const allIds = useMemo(()=>options.map(o=>o.id),[options]);
  const allChecked = (value||[]).length>0 && allIds.every(id=>value.includes(id));
  const toggleAll = ()=> onChange(allChecked?[]:allIds);
  const set = (id:string, checked:boolean)=> onChange(checked?Array.from(new Set([...(value||[]),id])):(value||[]).filter(x=>x!==id));
  return (
    <div className="space-y-2">
      {options.length===0? <div className="text-xs text-muted-foreground">{emptyText}</div> : <>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={allChecked} onChange={toggleAll}/>Выбрать все</label>
        <div className="max-h-60 overflow-auto rounded-xl border p-2">
          {options.map(op=>(
            <label key={op.id} className="flex items-center gap-2 py-1">
              <input type="checkbox" checked={(value||[]).includes(op.id)} onChange={e=>set(op.id,e.target.checked)}/>
              <span className="truncate">{op.label}</span>
            </label>
          ))}
        </div>
      </>}
    </div>
  );
}

export default function ProjectViewPage({ projectId, onBack }:{ projectId:string; onBack:()=>void; }) {
  const [project, setProject] = useState<any>(null);
  const [tab, setTab] = useState<"tasks"|"access"|"files">("tasks");

  // задачи
  const [tasks, setTasks] = useState<Task[]>([]);

  // доступы
  const [allPersons, setAllPersons] = useState<Person[]>([]);
  const [accessIds, setAccessIds] = useState<string[]>([]);

  // файлы
  const [files, setFiles] = useState<FileItem[]>([]);
  const [uploading, setUploading] = useState(false);

  // гео-редактор
  const [geoOpen, setGeoOpen] = useState(false);
  const [geoForm, setGeoForm] = useState({
    address: "",
    latitude: "",
    longitude: "",
    responsible_id: "",
    ask_location: true,
    radius_m: 350,
  });
  useEffect(()=>{
    if (!project) return;
    setGeoForm({
      address: project.address || "",
      latitude: String(project.latitude ?? ""),
      longitude: String(project.longitude ?? ""),
      responsible_id: project.responsible_id || "",
      ask_location: !!project.ask_location,
      radius_m: Number(project.radius_m ?? 350),   // ← НОВОЕ
    });
  },[project]);

  async function loadProject() {
    const p = await Projects.get(projectId);
    setProject(p);
    setAccessIds(Array.isArray(p?.accessPersons) ? p.accessPersons : []);
  }
  async function loadTasks() {
    const res = await Tasks.list({ projectId, archived: 0, limit: 1000, sort: "-updatedAt" });
    setTasks(res.items || []);
  }
  async function loadPersons() {
    const res = await api<any>("/api/person?archived=0&limit=2000");
    const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
    setAllPersons(items);
  }
  async function loadFiles() {
    const res = await ProjectFiles.list(projectId);
    const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
    setFiles(items);
  }
  useEffect(()=>{ loadProject(); loadTasks(); loadPersons(); loadFiles(); },[projectId]);

  // задачи
  async function toggleTaskArchive(t: Task) {
    await api(`/api/task/${t._id}`, { method: "PATCH", body: JSON.stringify({ archived: !t.archived }) });
    await loadTasks();
  }
  async function removeTask(t: Task) {
    if (!confirm("Удалить задачу?")) return;
    await api(`/api/task/${t._id}`, { method: "DELETE" });
    await loadTasks();
  }

  // доступы
  async function saveAccess() {
    await api(`/api/project/${projectId}/access`, { method: "POST", body: JSON.stringify({ personIds: accessIds }) });
    await loadProject();
    alert("Сохранено");
  }

  // файлы
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    try { setUploading(true); await ProjectFiles.upload(projectId, f); await loadFiles(); e.target.value = ""; }
    finally { setUploading(false); }
  }
  async function openFile(file: FileItem) {
    const id = String(file._id || file.id); if (!id) return;
    const blob = await apiBlob(`/api/files/${id}`); const url = URL.createObjectURL(blob);
    window.open(url, "_blank"); setTimeout(()=>URL.revokeObjectURL(url), 60_000);
  }
  async function removeFile(file: FileItem) {
    const id = String(file._id || file.id); if (!id) return;
    if (!confirm(`Удалить файл «${file.name || file.originalName || id}»?`)) return;
    await ProjectFiles.delete(id); await loadFiles();
  }

  // люди для чеклиста
  const personsOptions = useMemo(()=> allPersons.map(p=>({id:p._id, label: fio(p)||p.email||p._id})),[allPersons]);

  // карты
  const mapLinks = (() => {
    const lat = project?.latitude, lon = project?.longitude;
    if (lat == null || lon == null || lat === "" || lon === "") return null;
    const yandex = `https://yandex.ru/maps/?text=${encodeURIComponent(`${lat},${lon}`)}`;
    const google = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat},${lon}`)}`;
    return { yandex, google };
  })();

  // сохранить гео прямо со страницы
  async function saveGeo() {
    const payload:any = {
      address: geoForm.address || "",
      responsible_id: geoForm.responsible_id || "",
      ask_location: !!geoForm.ask_location,
      radius_m: Number(geoForm.radius_m) || 350,
    };
    // числа, если введены
    const lat = geoForm.latitude?.toString().trim();
    const lon = geoForm.longitude?.toString().trim();
    payload.latitude  = lat === "" ? "" : Number(lat);
    payload.longitude = lon === "" ? "" : Number(lon);

    await api(`/api/project/${projectId}`, { method: "PATCH", body: JSON.stringify(payload) });
    await loadProject();
    setGeoOpen(false);
  }

  return (
    <div className="space-y-4">
      {/* заголовок */}
      <div className="flex items-start gap-3">
        <button className="rounded-xl border px-3 py-2 mt-1" onClick={onBack}>← Назад</button>

        <div className="flex-1">
          <div className="text-2xl font-semibold">
            {project?.name || "Проект"}{" "}
            <span className="text-muted-foreground">{project?.description ? ` ${project.description}` : ""}</span>
          </div>

          {/* адрес + координаты + чекбокс + кнопка редактирования */}
          <div className="mt-1 text-sm text-muted-foreground space-y-1">
            {project?.address && <div>{project.address}</div>}
            {(project?.latitude || project?.longitude) && (
              <div>
                {project?.latitude ?? "-"}, {project?.longitude ?? "-"}
                {mapLinks && (
                  <> · <a className="underline" href={mapLinks.yandex} target="_blank" rel="noreferrer">Яндекс</a> / <a className="underline" href={mapLinks.google} target="_blank" rel="noreferrer">Google</a></>
                )}
              </div>
            )}
            {typeof project?.radius_m === "number" && project.radius_m > 0 && (
              <div>Радиус допуска: {project.radius_m} м</div>
            )}
            <div className="flex items-center gap-2">
              <span className="rounded-md border px-2 py-0.5">
                {project?.ask_location ? "Запрашивать геолокацию" : "Не запрашивать геолокацию"}
              </span>
              <button className="rounded-md border px-2 py-1 inline-flex items-center gap-1" onClick={()=>setGeoOpen(true)}>
                <Icon.MapPin/> Изменить геолокацию
              </button>
            </div>
          </div>
        </div>

        <div className="ml-auto text-sm text-muted-foreground">
          Обновлено: {formatDateTimeRu(project?.updatedAt)}
        </div>
      </div>

      {/* вкладки */}
      <div className="flex items-center gap-2">
        <button className={`rounded-xl border px-3 py-1 ${tab === "tasks" ? "bg-muted/50" : ""}`} onClick={() => setTab("tasks")}>Задачи</button>
        <button className={`rounded-xl border px-3 py-1 ${tab === "access" ? "bg-muted/50" : ""}`} onClick={() => setTab("access")}>Сотрудники с доступом</button>
        <button className={`rounded-xl border px-3 py-1 ${tab === "files" ? "bg-muted/50" : ""}`} onClick={() => setTab("files")}>Диск</button>
      </div>

      {/* содержимое вкладок — как было */}
      {tab === "tasks" && (
        <div className="rounded-2xl border overflow-auto">
          <table className="w-full text-sm zebra">
            <thead className="bg-muted/50 sticky top-0">
              <tr><th className="p-2 text-left">№</th><th className="p-2 text-left">Название</th><th className="p-2 text-left">Статус</th><th className="p-2 text-left">Обновлено</th><th className="p-2 text-left w-24"></th></tr>
            </thead>
            <tbody>
              {tasks.map((t,i)=>(
                <tr key={t._id} className="border-t">
                  <td className="p-2 align-top">{i+1}</td>
                  <td className="p-2 align-top">{t.title||"(без названия)"}</td>
                  <td className="p-2 align-top">{t.status||""}</td>
                  <td className="p-2 align-top">{formatDateTimeRu(t.updatedAt)}</td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <button className={iconBtn} title={t.archived?"Убрать из архива":"В архив"} aria-label={t.archived?"Убрать из архива":"В архив"} onClick={()=>toggleTaskArchive(t)}>
                        {t.archived?<Icon.Unarchive/>:<Icon.Archive/>}
                      </button>
                      <button className={`${iconBtn} border-red-200 hover:bg-red-50 text-red-600`} title="Удалить" aria-label="Удалить" onClick={()=>removeTask(t)}>
                        <Icon.Trash/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {tasks.length===0 && <tr><td className="p-4 text-center text-muted-foreground" colSpan={5}>Задач нет</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === "access" && (
        <div className="rounded-2xl border p-3 space-y-3">
          <div className="text-sm font-medium">Сотрудники с доступом</div>
          <AccessChecklist options={personsOptions} value={accessIds} onChange={setAccessIds} emptyText="Нет сотрудников"/>
          <div className="text-right"><button className="rounded-xl border px-3 py-2" onClick={saveAccess}>Сохранить</button></div>
        </div>
      )}

      {tab === "files" && (
        <div className="space-y-3">
          <input type="file" onChange={handleUpload} disabled={uploading}/>
          <div className="rounded-2xl border overflow-auto">
            <table className="w-full text-sm zebra">
              <thead className="bg-muted/50 sticky top-0">
                <tr><th className="p-2 text-left">Имя файла</th><th className="p-2 text-left">Размер</th><th className="p-2 text-left">Загружен</th><th className="p-2 text-left w-20"></th></tr>
              </thead>
              <tbody>
                {files.map(f=>{
                  const id = String(f._id||f.id);
                  const name = f.name || f.originalName || id;
                  const sizeMb = (Number(f.size||0)/(1024*1024)).toFixed(2)+" МБ";
                  const dt = formatDateTimeRu(f.uploadedAt||f.createdAt);
                  return (
                    <tr key={id} className="border-t">
                      <td className="p-2"><button className="underline hover:no-underline" onClick={()=>openFile(f)}>{name}</button></td>
                      <td className="p-2">{sizeMb}</td>
                      <td className="p-2">{dt}</td>
                      <td className="p-2">
                        <div className="flex gap-2">
                          <button className={`${iconBtn} border-red-200 hover:bg-red-50 text-red-600`} title="Удалить" aria-label="Удалить" onClick={()=>removeFile(f)}>
                            <Icon.Trash/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {files.length===0 && <tr><td className="p-4 text-center text-muted-foreground" colSpan={4}>Файлов нет</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== модал геолокации ===== */}
      {geoOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setGeoOpen(false)} />
          <div className="relative w-[min(720px,96vw)] rounded-2xl bg-white p-6 shadow-2xl space-y-4">
            <div className="text-lg font-semibold inline-flex items-center gap-2">
              <Icon.MapPin/> Геолокация проекта
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="text-sm md:col-span-2">
                Адрес
                <input className="w-full rounded-xl border px-3 py-2"
                  value={geoForm.address} onChange={e=>setGeoForm(f=>({...f,address:e.target.value}))}/>
              </label>

              <label className="text-sm">
                Широта
                <input className="w-full rounded-xl border px-3 py-2" inputMode="decimal" placeholder="55.7558"
                  value={geoForm.latitude} onChange={e=>setGeoForm(f=>({...f,latitude:e.target.value}))}/>
              </label>
              <label className="text-sm">
                Долгота
                <input className="w-full rounded-xl border px-3 py-2" inputMode="decimal" placeholder="37.6176"
                  value={geoForm.longitude} onChange={e=>setGeoForm(f=>({...f,longitude:e.target.value}))}/>
              </label>

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
                    setGeoForm(f => ({
                      ...f,
                      radius_m: Math.max(10, Math.min(5000, Number(e.target.value) || 0)),
                    }))
                  }
                />
                <span className="text-xs text-muted-foreground">
                  Радиус допуска (10-5000)
                </span>
              </label>

              <label className="text-sm md:col-span-2">
                Ответственный
                <select className="w-full rounded-xl border px-3 py-2"
                  value={geoForm.responsible_id ?? ""}
                  onChange={(e) =>
                    setGeoForm((f: any) => ({ ...f, responsible_id: e.target.value || "" }))
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

              <label className="flex items-center gap-2 md:col-span-2">
                <input type="checkbox" checked={geoForm.ask_location}
                  onChange={e=>setGeoForm(f=>({...f,ask_location:e.target.checked}))}/>
                Запрашивать геолокацию у проекта
              </label>
            </div>

            <div className="flex justify-end gap-2">
              <button className="rounded-xl border px-4 py-2 inline-flex items-center gap-2" onClick={()=>setGeoOpen(false)}>
                <Icon.X/> Закрыть
              </button>
              <button className="rounded-xl border px-4 py-2 inline-flex items-center gap-2 bg-muted/50"
                onClick={saveGeo}>
                <Icon.Check/> Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}