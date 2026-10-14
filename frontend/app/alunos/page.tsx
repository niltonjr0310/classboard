"use client";

import { useEffect, useState } from "react";

type Aluno = {
  id: number;
  nome: string;
  email: string;
  serie: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function AlunosPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [serie, setSerie] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function carregar() {
    try {
      const res = await fetch(`${API_URL}/alunos`);
      const data = await res.json();
      setAlunos(data);
    } catch {
      setFeedback("Não foi possível carregar os alunos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch(`${API_URL}/alunos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, serie }),
      });
      setNome("");
      setEmail("");
      setSerie("");
      setFeedback(`Aluno "${nome}" cadastrado com sucesso.`);
      await carregar();
    } catch {
      setFeedback("Erro ao cadastrar aluno.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number, nomeAluno: string) {
    if (!confirm(`Excluir o aluno "${nomeAluno}"?`)) return;
    try {
      await fetch(`${API_URL}/alunos/${id}`, { method: "DELETE" });
      setFeedback(`Aluno "${nomeAluno}" removido.`);
      await carregar();
    } catch {
      setFeedback("Não foi possível excluir. Verifique se ele tem aulas vinculadas.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Alunos</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {loading ? "Carregando..." : `${alunos.length} cadastrado(s)`}
          </p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-lg">
          🎒
        </span>
      </div>

      {feedback && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
          {feedback}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mb-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800"
            placeholder="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800"
            placeholder="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800"
          placeholder="Série"
          value={serie}
          onChange={(e) => setSerie(e.target.value)}
          required
        />
        <button
          className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
          type="submit"
          disabled={saving}
        >
          {saving ? "Adicionando..." : "Adicionar aluno"}
        </button>
      </form>

      {loading ? (
        <AlunosSkeleton />
      ) : alunos.length === 0 ? (
        <EmptyState label="Nenhum aluno cadastrado ainda." />
      ) : (
        <ul className="flex flex-col gap-3">
          {alunos.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{a.nome}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {a.email} · {a.serie}
                </p>
              </div>
              <button
                onClick={() => handleDelete(a.id, a.nome)}
                className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                Excluir
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
      {label}
    </div>
  );
}

function AlunosSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-[68px] animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60"
        />
      ))}
    </div>
  );
}
