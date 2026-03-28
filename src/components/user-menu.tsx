"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ThemeToggle } from "./theme-toggle";

type SessionInfo = {
  authEnabled: boolean;
  user: { username: string } | null;
};

export function UserMenu() {
  const pathname = usePathname();
  const [info, setInfo] = useState<SessionInfo | null>(null);

  const refresh = useCallback(() => {
    (async () => {
      const res = await fetch("/api/auth/session", { credentials: "include" });
      const j = (await res.json()) as SessionInfo;
      setInfo(j);
    })();
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, pathname]);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    window.location.href = "/login";
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ThemeToggle />
      {info?.authEnabled && info.user ? (
        <div className="flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-[var(--app-card)] py-1 pl-3 pr-1 shadow-sm">
          <span
            className="max-w-[9rem] truncate text-xs font-medium text-[var(--app-fg)]"
            title={info.user.username}
          >
            {info.user.username}
          </span>
          <button
            type="button"
            onClick={logout}
            className="rounded-full bg-gradient-to-r from-rose-500 to-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:from-rose-600 hover:to-rose-700 active:scale-[0.98]"
          >
            Cerrar sesión
          </button>
        </div>
      ) : null}
    </div>
  );
}
