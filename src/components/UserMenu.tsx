import { useEffect, useState } from "react";
import { Me } from "../lib/api";

export default function UserMenu() {
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [tg, setTg] = useState("");
  const [pwd, setPwd] = useState({ cur: "", newp: "", rep: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Me.get()
      .then((m) => {
        setName(m?.name || "");
        setTg(m?.telegram_id || "");
      })
      .catch((e) => {
        console.warn("GET /api/me failed:", e);
        setError("не удалось загрузить профиль");
      });
  }, []);

  const saveProfile = async () => {
    try {
      setBusy(true);
      await Me.patch({ name, telegram_id: tg.trim() || undefined });
      setBusy(false);
      setOpen(false);
    } catch (e) {
      setBusy(false);
      alert("Ошибка сохранения");
    }
  };

  const changePwd = async () => {
    if (pwd.newp !== pwd.rep) return alert("Пароли не совпадают");
    try {
      setBusy(true);
      await Me.changePassword({ current_password: pwd.cur, new_password: pwd.newp });
      setBusy(false);
      setPwd({ cur: "", newp: "", rep: "" });
      alert("Пароль изменён");
    } catch {
      setBusy(false);
      alert("Ошибка смены пароля");
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button className="px-3 py-1 rounded-xl border" onClick={() => setOpen(true)}>
        О пользователе
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-background text-foreground w-full max-w-lg rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-4">Учётные данные</h2>

            {error && (
              <div className="mb-3 text-sm text-red-500">
                Профиль не загружен ({error}). Проверьте /api/me и токен.
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="text-sm opacity-70">Имя</label>
                <input className="w-full border rounded-md p-2 bg-background"
                  value={name} onChange={e=>setName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm opacity-70">Telegram ID</label>
                <input className="w-full border rounded-md p-2 bg-background"
                  value={tg} onChange={e=>setTg(e.target.value)} />
              </div>
              <div className="border-t pt-3">
                <div className="font-medium mb-2">Смена пароля</div>
                <input placeholder="Текущий пароль" type="password"
                  className="w-full border rounded-md p-2 bg-background mb-2"
                  value={pwd.cur} onChange={e=>setPwd({...pwd, cur:e.target.value})}/>
                <input placeholder="Новый пароль" type="password"
                  className="w-full border rounded-md p-2 bg-background mb-2"
                  value={pwd.newp} onChange={e=>setPwd({...pwd, newp:e.target.value})}/>
                <input placeholder="Повтор нового пароля" type="password"
                  className="w-full border rounded-md p-2 bg-background"
                  value={pwd.rep} onChange={e=>setPwd({...pwd, rep:e.target.value})}/>
                <button className="mt-2 px-3 py-1 rounded-md bg-primary text-primary-foreground"
                  onClick={changePwd} disabled={busy}>Изменить пароль</button>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button className="px-3 py-1 rounded-md" onClick={()=>setOpen(false)}>Закрыть</button>
              <button className="px-3 py-1 rounded-md bg-primary text-primary-foreground"
                onClick={saveProfile} disabled={busy}>Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}