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

  async function carregar() {
    const res = await fetch(`${API_URL}/alunos`);
    const data = await res.json();
    setAlunos(data);
    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`${API_URL}/alunos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, serie }),
    });
    setNome("");
    setEmail("");
    setSerie("");
    carregar();
  }

  async function handleDelete(id: number) {
    await fetch(`${API_URL}/alunos/${id}`, { method: "DELETE" });
    carregar();
  }

  return (
    <div className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-2xl font-bold">Alunos</h1>

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
          placeholder="Série"
          value={serie}
          onChange={(e) => setSerie(e.target.value)}
          required
        />
        <button className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700" type="submit">
          Adicionar
        </button>
      </form>

      {loading ? (
        <p>Carregando...</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {alunos.map((a) => (
            <li key={a.id} className="flex items-center justify-between rounded border p-3">
              <div>
                <p className="font-medium">{a.nome}</p>
                <p className="text-sm text-zinc-600">{a.email} — {a.serie}</p>
              </div>
              <button
                onClick={() => handleDelete(a.id)}
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