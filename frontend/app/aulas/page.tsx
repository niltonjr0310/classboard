"use client";

import { useEffect, useState } from "react";

type Professor = { id: number; nome: string };
type Aluno = { id: number; nome: string };
type Aula = {
  id: number;
  dataHora: string;
  duracao: number;
  status: string;
  professor: Professor;
  aluno: Aluno;
};

const API_URL = "http://localhost:3000";

export default function AulasPage() {
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [dataHora, setDataHora] = useState("");
  const [duracao, setDuracao] = useState(60);
  const [professorId, setProfessorId] = useState("");
  const [alunoId, setAlunoId] = useState("");
  const [loading, setLoading] = useState(true);

  async function carregar() {
    const [aulasRes, profRes, alunosRes] = await Promise.all([
      fetch(`${API_URL}/aulas`),
      fetch(`${API_URL}/professores`),
      fetch(`${API_URL}/alunos`),
    ]);
    setAulas(await aulasRes.json());
    setProfessores(await profRes.json());
    setAlunos(await alunosRes.json());
    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`${API_URL}/aulas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dataHora: new Date(dataHora).toISOString(),
        duracao: Number(duracao),
        professorId: Number(professorId),
        alunoId: Number(alunoId),
      }),
    });
    setDataHora("");
    setDuracao(60);
    setProfessorId("");
    setAlunoId("");
    carregar();
  }

  async function handleDelete(id: number) {
    await fetch(`${API_URL}/aulas/${id}`, { method: "DELETE" });
    carregar();
  }

  async function handleStatusChange(id: number, status: string) {
    await fetch(`${API_URL}/aulas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    carregar();
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-bold">Aulas</h1>

      <form onSubmit={handleSubmit} className="mb-8 flex flex-col gap-3 rounded border p-4">
        <input
          className="rounded border px-3 py-2"
          type="datetime-local"
          value={dataHora}
          onChange={(e) => setDataHora(e.target.value)}
          required
        />
        <input
          className="rounded border px-3 py-2"
          type="number"
          placeholder="Duração (min)"
          value={duracao}
          onChange={(e) => setDuracao(Number(e.target.value))}
          required
        />
        <select
          className="rounded border px-3 py-2"
          value={professorId}
          onChange={(e) => setProfessorId(e.target.value)}
          required
        >
          <option value="">Selecione o professor</option>
          {professores.map((p) => (
            <option key={p.id} value={p.id}>{p.nome}</option>
          ))}
        </select>
        <select
          className="rounded border px-3 py-2"
          value={alunoId}
          onChange={(e) => setAlunoId(e.target.value)}
          required
        >
          <option value="">Selecione o aluno</option>
          {alunos.map((a) => (
            <option key={a.id} value={a.id}>{a.nome}</option>
          ))}
        </select>
        <button className="rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700" type="submit">
          Agendar
        </button>
      </form>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {aulas.map((aula) => (
            <li key={aula.id} className="flex items-center justify-between rounded border p-3">
              <div>
                <p className="font-medium">
                  {aula.professor.nome} → {aula.aluno.nome}
                </p>
                <p className="text-sm text-zinc-600">
                  {new Date(aula.dataHora).toLocaleString("pt-BR")} — {aula.duracao} min
                </p>
                <select
                  className="mt-1 rounded border px-2 py-1 text-sm"
                  value={aula.status}
                  onChange={(e) => handleStatusChange(aula.id, e.target.value)}
                >
                  <option value="agendada">Agendada</option>
                  <option value="concluida">Concluída</option>
                  <option value="cancelada">Cancelada</option>
                </select>
              </div>
              <button
                onClick={() => handleDelete(aula.id)}
                className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
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