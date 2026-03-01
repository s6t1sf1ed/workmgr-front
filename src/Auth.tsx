import { useState } from "react";
import { api, setToken } from "./lib/api";

type Mode = "company" | "employee" | "login";

export default function Auth({ onDone }: { onDone: () => void }) {
  // стартуем сразу в режиме логина
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  //const [company, setCompany] = useState("");
  //const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    try {
      setErr(null);
      setLoading(true);

      let path = "/auth/login";
      let body: any = { email, password };

      /*  ===== регистрация временно отключена =====
      if (mode === "company") {
        path = "/auth/register-company";
        body = { email, password, company, name };
      } else if (mode === "employee") {
        path = "/auth/register-employee";
        body = { email, password, company, name };
      }
      ============================================ */

      const res = await api<{ access_token: string }>(path, {
        method: "POST",
        body: JSON.stringify(body),
      });
      setToken(res.access_token);
      onDone();
    } catch (e: any) {
      setErr(e.message || "Ошибка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center">
      <div className="w-full max-w-md border rounded-2xl p-6 space-y-4">
        <div className="text-2xl font-semibold text-center">Work Manager</div>

        <div className="flex gap-2">
          {/*
          <TabBtn active={mode === "company"} onClick={() => setMode("company")}>
            Регистрация компании
          </TabBtn>
          <TabBtn active={mode === "employee"} onClick={() => setMode("employee")}>
            Регистрация
          </TabBtn>
          */}
          <TabBtn active={mode === "login"} onClick={() => setMode("login")}>
            Логин
          </TabBtn>
        </div>

        <div className="space-y-3">
          {/*
          {(mode === "company" || mode === "employee") && (S
            <>
              <input
                className="w-full rounded-xl border px-3 py-2"
                placeholder={mode === "company" ? "Название компании" : "Компания (название или код)"}
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
              <input
                className="w-full rounded-xl border px-3 py-2"
                placeholder="Ваше имя"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </>
          )}
          */}
          <input
            className="w-full rounded-xl border px-3 py-2"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full rounded-xl border px-3 py-2"
            placeholder="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {err && <div className="text-red-600 text-sm">{err}</div>}

          <button className="w-full rounded-xl border px-3 py-2" onClick={submit} disabled={loading}>
            Войти
          </button>
        </div>
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: any;
}) {
  return (
    <button
      type="button"
      className={`flex-1 rounded-xl border px-3 py-2 ${active ? "bg-muted" : ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}