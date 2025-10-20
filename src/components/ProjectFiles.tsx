import { useEffect, useState } from "react";
import { ProjectFiles } from "../lib/api";
import { formatDateTimeRu } from "../lib/dates";

export default function ProjectFilesBlock({ projectId }: { projectId: string }) {
  const [files, setFiles] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  async function load() {
    const list = await ProjectFiles.list(projectId);
    setFiles(Array.isArray(list) ? list : (list?.items || []));
  }
  useEffect(() => { load(); }, [projectId]);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    setUploading(true);
    try { await ProjectFiles.upload(projectId, f); await load(); } finally { setUploading(false); e.target.value = ""; }
  }
  async function del(id: string) {
    if (!confirm("Удалить файл?")) return;
    await ProjectFiles.delete(id); setFiles(fs => fs.filter((x: any) => x._id !== id));
  }

  return (
    <div className="space-y-3">
      <input type="file" onChange={onUpload} disabled={uploading} />
      <div className="rounded-2xl border max-h-[60vh] overflow-auto">
        <table className="w-full text-sm zebra">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="p-2 text-left">Имя файла</th>
              <th className="p-2 text-left w-40">Размер</th>
              <th className="p-2 text-left w-44">Загружен</th>
              <th className="p-2 w-40"></th>
            </tr>
          </thead>
          <tbody>
            {files.map((f: any) => (
              <tr key={f._id} className="border-t">
                <td className="p-2">
                  <a className="underline" href={f.url || f.downloadUrl} target="_blank" rel="noreferrer">{f.filename || f.name}</a>
                </td>
                <td className="p-2">{typeof f.size === "number" ? `${(f.size/1024/1024).toFixed(2)} МБ` : ""}</td>
                <td className="p-2">{formatDateTimeRu(f.uploadedAt || f.createdAt)}</td>
                <td className="p-2 text-right">
                  <button className="inline-flex items-center justify-center rounded-md border px-3 py-1 text-red-600 border-red-200 hover:bg-red-50" onClick={() => del(f._id)}>
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
            {!files.length && <tr><td className="p-4 text-center text-muted-foreground" colSpan={4}>Файлов нет</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
