import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { formatDateTimeRu } from "../lib/dates";

type LogItem = {
  _id: string;
  createdAt: string;
  userName?: string;
  userEmail?: string;
  action: string;
  message?: string;
  diff?: any;
};

export default function AdminLogsPage() {
  const [items, setItems] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api<{items: LogItem[]}>("/api/admin/logs?limit=100");
      setItems(res.items || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function clearAll() {
    if (!confirm("Очистить все логи?")) return;
    await api("/api/admin/logs", { method: "DELETE" });
    setItems([]);
  }

  async function removeOne(id: string) {
    await api(`/api/admin/logs/${id}`, { method: "DELETE" });
    setItems(items => items.filter(i => i._id !== id));
  }

  const TrashIcon = (p: any) => (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden {...p}>
      <path fill="currentColor" d="M6 19a2 2 0 002 2h8a2 2 0 002-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
    </svg>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="ml-auto flex items-center gap-2">
          <button className="rounded-xl border px-3 py-2" onClick={load} disabled={loading}>Обновить</button>
          <button className="rounded-xl border px-3 py-2" onClick={clearAll}>Очистить всё</button>
        </div>
      </div>

      <div className="rounded-2xl border max-h-[70vh] overflow-auto">
        <table className="w-full text-sm zebra">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="p-2 text-left">Время</th>
              <th className="p-2 text-left">Пользователь</th>
              <th className="p-2 text-left">Действие</th>
              <th className="p-2 text-left">Сообщение</th>
              <th className="p-2 text-right w-24"> </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td className="p-3 text-muted-foreground" colSpan={5}>Пока пусто</td></tr>
            )}
            {items.map((x) => (
              <tr key={x._id} className="border-t">
                <td className="p-2">{formatDateTimeRu(x.createdAt, true)}</td>
                <td className="p-2">{x.userName || x.userEmail || "—"}</td>
                <td className="p-2">{x.action}</td>
                <td className="p-2">{x.message}</td>
                <td className="p-2 text-right">
                  <button
                    className="inline-flex items-center justify-center rounded-md border w-7 h-7 text-red-600 border-red-200 hover:bg-red-50"
                    title="Удалить"
                    aria-label="Удалить"
                    onClick={() => removeOne(x._id)}
                  >
                    <TrashIcon />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
