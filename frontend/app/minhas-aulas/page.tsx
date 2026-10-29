"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Aula = {
  id: number;
  dataHora: string;
  duracao: number;
  status: string;
  tipo: string;
  materia: string | null;
  professor: { id: number; nome: string };
  aluno: { id: number; nome: string };
};

type UsuarioLogado = {
  role: "ALUNO" | "PROFESSOR" | "ADMIN" | "SUPERADMIN";
  id?: number;
  nome: string;
  email: string;
  serie?: string;
  disciplina?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

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

export default function MinhasAulasPage() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("cb_token");
    const usuarioSalvo = localStorage.getItem("cb_usuario");

    if (!token || !usuarioSalvo) {
      router.push("/login");
      return;
    }

    const usuarioParsed: UsuarioLogado = JSON.parse(usuarioSalvo);

    if (usuarioParsed.role === "ADMIN" || usuarioParsed.role === "SUPERADMIN") {
      router.push("/");
      return;
    }

    setUsuario(usuarioParsed);

    fetch(`${API_URL}/aulas/minhas`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem("cb_token");
          localStorage.removeItem("cb_usuario");
          router.push("/login");
          return null;
        }
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (data) setAulas(data);
      })
      .catch(() => setErro("Não foi possível carregar suas aulas."))
      .finally(() => setLoading(false));
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("cb_token");
    localStorage.removeItem("cb_usuario");
    router.push("/login");
  }

  const ehProfessor = usuario?.role === "PROFESSOR";

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Minhas aulas
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {usuario ? `Olá, ${usuario.nome}` : "Carregando..."}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Sair
        </button>
      </div>

      {erro && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
          {erro}
        </div>
      )}

      {loading ? (
        <MinhasAulasSkeleton />
      ) : aulas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Você ainda não tem aulas ou provas agendadas.
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {aulas.map((aula) => (
            <li
              key={aula.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
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
                {ehProfessor ? `Aluno: ${aula.aluno.nome}` : `Prof. ${aula.professor.nome}`}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {new Date(aula.dataHora).toLocaleString("pt-BR")} · {aula.duracao} min
              </p>
              <span
                className={`mt-2 inline-block rounded-lg border px-2 py-1 text-xs font-medium ${
                  STATUS_STYLES[aula.status] ?? STATUS_STYLES.agendada
                }`}
              >
                {STATUS_LABELS[aula.status] ?? aula.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MinhasAulasSkeleton() {
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
