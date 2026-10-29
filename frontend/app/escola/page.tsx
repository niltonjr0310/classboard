"use client";

import { useEffect, useState } from "react";
import { useSomenteAdmin } from "../hooks/useBloquearAluno";
import { EscolaResumo, chamar, getEscolaAtual, setEscolaAtual } from "../lib/api";

const campo =
  "rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-800";

export default function MinhaEscolaPage() {
  useSomenteAdmin();
  const [nome, setNome] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const [logoQuebrado, setLogoQuebrado] = useState(false);

  useEffect(() => {
    const atual = getEscolaAtual();
    if (atual) {
      setNome(atual.nome);
      setLogoUrl(atual.logoUrl ?? "");
    }
  }, []);

  useEffect(() => setLogoQuebrado(false), [logoUrl]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setMsg(null);
    const r = await chamar<EscolaResumo>("/escolas/minha", {
      method: "PATCH",
      body: JSON.stringify({ nome, logoUrl: logoUrl.trim() || null }),
    });
    setSalvando(false);
    if (!r.ok || !r.data) {
      setMsg({ tipo: "erro", texto: r.erro ?? "Não foi possível salvar." });
      return;
    }
    setEscolaAtual({ id: r.data.id, nome: r.data.nome, logoUrl: r.data.logoUrl });
    setMsg({ tipo: "ok", texto: "Dados da escola salvos." });
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Minha escola</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        O nome e o logo aparecem no cabeçalho do sistema e nos e-mails enviados.
      </p>

      {msg && (
        <div
          className={`mb-6 rounded-lg border px-4 py-2 text-sm ${
            msg.tipo === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
          }`}
        >
          {msg.texto}
        </div>
      )}

      <form
        onSubmit={salvar}
        className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Nome da escola
          <input className={`${campo} mt-1 w-full`} value={nome} onChange={(e) => setNome(e.target.value)} required />
        </label>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          Link do logo (opcional)
          <input
            className={`${campo} mt-1 w-full`}
            type="url"
            placeholder="https://..."
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
          />
        </label>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Use o endereço público de uma imagem (PNG ou SVG com fundo transparente funciona melhor).
        </p>

        {logoUrl.trim() && (
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-300 p-3 dark:border-slate-700">
            {logoQuebrado ? (
              <span className="text-sm text-red-600 dark:text-red-400">Não consegui carregar essa imagem.</span>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Prévia do logo" className="h-12 max-w-[160px] object-contain" onError={() => setLogoQuebrado(true)} />
            )}
            <span className="font-medium text-slate-700 dark:text-slate-200">{nome}</span>
          </div>
        )}

        <button
          className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:opacity-60"
          type="submit"
          disabled={salvando}
        >
          {salvando ? "Salvando..." : "Salvar"}
        </button>
      </form>
    </div>
  );
}
