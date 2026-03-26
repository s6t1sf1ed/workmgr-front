import { useEffect, useMemo, useState } from "react";
import { AdminUsers } from "../lib/api";

type PermissionItem = { key: string; label: string };
type UserItem = {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
  permissions?: string[];
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [catalog, setCatalog] = useState<PermissionItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [u, p] = await Promise.all([
        AdminUsers.list(),
        AdminUsers.permissions(),
      ]);

      const items: UserItem[] = Array.isArray(u?.items) ? (u.items as UserItem[]) : [];
      const perms: PermissionItem[] = Array.isArray(p?.items)
        ? (p.items as PermissionItem[])
        : [];

      setUsers(items);
      setCatalog(perms);

      const current: UserItem | null =
        items.find((x: UserItem) => x._id === selectedId && x.role !== "admin") ||
        items.find((x: UserItem) => x.role !== "admin") ||
        null;

      setSelectedId(current?._id || null);
      setChecked(
        Object.fromEntries((current?.permissions || []).map((x: string) => [x, true]))
      );
    } catch (e: any) {
      setError(e?.message || "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const selected = useMemo(
    () => users.find((x) => x._id === selectedId) || null,
    [users, selectedId]
  );

  useEffect(() => {
    setChecked(
      Object.fromEntries((selected?.permissions || []).map((x: string) => [x, true]))
    );
  }, [selected]);

  async function save() {
    if (!selected?._id || selected.role === "admin") return;
    try {
      setSaving(true);
      const permissions = catalog
        .filter((x) => checked[x.key])
        .map((x) => x.key);

      const res = await AdminUsers.update(selected._id, { permissions });
      const item = res?.item;

      setUsers((prev) =>
        prev.map((u) =>
          u._id === item?._id ? { ...u, permissions: item.permissions || [] } : u
        )
      );

      setChecked(
        Object.fromEntries((item?.permissions || []).map((x: string) => [x, true]))
      );

      alert("Права сохранены");
    } catch (e: any) {
      alert(e?.message || "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-4 min-h-0">
      <div className="rounded-2xl border overflow-hidden">
        <div className="px-4 py-3 border-b font-medium">Пользователи</div>
        <div className="max-h-[70vh] overflow-auto">
          {loading && <div className="p-4 text-sm text-muted-foreground">Загрузка...</div>}
          {error && <div className="p-4 text-sm text-red-500">{error}</div>}
          {!loading && !error && users.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground">Пока нет пользователей</div>
          )}
          {users.map((u) => {
            const active = u._id === selectedId;
            return (
              <button
                key={u._id}
                className={`w-full text-left px-4 py-3 border-b hover:bg-muted/50 ${active ? "bg-muted" : ""}`}
                onClick={() => {
                  setSelectedId(u._id);
                  setChecked(Object.fromEntries((u.permissions || []).map((x) => [x, true])));
                }}
              >
                <div className="font-medium truncate">{u.name || u.email || "Без имени"}</div>
                <div className="text-sm text-muted-foreground truncate">{u.email || "—"}</div>
                <div className="text-xs mt-1 text-muted-foreground">
                  {u.role === "admin" ? "Администратор" : "Пользователь"}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border p-4 space-y-4 overflow-auto max-h-[70vh]">
        {!selected && <div className="text-muted-foreground">Выберите пользователя слева</div>}
        {selected && (
          <>
            <div className="flex items-start gap-3">
              <div>
                <div className="text-xl font-semibold">{selected.name || selected.email || "Пользователь"}</div>
                <div className="text-sm text-muted-foreground">{selected.email || "—"}</div>
              </div>
              <div className="ml-auto text-sm rounded-xl border px-3 py-1">
                {selected.role === "admin" ? "Администратор" : "Пользователь"}
              </div>
            </div>

            {selected.role === "admin" ? (
              <div className="rounded-xl border p-4 text-sm text-muted-foreground">
                Для администраторов права не редактируются на этой странице.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {catalog.map((perm) => (
                    <label key={perm.key} className="flex items-start gap-3 rounded-xl border px-3 py-3 hover:bg-muted/40">
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={!!checked[perm.key]}
                        onChange={(e) => setChecked((prev) => ({ ...prev, [perm.key]: e.target.checked }))}
                      />
                      <div>
                        <div className="font-medium">{perm.label}</div>
                        <div className="text-xs text-muted-foreground">{perm.key}</div>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button className="rounded-xl border px-3 py-2" onClick={() => load()} disabled={loading || saving}>
                    Обновить
                  </button>
                  <button className="rounded-xl border px-3 py-2 bg-primary text-primary-foreground" onClick={save} disabled={saving}>
                    Сохранить права
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
