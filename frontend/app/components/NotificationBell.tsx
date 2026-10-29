"use client";

import { useEffect, useRef, useState } from "react";

type Notificacao = {
  id: number;
  titulo: string;
  mensagem: string;
  lida: boolean;
  createdAt: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function NotificationBell() {
  const [aberto, setAberto] = useState(false);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [naoLidas, setNaoLidas] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  async function carregar() {
    const token = localStorage.getItem("cb_token");
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/notificacoes/minhas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setNotificacoes(data.lista || []);
      setNaoLidas(data.naoLidas || 0);
    } catch {
      // silencioso — notificação não é crítica pro resto do app
    }
  }

  useEffect(() => {
    carregar();
    const intervalo = setInterval(carregar, 30000);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);

  async function handleAbrir() {
    const vaiAbrir = !aberto;
    setAberto(vaiAbrir);
    if (vaiAbrir && naoLidas > 0) {
      const token = localStorage.getItem("cb_token");
      try {
        await fetch(`${API_URL}/notificacoes/todas/lidas`, {
          method: "PATCH",
          headers: { Authorization: `Bearer ${token}` },
        });
        setNaoLidas(0);
        setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
      } catch {
        // silencioso
      }
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={handleAbrir}
        className="relative rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        aria-label="Notificações"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="h-5 w-5">
          <path
            d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {naoLidas > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {naoLidas > 9 ? "9+" : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute right-0 z-20 mt-2 w-80 max-w-[90vw] rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:text-white">
            Notificações
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notificacoes.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                Nenhuma notificação ainda.
              </p>
            ) : (
              notificacoes.map((n) => (
                <div
                  key={n.id}
                  className="border-b border-slate-50 px-4 py-3 last:border-0 dark:border-slate-800/60"
                >
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{n.titulo}</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{n.mensagem}</p>
                  <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                    {new Date(n.createdAt).toLocaleString("pt-BR")}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
