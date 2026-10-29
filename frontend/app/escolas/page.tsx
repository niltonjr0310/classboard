"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSomenteSuperAdmin } from "../hooks/useBloquearAluno";
import { chamar, getEscolaAtual, setEscolaAtual } from "../lib/api";

type Escola = {
  id: number;
  nome: string;
  logoUrl: string | null;
  _count: { alunos: number; professores: number; turmas: number; aulas: number };
};
type AdminEscola = { id: number; nome: string; email: string };

const campo =
  "rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-800";
const botaoLeve =
  "rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800";

export default function EscolasPage() {
  useSomenteSuperAdmin();
  const router = useRouter();
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const [atualId, setAtualId] = useState<number | null>(null);

  const [nome, setNome] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [adminNome, setAdminNome] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [salvando, setSalvando] = useState(false);

  const [abertaId, setAbertaId] = useState<number | null>(null);
  const [admins, setAdmins] = useState<AdminEscola[]>([]);
  const [novoAdminNome, setNovoAdminNome] = useState("");
  const [novoAdminEmail, setNovoAdminEmail] = useState("");

  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editLogo, setEditLogo] = useState("");

  const erro = (texto: string) => setMsg({ tipo: "erro", texto });
  const ok = (texto: string) => setMsg({ tipo: "ok", texto });

  async function carregar() {
    const r = await chamar<Escola[]>("/escolas");
    if (r.ok && r.data) setEscolas(r.data);
    else erro(r.erro ?? "Não foi possível carregar as escolas.");
    setLoading(false);
  }

  useEffect(() => {
    setAtualId(getEscolaAtual()?.id ?? null);
    carregar();
  }, []);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    const r = await chamar("/escolas", {
      method: "POST",
      body: JSON.stringify({ nome, logoUrl: logoUrl.trim() || undefined, adminNome, adminEmail }),
    });
    setSalvando(false);
    if (!r.ok) return erro(r.erro ?? "Não foi possível criar a escola.");
    setNome("");
    setLogoUrl("");
    setAdminNome("");
    setAdminEmail("");
    ok("Escola criada.");
    carregar();
  }

  function entrar(e: Escola) {
    setEscolaAtual({ id: e.id, nome: e.nome, logoUrl: e.logoUrl });
    router.push("/");
  }

  async function abrirAdmins(id: number) {
    if (abertaId === id) return setAbertaId(null);
    setAbertaId(id);
    const r = await chamar<AdminEscola[]>(`/escolas/${id}/admins`);
    setAdmins(r.ok && r.data ? r.data : []);
  }

  async function addAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (abertaId === null) return;
    const r = await chamar(`/escolas/${abertaId}/admins`, {
      method: "POST",
      body: JSON.stringify({ nome: novoAdminNome, email: novoAdminEmail }),
    });
    if (!r.ok) return erro(r.erro ?? "Não foi possível adicionar.");
    setNovoAdminNome("");
    setNovoAdminEmail("");
    ok("Administrador adicionado.");
    const lista = await chamar<AdminEscola[]>(`/escolas/${abertaId}/admins`);
    setAdmins(lista.ok && lista.data ? lista.data : []);
  }

  async function removerAdmin(adminId: number) {
    if (abertaId === null || !confirm("Remover este administrador?")) return;
    const r = await chamar(`/escolas/${abertaId}/admins/${adminId}`, { method: "DELETE" });
    if (!r.ok) return erro(r.erro ?? "Não foi possível remover.");
    setAdmins((l) => l.filter((a) => a.id !== adminId));
  }

  async function salvarEdicao(id: number) {
    const r = await chamar(`/escolas/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ nome: editNome, logoUrl: editLogo.trim() || null }),
    });
    if (!r.ok) return erro(r.erro ?? "Não foi possível salvar.");
    if (atualId === id) setEscolaAtual({ id, nome: editNome.trim(), logoUrl: editLogo.trim() || null });
    setEditandoId(null);
    ok("Escola atualizada.");
    carregar();
  }

  async function excluir(e: Escola) {
    if (!confirm(`Excluir a escola "${e.nome}"?`)) return;
    const r = await chamar(`/escolas/${e.id}`, { method: "DELETE" });
    if (!r.ok) return erro(r.erro ?? "Não foi possível excluir.");
    if (atualId === e.id) setEscolaAtual(null);
    ok("Escola excluída.");
    carregar();
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Escolas</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Cada escola tem os próprios professores, alunos, turmas e aulas. Escolha uma para administrar.
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
        onSubmit={criar}
        className="mb-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <h2 className="font-semibold text-slate-900 dark:text-white">Nova escola</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input className={campo} placeholder="Nome da escola" value={nome} onChange={(e) => setNome(e.target.value)} required />
          <input className={campo} type="url" placeholder="Link do logo (opcional)" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} />
          <input className={campo} placeholder="Nome do administrador (opcional)" value={adminNome} onChange={(e) => setAdminNome(e.target.value)} />
          <input className={campo} type="email" placeholder="E-mail do administrador (Google)" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
        </div>
        <button
          className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:opacity-60"
          type="submit"
          disabled={salvando}
        >
          {salvando ? "Criando..." : "Criar escola"}
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-slate-500">Carregando...</p>
      ) : escolas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Nenhuma escola ainda.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {escolas.map((e) => (
            <li key={e.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              {editandoId === e.id ? (
                <div className="flex flex-col gap-2">
                  <input className={campo} value={editNome} onChange={(ev) => setEditNome(ev.target.value)} />
                  <input className={campo} type="url" placeholder="Link do logo" value={editLogo} onChange={(ev) => setEditLogo(ev.target.value)} />
                  <div className="flex gap-2">
                    <button className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-violet-700" onClick={() => salvarEdicao(e.id)}>
                      Salvar
                    </button>
                    <button className={botaoLeve} onClick={() => setEditandoId(null)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {e.logoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={e.logoUrl} alt="" className="h-10 max-w-[80px] object-contain" />
                    )}
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {e.nome}
                        {atualId === e.id && (
                          <span className="ml-2 rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                            em uso
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {e._count.professores} professores · {e._count.alunos} alunos · {e._count.turmas} turmas · {e._count.aulas} aulas/provas
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700" onClick={() => entrar(e)}>
                      Entrar
                    </button>
                    <button className={botaoLeve} onClick={() => abrirAdmins(e.id)}>
                      Administradores
                    </button>
                    <button
                      className={botaoLeve}
                      onClick={() => {
                        setEditandoId(e.id);
                        setEditNome(e.nome);
                        setEditLogo(e.logoUrl ?? "");
                      }}
                    >
                      Editar
                    </button>
                    <button
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
                      onClick={() => excluir(e)}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              )}

              {abertaId === e.id && (
                <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
                  {admins.length === 0 ? (
                    <p className="mb-3 text-sm text-slate-500">Nenhum administrador. Adicione o e-mail Google de quem vai cuidar desta escola.</p>
                  ) : (
                    <ul className="mb-3 flex flex-col gap-2">
                      {admins.map((a) => (
                        <li key={a.id} className="flex items-center justify-between text-sm">
                          <span className="text-slate-700 dark:text-slate-300">
                            {a.nome} <span className="text-slate-400">· {a.email}</span>
                          </span>
                          <button className="text-red-600 hover:underline dark:text-red-400" onClick={() => removerAdmin(a.id)}>
                            Remover
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <form onSubmit={addAdmin} className="flex flex-wrap gap-2">
                    <input className={`${campo} flex-1`} placeholder="Nome" value={novoAdminNome} onChange={(ev) => setNovoAdminNome(ev.target.value)} />
                    <input className={`${campo} flex-1`} type="email" placeholder="E-mail Google" value={novoAdminEmail} onChange={(ev) => setNovoAdminEmail(ev.target.value)} required />
                    <button className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-700" type="submit">
                      Adicionar
                    </button>
                  </form>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
