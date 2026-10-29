"use client";

import { useEffect, useState } from "react";
import { useSomenteAdmin } from "../hooks/useBloquearAluno";
import { chamar } from "../lib/api";

type AlunoTurma = { id: number; nome: string; email: string; serie: string };
type Turma = { id: number; nome: string; alunos: AlunoTurma[] };
type Aluno = { id: number; nome: string; serie: string; turma: { id: number; nome: string } | null };

const campo =
  "rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-800";

export default function TurmasPage() {
  useSomenteAdmin();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [nome, setNome] = useState("");
  const [msg, setMsg] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState("");

  async function carregar() {
    const [t, a] = await Promise.all([chamar<Turma[]>("/turmas"), chamar<Aluno[]>("/alunos")]);
    setTurmas(t.ok && t.data ? t.data : []);
    setAlunos(a.ok && a.data ? a.data : []);
    if (!t.ok) setMsg({ tipo: "erro", texto: t.erro ?? "Não foi possível carregar as turmas." });
    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  const semTurma = alunos.filter((a) => !a.turma);

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    const r = await chamar("/turmas", { method: "POST", body: JSON.stringify({ nome }) });
    if (!r.ok) return setMsg({ tipo: "erro", texto: r.erro ?? "Não foi possível criar." });
    setNome("");
    setMsg({ tipo: "ok", texto: "Turma criada." });
    carregar();
  }

  async function renomear(id: number) {
    const r = await chamar(`/turmas/${id}`, { method: "PATCH", body: JSON.stringify({ nome: editNome }) });
    if (!r.ok) return setMsg({ tipo: "erro", texto: r.erro ?? "Não foi possível renomear." });
    setEditandoId(null);
    carregar();
  }

  async function excluir(t: Turma) {
    if (!confirm(`Excluir a turma "${t.nome}"? Os alunos continuam cadastrados, só ficam sem turma.`)) return;
    const r = await chamar(`/turmas/${t.id}`, { method: "DELETE" });
    if (!r.ok) return setMsg({ tipo: "erro", texto: r.erro ?? "Não foi possível excluir." });
    setMsg({ tipo: "ok", texto: "Turma excluída." });
    carregar();
  }

  async function vincular(alunoId: number, turmaId: number | null) {
    const r = await chamar(`/alunos/${alunoId}`, { method: "PATCH", body: JSON.stringify({ turmaId }) });
    if (!r.ok) return setMsg({ tipo: "erro", texto: r.erro ?? "Não foi possível atualizar o aluno." });
    carregar();
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Turmas</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {loading ? "Carregando..." : `${turmas.length} turma(s) · ${semTurma.length} aluno(s) sem turma`}
        </p>
      </div>

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
        className="mb-8 flex gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <input className={`${campo} flex-1`} placeholder="Nome da turma (ex.: 9º ano A)" value={nome} onChange={(e) => setNome(e.target.value)} required />
        <button className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-700" type="submit">
          Criar turma
        </button>
      </form>

      {!loading && turmas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Nenhuma turma criada ainda.
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {turmas.map((t) => (
            <li key={t.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                {editandoId === t.id ? (
                  <div className="flex gap-2">
                    <input className={campo} value={editNome} onChange={(e) => setEditNome(e.target.value)} />
                    <button className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-violet-700" onClick={() => renomear(t.id)}>
                      Salvar
                    </button>
                    <button className="text-sm text-slate-500 hover:underline" onClick={() => setEditandoId(null)}>
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <h2 className="font-semibold text-slate-900 dark:text-white">
                    {t.nome} <span className="text-sm font-normal text-slate-400">· {t.alunos.length} aluno(s)</span>
                  </h2>
                )}
                <div className="flex gap-3 text-sm">
                  <button
                    className="text-slate-600 hover:underline dark:text-slate-300"
                    onClick={() => {
                      setEditandoId(t.id);
                      setEditNome(t.nome);
                    }}
                  >
                    Renomear
                  </button>
                  <button className="text-red-600 hover:underline dark:text-red-400" onClick={() => excluir(t)}>
                    Excluir
                  </button>
                </div>
              </div>

              {t.alunos.length > 0 && (
                <ul className="mb-3 flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
                  {t.alunos.map((a) => (
                    <li key={a.id} className="flex items-center justify-between py-1.5 text-sm">
                      <span className="text-slate-700 dark:text-slate-300">
                        {a.nome} <span className="text-slate-400">· {a.serie}</span>
                      </span>
                      <button className="text-slate-500 hover:text-red-600 hover:underline" onClick={() => vincular(a.id, null)}>
                        Tirar da turma
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <select
                className={`${campo} w-full text-slate-500`}
                value=""
                onChange={(e) => e.target.value && vincular(Number(e.target.value), t.id)}
                disabled={semTurma.length === 0}
              >
                <option value="">{semTurma.length === 0 ? "Todos os alunos já têm turma" : "Adicionar aluno à turma..."}</option>
                {semTurma.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome} ({a.serie})
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
