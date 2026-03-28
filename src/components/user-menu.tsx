"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

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

  if (!info?.authEnabled || !info.user) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-[var(--app-muted)]">
      <span className="max-w-[10rem] truncate font-medium text-[var(--app-fg)]" title={info.user.username}>
        {info.user.username}
      </span>
      <button
        type="button"
        onClick={logout}
        className="rounded-md border border-[var(--app-border)] bg-white px-2 py-1 font-medium text-[var(--app-fg)] transition-colors hover:bg-black/[0.04]"
      >
        Salir
      </button>
    </div>
  );
}
