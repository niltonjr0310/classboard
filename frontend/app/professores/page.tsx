"use client";

import { useEffect, useState } from "react";

type Professor = {
  id: number;
  nome: string;
  email: string;
  disciplina: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function ProfessoresPage() {
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [disciplina, setDisciplina] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function carregar() {
    try {
      const res = await fetch(`${API_URL}/professores`);
      const data = await res.json();
      setProfessores(data);
    } catch {
      setFeedback("Não foi possível carregar os professores. Tente novamente.");
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
      await fetch(`${API_URL}/professores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, disciplina }),
      });
      setNome("");
      setEmail("");
      setDisciplina("");
      setFeedback(`Professor "${nome}" cadastrado com sucesso.`);
      await carregar();
    } catch {
      setFeedback("Erro ao cadastrar professor.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number, nomeProfessor: string) {
    if (!confirm(`Excluir o professor "${nomeProfessor}"?`)) return;
    try {
      await fetch(`${API_URL}/professores/${id}`, { method: "DELETE" });
      setFeedback(`Professor "${nomeProfessor}" removido.`);
      await carregar();
    } catch {
      setFeedback("Não foi possível excluir. Verifique se ele tem aulas vinculadas.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Professores</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {loading ? "Carregando..." : `${professores.length} cadastrado(s)`}
          </p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-lg">
          🧑‍🏫
        </span>
      </div>

      {feedback && (
        <div className="mb-6 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm text-indigo-800 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
          {feedback}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mb-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800"
            placeholder="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <input
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800"
          placeholder="Disciplina"
          value={disciplina}
          onChange={(e) => setDisciplina(e.target.value)}
          required
        />
        <button
          className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
          type="submit"
          disabled={saving}
        >
          {saving ? "Adicionando..." : "Adicionar professor"}
        </button>
      </form>

      {loading ? (
        <ProfessoresSkeleton />
      ) : professores.length === 0 ? (
        <EmptyState label="Nenhum professor cadastrado ainda." />
      ) : (
        <ul className="flex flex-col gap-3">
          {professores.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{p.nome}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {p.email} · {p.disciplina}
                </p>
              </div>
              <button
                onClick={() => handleDelete(p.id, p.nome)}
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

function ProfessoresSkeleton() {
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
