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

  async function carregar() {
    const res = await fetch(`${API_URL}/professores`);
    const data = await res.json();
    setProfessores(data);
    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`${API_URL}/professores`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, disciplina }),
    });
    setNome("");
    setEmail("");
    setDisciplina("");
    carregar();
  }

  async function handleDelete(id: number) {
    await fetch(`${API_URL}/professores/${id}`, { method: "DELETE" });
    carregar();
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-bold">Professores</h1>

      <form onSubmit={handleSubmit} className="mb-8 flex flex-col gap-3 rounded border p-4">
        <input
          className="rounded border px-3 py-2"
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
        <input
          className="rounded border px-3 py-2"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="rounded border px-3 py-2"
          placeholder="Disciplina"
          value={disciplina}
          onChange={(e) => setDisciplina(e.target.value)}
          required
        />
        <button className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700" type="submit">
          Adicionar
        </button>
      </form>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {professores.map((p) => (
            <li key={p.id} className="flex items-center justify-between rounded border p-3">
              <div>
                <p className="font-medium">{p.nome}</p>
                <p className="text-sm text-zinc-600">{p.email} — {p.disciplina}</p>
              </div>
              <button
                onClick={() => handleDelete(p.id)}
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