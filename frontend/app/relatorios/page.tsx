"use client";

import { useCallback, useEffect, useState } from "react";
import { useSomenteAdmin } from "../hooks/useBloquearAluno";
import { chamar } from "../lib/api";

type Item = {
  id: number;
  dataHora: string;
  duracao: number;
  tipo: string;
  status: string;
  materia: string | null;
  professor: string;
  aluno: string;
  turma: string | null;
};
type Relatorio = {
  totais: { total: number; aulas: number; provas: number; agendadas: number; concluidas: number; canceladas: number; horas: number };
  porProfessor: { professor: string; total: number; aulas: number; provas: number; concluidas: number; canceladas: number }[];
  porMateria: { materia: string; total: number }[];
  porTurma: { turma: string; total: number }[];
  itens: Item[];
};
type Professor = { id: number; nome: string };
type Turma = { id: number; nome: string };

const campo =
  "rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-slate-700 dark:bg-slate-800";

const STATUS: Record<string, string> = { agendada: "Agendada", concluida: "Concluída", cancelada: "Cancelada" };

const dia = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const formatar = (iso: string) => new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

export default function RelatoriosPage() {
  useSomenteAdmin();
  const hoje = new Date();
  const [de, setDe] = useState(dia(new Date(hoje.getFullYear(), hoje.getMonth(), 1)));
  const [ate, setAte] = useState(dia(new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)));
  const [professorId, setProfessorId] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [tipo, setTipo] = useState("");
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [rel, setRel] = useState<Relatorio | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const gerar = useCallback(async () => {
    setLoading(true);
    setErro(null);
    const qs = new URLSearchParams();
    if (de) qs.set("de", de);
    if (ate) qs.set("ate", ate);
    if (professorId) qs.set("professorId", professorId);
    if (turmaId) qs.set("turmaId", turmaId);
    if (tipo) qs.set("tipo", tipo);
    const r = await chamar<Relatorio>(`/relatorios?${qs.toString()}`);
    if (r.ok && r.data) setRel(r.data);
    else setErro(r.erro ?? "Não foi possível gerar o relatório.");
    setLoading(false);
  }, [de, ate, professorId, turmaId, tipo]);

  useEffect(() => {
    (async () => {
      const [p, t] = await Promise.all([chamar<Professor[]>("/professores"), chamar<Turma[]>("/turmas")]);
      setProfessores(p.ok && p.data ? p.data : []);
      setTurmas(t.ok && t.data ? t.data : []);
    })();
    gerar();
    // carga inicial apenas; depois só pelo botão "Gerar"
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function exportarCsv() {
    if (!rel) return;
    const aspas = (v: string | number | null) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const linhas = [
      ["Data", "Tipo", "Matéria", "Professor", "Aluno", "Turma", "Duração (min)", "Status"],
      ...rel.itens.map((i) => [
        formatar(i.dataHora),
        i.tipo === "prova" ? "Prova" : "Aula",
        i.materia ?? "",
        i.professor,
        i.aluno,
        i.turma ?? "",
        i.duracao,
        STATUS[i.status] ?? i.status,
      ]),
    ];
    const csv = "﻿" + linhas.map((l) => l.map(aspas).join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-${de || "inicio"}-a-${ate || "hoje"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const t = rel?.totais;
  const cartoes = t
    ? [
        ["Total", t.total],
        ["Aulas", t.aulas],
        ["Provas", t.provas],
        ["Concluídas", t.concluidas],
        ["Canceladas", t.canceladas],
        ["Horas (sem canceladas)", t.horas],
      ]
    : [];

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Relatórios</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Aulas e provas por período, professor e turma.</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button onClick={exportarCsv} disabled={!rel || rel.itens.length === 0} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            Exportar CSV
          </button>
          <button onClick={() => window.print()} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            Imprimir / PDF
          </button>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          gerar();
        }}
        className="mb-8 grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-6 dark:border-slate-800 dark:bg-slate-900 print:hidden"
      >
        <label className="text-xs font-medium text-slate-500">
          De
          <input type="date" className={`${campo} mt-1 w-full`} value={de} onChange={(e) => setDe(e.target.value)} />
        </label>
        <label className="text-xs font-medium text-slate-500">
          Até
          <input type="date" className={`${campo} mt-1 w-full`} value={ate} onChange={(e) => setAte(e.target.value)} />
        </label>
        <label className="text-xs font-medium text-slate-500">
          Professor
          <select className={`${campo} mt-1 w-full`} value={professorId} onChange={(e) => setProfessorId(e.target.value)}>
            <option value="">Todos</option>
            {professores.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-slate-500">
          Turma
          <select className={`${campo} mt-1 w-full`} value={turmaId} onChange={(e) => setTurmaId(e.target.value)}>
            <option value="">Todas</option>
            {turmas.map((tm) => (
              <option key={tm.id} value={tm.id}>
                {tm.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-slate-500">
          Tipo
          <select className={`${campo} mt-1 w-full`} value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Aulas e provas</option>
            <option value="aula">Só aulas</option>
            <option value="prova">Só provas</option>
          </select>
        </label>
        <button className="self-end rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700" type="submit">
          Gerar
        </button>
      </form>

      {erro && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
          {erro}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Gerando...</p>
      ) : rel && rel.itens.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Nenhuma aula ou prova nesse filtro.
        </div>
      ) : (
        rel && (
          <>
            <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {cartoes.map(([rotulo, valor]) => (
                <div key={rotulo} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{valor}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{rotulo}</p>
                </div>
              ))}
            </div>

            <div className="mb-8 grid gap-6 lg:grid-cols-3">
              <Tabela titulo="Por professor" colunas={["Professor", "Total", "Aulas", "Provas"]} linhas={rel.porProfessor.map((p) => [p.professor, p.total, p.aulas, p.provas])} />
              <Tabela titulo="Por matéria" colunas={["Matéria", "Total"]} linhas={rel.porMateria.map((m) => [m.materia, m.total])} />
              <Tabela titulo="Por turma" colunas={["Turma", "Total"]} linhas={rel.porTurma.map((x) => [x.turma, x.total])} />
            </div>

            <h2 className="mb-3 font-semibold text-slate-900 dark:text-white">Detalhe ({rel.itens.length})</h2>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
                  <tr>
                    {["Data", "Tipo", "Matéria", "Professor", "Aluno", "Turma", "Status"].map((c) => (
                      <th key={c} className="px-3 py-2 font-medium">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rel.itens.map((i) => (
                    <tr key={i.id} className="text-slate-700 dark:text-slate-300">
                      <td className="whitespace-nowrap px-3 py-2">{formatar(i.dataHora)}</td>
                      <td className="px-3 py-2">{i.tipo === "prova" ? "Prova" : "Aula"}</td>
                      <td className="px-3 py-2">{i.materia ?? "—"}</td>
                      <td className="px-3 py-2">{i.professor}</td>
                      <td className="px-3 py-2">{i.aluno}</td>
                      <td className="px-3 py-2">{i.turma ?? "—"}</td>
                      <td className="px-3 py-2">{STATUS[i.status] ?? i.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )
      )}
    </div>
  );
}

function Tabela({ titulo, colunas, linhas }: { titulo: string; colunas: string[]; linhas: (string | number)[][] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <h3 className="border-b border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:text-white">{titulo}</h3>
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase text-slate-500">
          <tr>
            {colunas.map((c, idx) => (
              <th key={c} className={`px-3 py-1.5 font-medium ${idx > 0 ? "text-right" : ""}`}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {linhas.map((l, i) => (
            <tr key={i} className="text-slate-700 dark:text-slate-300">
              {l.map((v, idx) => (
                <td key={idx} className={`px-3 py-1.5 ${idx > 0 ? "text-right" : ""}`}>
                  {v}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
