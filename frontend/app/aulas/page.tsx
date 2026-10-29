"use client";

import { useEffect, useState } from "react";
import { useSomenteAdmin } from "../hooks/useBloquearAluno";
import { API_URL, authHeaders } from "../lib/api";

type Professor = { id: number; nome: string; disciplina?: string };
type Aluno = { id: number; nome: string };
type Aula = {
  id: number;
  dataHora: string;
  duracao: number;
  status: string;
  tipo: string;
  materia: string | null;
  professor: Professor;
  aluno: Aluno;
};


const STATUS_STYLES: Record<string, string> = {
  agendada:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30",
  concluida:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30",
  cancelada:
    "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
};

const STATUS_LABELS: Record<string, string> = {
  agendada: "Agendada",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

export default function AulasPage() {
  useSomenteAdmin();
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [dataHora, setDataHora] = useState("");
  const [duracao, setDuracao] = useState(60);
  const [professorId, setProfessorId] = useState("");
  const [alunoId, setAlunoId] = useState("");
  const [tipo, setTipo] = useState("aula");
  const [materia, setMateria] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function carregar() {
    try {
      const [aulasRes, profRes, alunosRes] = await Promise.all([
        fetch(`${API_URL}/aulas`, { headers: authHeaders() }),
        fetch(`${API_URL}/professores`, { headers: authHeaders() }),
        fetch(`${API_URL}/alunos`, { headers: authHeaders() }),
      ]);
      setAulas(aulasRes.ok ? await aulasRes.json() : []);
      setProfessores(profRes.ok ? await profRes.json() : []);
      setAlunos(alunosRes.ok ? await alunosRes.json() : []);
    } catch {
      setFeedback("Não foi possível carregar os dados. Tente novamente.");
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
      await fetch(`${API_URL}/aulas`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          dataHora: new Date(dataHora).toISOString(),
          duracao: Number(duracao),
          professorId: Number(professorId),
          alunoId: Number(alunoId),
          tipo,
          materia: materia.trim() || undefined,
        }),
      });
      setDataHora("");
      setDuracao(60);
      setProfessorId("");
      setAlunoId("");
      setMateria("");
      setFeedback(tipo === "prova" ? "Prova agendada com sucesso." : "Aula agendada com sucesso.");
      setTipo("aula");
      await carregar();
    } catch {
      setFeedback("Erro ao agendar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Excluir esta aula?")) return;
    try {
      await fetch(`${API_URL}/aulas/${id}`, { method: "DELETE", headers: authHeaders() });
      setFeedback("Aula removida.");
      await carregar();
    } catch {
      setFeedback("Não foi possível excluir a aula.");
    }
  }

  async function handleStatusChange(id: number, status: string) {
    await fetch(`${API_URL}/aulas/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ status }),
    });
    await carregar();
  }

  function handleProfessorChange(novoId: string) {
    const anterior = professores.find((p) => String(p.id) === professorId);
    const novo = professores.find((p) => String(p.id) === novoId);
    setProfessorId(novoId);
    // preenche a matéria com a disciplina do professor, sem sobrescrever o que o admin digitou
    if (materia === "" || materia === anterior?.disciplina) {
      setMateria(novo?.disciplina ?? "");
    }
  }

  const semProfessores = !loading && professores.length === 0;
  const semAlunos = !loading && alunos.length === 0;

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Aulas</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {loading ? "Carregando..." : `${aulas.length} agendada(s)`}
          </p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-lg">
          📅
        </span>
      </div>

      {feedback && (
        <div className="mb-6 rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-sm text-violet-800 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300">
          {feedback}
        </div>
      )}

      {(semProfessores || semAlunos) && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
          Cadastre pelo menos um {semProfessores ? "professor" : ""}
          {semProfessores && semAlunos ? " e um " : ""}
          {semAlunos ? "aluno" : ""} antes de agendar uma aula.
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="mb-8 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-800"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option value="aula">Aula</option>
            <option value="prova">Prova</option>
          </select>
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-800"
            type="text"
            placeholder="Matéria (ex.: Matemática)"
            value={materia}
            onChange={(e) => setMateria(e.target.value)}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-800"
            type="datetime-local"
            value={dataHora}
            onChange={(e) => setDataHora(e.target.value)}
            required
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-800"
            type="number"
            placeholder="Duração (min)"
            value={duracao}
            onChange={(e) => setDuracao(Number(e.target.value))}
            min={1}
            required
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-800"
            value={professorId}
            onChange={(e) => handleProfessorChange(e.target.value)}
            required
          >
            <option value="">Selecione o professor</option>
            {professores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-800"
            value={alunoId}
            onChange={(e) => setAlunoId(e.target.value)}
            required
          >
            <option value="">Selecione o aluno</option>
            {alunos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>
        </div>
        <button
          className="rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:opacity-60"
          type="submit"
          disabled={saving || semProfessores || semAlunos}
        >
          {saving ? "Agendando..." : tipo === "prova" ? "Agendar prova" : "Agendar aula"}
        </button>
      </form>

      {loading ? (
        <AulasSkeleton />
      ) : aulas.length === 0 ? (
        <EmptyState label="Nenhuma aula ou prova agendada ainda." />
      ) : (
        <ul className="flex flex-col gap-3">
          {aulas.map((aula) => (
            <li
              key={aula.id}
              className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="min-w-0">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                      aula.tipo === "prova"
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                        : "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
                    }`}
                  >
                    {aula.tipo === "prova" ? "Prova" : "Aula"}
                  </span>
                  {aula.materia && (
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {aula.materia}
                    </span>
                  )}
                </div>
                <p className="font-medium text-slate-900 dark:text-white">
                  {aula.professor.nome} <span className="text-slate-400">→</span> {aula.aluno.nome}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {new Date(aula.dataHora).toLocaleString("pt-BR")} · {aula.duracao} min
                </p>
                <select
                  className={`mt-2 rounded-lg border px-2 py-1 text-xs font-medium ${
                    STATUS_STYLES[aula.status] ?? STATUS_STYLES.agendada
                  }`}
                  value={aula.status}
                  onChange={(e) => handleStatusChange(aula.id, e.target.value)}
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => handleDelete(aula.id)}
                className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
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

function AulasSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-[84px] animate-pulse rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60"
        />
      ))}
    </div>
  );
}
