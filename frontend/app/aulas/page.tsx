"use client";

import { useEffect, useState } from "react";
import { useSomenteAdmin } from "../hooks/useBloquearAluno";
import { API_URL, authHeaders } from "../lib/api";

type Professor = { id: number; nome: string; disciplina?: string };
type Aluno = { id: number; nome: string; turma?: { id: number; nome: string } | null };
type Turma = { id: number; nome: string };

const CAMPO =
  "rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-800";

// ISO -> valor do <input type="datetime-local"> no horário local do navegador
function paraInput(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
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

const TZ = "America/Sao_Paulo";

function diaChave(data: Date) {
  return data.toLocaleDateString("en-CA", { timeZone: TZ }); // AAAA-MM-DD
}

function rotuloDia(chave: string, hoje: string, amanha: string) {
  const [a, m, d] = chave.split("-").map(Number);
  const texto = new Date(Date.UTC(a, m - 1, d, 12)).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
  const cap = texto.charAt(0).toUpperCase() + texto.slice(1);
  if (chave === hoje) return `Hoje · ${cap}`;
  if (chave === amanha) return `Amanhã · ${cap}`;
  return cap;
}

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
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // filtros da lista
  const [fDia, setFDia] = useState("");
  const [fTipo, setFTipo] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fProfessor, setFProfessor] = useState("");
  const [fTurma, setFTurma] = useState("");

  // edição (remarcar)
  const [editId, setEditId] = useState<number | null>(null);
  const [eDataHora, setEDataHora] = useState("");
  const [eDuracao, setEDuracao] = useState(60);
  const [eTipo, setETipo] = useState("aula");
  const [eMateria, setEMateria] = useState("");
  const [eProfessorId, setEProfessorId] = useState("");
  const [eAlunoId, setEAlunoId] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  async function carregar() {
    try {
      const [aulasRes, profRes, alunosRes, turmasRes] = await Promise.all([
        fetch(`${API_URL}/aulas`, { headers: authHeaders() }),
        fetch(`${API_URL}/professores`, { headers: authHeaders() }),
        fetch(`${API_URL}/alunos`, { headers: authHeaders() }),
        fetch(`${API_URL}/turmas`, { headers: authHeaders() }),
      ]);
      setAulas(aulasRes.ok ? await aulasRes.json() : []);
      setProfessores(profRes.ok ? await profRes.json() : []);
      setAlunos(alunosRes.ok ? await alunosRes.json() : []);
      setTurmas(turmasRes.ok ? await turmasRes.json() : []);
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

  function iniciarEdicao(aula: Aula) {
    setEditId(aula.id);
    setEDataHora(paraInput(aula.dataHora));
    setEDuracao(aula.duracao);
    setETipo(aula.tipo === "prova" ? "prova" : "aula");
    setEMateria(aula.materia ?? "");
    setEProfessorId(String(aula.professor.id));
    setEAlunoId(String(aula.aluno.id));
  }

  async function salvarEdicao(e: React.FormEvent) {
    e.preventDefault();
    if (editId === null) return;
    setEditSaving(true);
    try {
      const res = await fetch(`${API_URL}/aulas/${editId}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({
          dataHora: new Date(eDataHora).toISOString(),
          duracao: Number(eDuracao),
          tipo: eTipo,
          materia: eMateria.trim(),
          professorId: Number(eProfessorId),
          alunoId: Number(eAlunoId),
        }),
      });
      if (!res.ok) throw new Error();
      setFeedback("Aula atualizada.");
      setEditId(null);
      await carregar();
    } catch {
      setFeedback("Não foi possível salvar as alterações.");
    } finally {
      setEditSaving(false);
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

  // Agrupa por dia: próximos dias primeiro (do mais perto ao mais longe), depois os anteriores.
  const hoje = diaChave(new Date());
  const amanha = diaChave(new Date(Date.now() + 86400000));
  const porDia = new Map<string, Aula[]>();
  const filtrando = Boolean(fDia || fTipo || fStatus || fProfessor || fTurma);
  const aulasFiltradas = aulas.filter(
    (a) =>
      (!fTipo || a.tipo === fTipo) &&
      (!fStatus || a.status === fStatus) &&
      (!fProfessor || String(a.professor.id) === fProfessor) &&
      (!fTurma || String(a.aluno.turma?.id) === fTurma) &&
      (!fDia || diaChave(new Date(a.dataHora)) === fDia),
  );
  for (const aula of aulasFiltradas) {
    const k = diaChave(new Date(aula.dataHora));
    porDia.set(k, [...(porDia.get(k) ?? []), aula]);
  }
  const chaves = [...porDia.keys()];
  const proximos = chaves.filter((k) => k >= hoje).sort();
  const anteriores = chaves.filter((k) => k < hoje).sort().reverse();
  const dias = [...proximos, ...anteriores].map((k) => ({
    chave: k,
    passado: k < hoje,
    aulas: [...(porDia.get(k) ?? [])].sort((x, y) => x.dataHora.localeCompare(y.dataHora)),
  }));

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Aulas</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {loading
              ? "Carregando..."
              : filtrando
                ? `${aulasFiltradas.length} de ${aulas.length}`
                : `${aulas.length} agendada(s)`}
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
        <div className="flex flex-col gap-8">
          <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-3 dark:border-slate-800 dark:bg-slate-900">
            <input
              className={CAMPO}
              type="date"
              value={fDia}
              onChange={(e) => setFDia(e.target.value)}
              aria-label="Filtrar por dia"
            />
            <select className={CAMPO} value={fTipo} onChange={(e) => setFTipo(e.target.value)}>
              <option value="">Aulas e provas</option>
              <option value="aula">Só aulas</option>
              <option value="prova">Só provas</option>
            </select>
            <select className={CAMPO} value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
              <option value="">Todos os status</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select
              className={CAMPO}
              value={fProfessor}
              onChange={(e) => setFProfessor(e.target.value)}
            >
              <option value="">Todos os professores</option>
              {professores.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </select>
            <select className={CAMPO} value={fTurma} onChange={(e) => setFTurma(e.target.value)}>
              <option value="">Todas as turmas</option>
              {turmas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!filtrando}
              onClick={() => {
                setFDia("");
                setFTipo("");
                setFStatus("");
                setFProfessor("");
                setFTurma("");
              }}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Limpar filtros
            </button>
          </div>
          {dias.length === 0 && <EmptyState label="Nenhuma aula encontrada com esses filtros." />}
          {dias.map((dia, i) => (
            <section key={dia.chave}>
              {dia.passado && !dias[i - 1]?.passado && (
                <p className="mb-4 border-t border-slate-200 pt-6 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:border-slate-800">
                  Dias anteriores
                </p>
              )}
              <h2 className="mb-3 flex items-baseline justify-between text-sm font-semibold text-slate-700 dark:text-slate-200">
                <span>{rotuloDia(dia.chave, hoje, amanha)}</span>
                <span className="text-xs font-normal text-slate-400">
                  {dia.aulas.length} {dia.aulas.length === 1 ? "item" : "itens"}
                </span>
              </h2>
              <ul className="flex flex-col gap-3">
                {dia.aulas.map((aula) =>
                  editId === aula.id ? (
                    <li
                      key={aula.id}
                      className="rounded-xl border border-violet-300 bg-white p-4 shadow-sm dark:border-violet-500/40 dark:bg-slate-900"
                    >
                      <form onSubmit={salvarEdicao} className="flex flex-col gap-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <select className={CAMPO} value={eTipo} onChange={(e) => setETipo(e.target.value)}>
                            <option value="aula">Aula</option>
                            <option value="prova">Prova</option>
                          </select>
                          <input
                            className={CAMPO}
                            placeholder="Matéria"
                            value={eMateria}
                            onChange={(e) => setEMateria(e.target.value)}
                          />
                          <input
                            className={CAMPO}
                            type="datetime-local"
                            value={eDataHora}
                            onChange={(e) => setEDataHora(e.target.value)}
                            required
                          />
                          <input
                            className={CAMPO}
                            type="number"
                            min={1}
                            value={eDuracao}
                            onChange={(e) => setEDuracao(Number(e.target.value))}
                            required
                          />
                          <select
                            className={CAMPO}
                            value={eProfessorId}
                            onChange={(e) => setEProfessorId(e.target.value)}
                            required
                          >
                            {professores.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.nome}
                              </option>
                            ))}
                          </select>
                          <select
                            className={CAMPO}
                            value={eAlunoId}
                            onChange={(e) => setEAlunoId(e.target.value)}
                            required
                          >
                            {alunos.map((a) => (
                              <option key={a.id} value={a.id}>
                                {a.nome}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={editSaving}
                            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-700 disabled:opacity-60"
                          >
                            {editSaving ? "Salvando..." : "Salvar"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditId(null)}
                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    </li>
                  ) : (
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
                  {new Date(aula.dataHora).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: TZ,
                  })}{" "}
                  · {aula.duracao} min
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
              <div className="flex shrink-0 flex-col gap-2">
              <button
                onClick={() => iniciarEdicao(aula)}
                className="shrink-0 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(aula.id)}
                className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-500/10"
              >
                Excluir
              </button>
              </div>
            </li>
                  ),
                )}
              </ul>
            </section>
          ))}
        </div>
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
