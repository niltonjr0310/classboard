"use client";

import { useEffect, useRef, useState } from "react";
import { useSomenteAdmin } from "../hooks/useBloquearAluno";
import { API_URL, authHeaders } from "../lib/api";

type Aluno = {
  id: number;
  nome: string;
  email: string;
  serie: string;
  turma?: { id: number; nome: string } | null;
  responsavelNome?: string | null;
  responsavelEmail?: string | null;
  responsavelTelefone?: string | null;
  consentimentoEm?: string | null;
};

type TurmaOpcao = { id: number; nome: string };


export default function AlunosPage() {
  useSomenteAdmin();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [serie, setSerie] = useState("");
  const [turmas, setTurmas] = useState<TurmaOpcao[]>([]);
  const [turmaId, setTurmaId] = useState("");
  const [respNome, setRespNome] = useState("");
  const [respEmail, setRespEmail] = useState("");
  const [respTel, setRespTel] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [busca, setBusca] = useState("");
  const [filtroTurma, setFiltroTurma] = useState(""); // "" = todas, "sem" = sem turma, ou o id da turma
  const [massMode, setMassMode] = useState(false);
  const [massText, setMassText] = useState("");
  const [massSaving, setMassSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function carregar() {
    try {
      const res = await fetch(`${API_URL}/alunos`, { headers: authHeaders() });
      const data = await res.json();
      setAlunos(Array.isArray(data) ? data : []);
      const resTurmas = await fetch(`${API_URL}/turmas`, { headers: authHeaders() });
      const dataTurmas = resTurmas.ok ? await resTurmas.json() : [];
      setTurmas(Array.isArray(dataTurmas) ? dataTurmas : []);
    } catch {
      setFeedback("Não foi possível carregar os alunos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  async function handleTurmaChange(aluno: Aluno, valor: string) {
    const turma = turmas.find((t) => String(t.id) === valor);
    try {
      const res = await fetch(`${API_URL}/alunos/${aluno.id}`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify(
          turma ? { turmaId: turma.id, serie: turma.nome } : { turmaId: null },
        ),
      });
      if (!res.ok) throw new Error();
      await carregar();
    } catch {
      setFeedback("Não foi possível mudar a turma do aluno.");
    }
  }

  async function mensagemErro(res: Response, padrao: string) {
    const corpo = await res.json().catch(() => null);
    const msg = Array.isArray(corpo?.message) ? corpo.message.join(" ") : corpo?.message;
    return msg || padrao;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const turmaEscolhida = turmas.find((t) => String(t.id) === turmaId);
    try {
      const res = await fetch(`${API_URL}/alunos`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          ...(turmaEscolhida
            ? { nome, email, serie: turmaEscolhida.nome, turmaId: turmaEscolhida.id }
            : { nome, email, serie }),
          ...(respEmail.trim()
            ? {
                responsavelNome: respNome.trim() || null,
                responsavelEmail: respEmail.trim(),
                responsavelTelefone: respTel.trim() || null,
              }
            : {}),
        }),
      });
      if (!res.ok) {
        setFeedback(await mensagemErro(res, "Erro ao cadastrar aluno."));
        return;
      }
      setNome("");
      setEmail("");
      setSerie("");
      setTurmaId("");
      setRespNome("");
      setRespEmail("");
      setRespTel("");
      setFeedback(
        respEmail.trim()
          ? `Aluno "${nome}" cadastrado. Pedido de autorização enviado ao responsável.`
          : `Aluno "${nome}" cadastrado com sucesso.`,
      );
      await carregar();
    } catch {
      setFeedback("Erro ao cadastrar aluno.");
    } finally {
      setSaving(false);
    }
  }

  async function reenviarPedido(a: Aluno) {
    const res = await fetch(`${API_URL}/alunos/${a.id}/consentimento/reenviar`, {
      method: "POST",
      headers: authHeaders(),
    });
    setFeedback(
      res.ok
        ? `Pedido reenviado para ${a.responsavelEmail}.`
        : "Não foi possível reenviar o pedido.",
    );
  }

  async function handleDelete(id: number, nomeAluno: string) {
    if (!confirm(`Excluir o aluno "${nomeAluno}"? Isso apaga também todas as aulas, provas e avisos dele. Não dá para desfazer.`)) return;
    try {
      const res = await fetch(`${API_URL}/alunos/${id}`, { method: "DELETE", headers: authHeaders() });
      if (!res.ok) {
        setFeedback(await mensagemErro(res, "Não foi possível excluir o aluno."));
        return;
      }
      setFeedback(`Aluno "${nomeAluno}" removido.`);
      await carregar();
    } catch {
      setFeedback("Não foi possível excluir. Verifique se ele tem aulas vinculadas.");
    }
  }

  function parseMassLines(text: string) {
    const linhas = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const validos: { nome: string; email: string; serie: string }[] = [];
    const invalidos: number[] = [];

    linhas.forEach((linha, i) => {
      const partes = linha.split(",").map((p) => p.trim());
      if (partes.length !== 3 || partes.some((p) => !p)) {
        invalidos.push(i + 1);
        return;
      }
      const [nome, email, serie] = partes;
      validos.push({ nome, email, serie });
    });

    return { validos, invalidos };
  }

  function parseCsvToLines(text: string): string {
    const linhasBrutas = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (linhasBrutas.length === 0) return "";

    const primeira = linhasBrutas[0];
    const delimitador = (primeira.match(/;/g) ?? []).length > (primeira.match(/,/g) ?? []).length ? ";" : ",";

    const linhas = linhasBrutas.map((linha) =>
      linha.split(delimitador).map((campo) => campo.trim().replace(/^"|"$/g, ""))
    );

    const cabecalho = linhas[0].join(" ").toLowerCase();
    const temCabecalho = cabecalho.includes("nome") && cabecalho.includes("email");
    const dados = temCabecalho ? linhas.slice(1) : linhas;

    return dados
      .filter((campos) => campos.length >= 3 && campos.some((c) => c))
      .map((campos) => campos.slice(0, 3).join(", "))
      .join("\n");
  }

  function handleBaixarModelo() {
    const conteudo =
      "Nome,Email,Série\nJoão Pedro,joao@escola.com,9 ano\nAna Souza,ana@escola.com,8 ano\n";
    const blob = new Blob(["﻿" + conteudo], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "modelo-alunos.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const texto = String(reader.result ?? "");
      const convertido = parseCsvToLines(texto);
      if (!convertido) {
        setFeedback("Não consegui ler linhas válidas desse arquivo.");
        return;
      }
      setMassText(convertido);
      setMassMode(true);
    };
    reader.readAsText(file, "utf-8");
    e.target.value = "";
  }

  async function handleMassSubmit(e: React.FormEvent) {
    e.preventDefault();
    const { validos, invalidos } = parseMassLines(massText);

    if (validos.length === 0) {
      setFeedback("Nenhuma linha válida encontrada. Use o formato Nome, Email, Série.");
      return;
    }

    setMassSaving(true);
    let sucesso = 0;
    let falha = 0;

    for (const a of validos) {
      try {
        const res = await fetch(`${API_URL}/alunos`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify(a),
        });
        if (res.ok) sucesso++;
        else falha++;
      } catch {
        falha++;
      }
    }

    setMassSaving(false);
    await carregar();

    const partes = [`${sucesso} aluno(s) cadastrado(s).`];
    if (falha > 0) partes.push(`${falha} falharam.`);
    if (invalidos.length > 0) {
      partes.push(`Linha(s) ignorada(s) por formato inválido: ${invalidos.join(", ")}.`);
    }
    setFeedback(partes.join(" "));

    if (falha === 0 && invalidos.length === 0) {
      setMassText("");
      setMassMode(false);
    }
  }

  // Agrupa por turma (ordem natural: 6º A, 7º A, ...), "Sem turma" por último.
  const termo = busca.trim().toLowerCase();
  const porBusca = termo
    ? alunos.filter(
        (a) => a.nome.toLowerCase().includes(termo) || a.email.toLowerCase().includes(termo),
      )
    : alunos;
  const filtrados = porBusca.filter((a) =>
    filtroTurma === ""
      ? true
      : filtroTurma === "sem"
        ? !a.turma
        : String(a.turma?.id) === filtroTurma,
  );
  const contagemTurma = (id: number) => porBusca.filter((a) => a.turma?.id === id).length;
  const semTurma = porBusca.filter((a) => !a.turma).length;
  const porTurma = new Map<string, Aluno[]>();
  for (const a of filtrados) {
    const chave = a.turma?.nome ?? "Sem turma";
    porTurma.set(chave, [...(porTurma.get(chave) ?? []), a]);
  }
  const grupos: [string, Aluno[]][] = [...porTurma.entries()]
    .sort(([x], [y]) => {
      if (x === "Sem turma") return 1;
      if (y === "Sem turma") return -1;
      return x.localeCompare(y, "pt-BR", { numeric: true });
    })
    .map(([nomeTurma, lista]): [string, Aluno[]] => [
      nomeTurma,
      [...lista].sort((p, q) => p.nome.localeCompare(q.nome, "pt-BR")),
    ]);

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

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {massMode ? "Cadastro em massa" : "Cadastrar aluno"}
          </h2>
          <button
            type="button"
            onClick={() => setMassMode((v) => !v)}
            className="text-sm font-medium text-emerald-600 hover:underline dark:text-emerald-400"
          >
            {massMode ? "Cadastrar um por um" : "Cadastrar em massa"}
          </button>
        </div>

        {massMode ? (
          <form onSubmit={handleMassSubmit} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Um aluno por linha, no formato: <code>Nome, Email, Série</code>
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBaixarModelo}
                  className="text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  Baixar modelo CSV
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Importar CSV
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            <textarea
              className="h-36 rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800"
              placeholder={"João Pedro, joao@escola.com, 9 ano\nAna Souza, ana@escola.com, 8 ano"}
              value={massText}
              onChange={(e) => setMassText(e.target.value)}
            />
            <button
              className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
              type="submit"
              disabled={massSaving || !massText.trim()}
            >
              {massSaving ? "Cadastrando..." : "Cadastrar todos"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
            {turmas.length > 0 ? (
              <select
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800"
                value={turmaId}
                onChange={(e) => setTurmaId(e.target.value)}
                required
              >
                <option value="">Selecione a turma</option>
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}
              </select>
            ) : (
              <>
                <input
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800"
                  placeholder="Série"
                  value={serie}
                  onChange={(e) => setSerie(e.target.value)}
                  required
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cadastre turmas na aba Turmas para escolher aqui em vez de digitar a série.
                </p>
              </>
            )}
            <fieldset className="flex flex-col gap-3 rounded-lg border border-dashed border-slate-300 p-3 dark:border-slate-700">
              <legend className="px-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                Responsável (recebe o pedido de autorização por e-mail)
              </legend>
              <div className="grid gap-3 sm:grid-cols-3">
                <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800" placeholder="Nome do responsável" value={respNome} onChange={(e) => setRespNome(e.target.value)} />
                <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800" placeholder="E-mail do responsável" type="email" value={respEmail} onChange={(e) => setRespEmail(e.target.value)} />
                <input className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800" placeholder="Telefone" value={respTel} onChange={(e) => setRespTel(e.target.value)} />
              </div>
            </fieldset>
            <button
              className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
              type="submit"
              disabled={saving}
            >
              {saving ? "Adicionando..." : "Adicionar aluno"}
            </button>
          </form>
        )}
      </div>

      {loading ? (
        <AlunosSkeleton />
      ) : alunos.length === 0 ? (
        <EmptyState label="Nenhum aluno cadastrado ainda." />
      ) : (
        <div className="flex flex-col gap-6">
          <input
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800"
            placeholder="Buscar aluno por nome ou e-mail"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          {(turmas.length > 0 || semTurma > 0) && (
            <div className="flex flex-wrap gap-2">
              {[
                { valor: "", rotulo: "Todas", total: porBusca.length },
                ...[...turmas]
                  .sort((x, y) => x.nome.localeCompare(y.nome, "pt-BR", { numeric: true }))
                  .map((t) => ({ valor: String(t.id), rotulo: t.nome, total: contagemTurma(t.id) })),
                ...(semTurma > 0 ? [{ valor: "sem", rotulo: "Sem turma", total: semTurma }] : []),
              ].map((op) => (
                <button
                  key={op.valor || "todas"}
                  type="button"
                  onClick={() => setFiltroTurma(op.valor)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    filtroTurma === op.valor
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  {op.rotulo} · {op.total}
                </button>
              ))}
            </div>
          )}
          {grupos.length === 0 && (
            <EmptyState label="Nenhum aluno encontrado para essa busca." />
          )}
          {grupos.map(([nomeTurma, lista]) => (
            <details key={nomeTurma} open className="group">
              <summary className="mb-3 flex cursor-pointer list-none items-baseline justify-between text-sm font-semibold text-slate-700 dark:text-slate-200">
                <span>{nomeTurma}</span>
                <span className="text-xs font-normal text-slate-400">
                  {lista.length} {lista.length === 1 ? "aluno" : "alunos"}
                </span>
              </summary>
              <ul className="flex flex-col gap-3">
                {lista.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
            >
              <div>
                <p className="font-medium text-slate-900 dark:text-white">{a.nome}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {a.email} · {a.turma?.nome ?? a.serie}
                </p>
                <p className="mt-1 text-xs">
                  {a.consentimentoEm ? (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      ✓ Responsável autorizou em {new Date(a.consentimentoEm).toLocaleDateString("pt-BR")}
                    </span>
                  ) : a.responsavelEmail ? (
                    <span className="text-amber-600 dark:text-amber-400">
                      Aguardando autorização de {a.responsavelNome || a.responsavelEmail}{" "}
                      <button type="button" onClick={() => reenviarPedido(a)} className="underline">
                        reenviar
                      </button>
                    </span>
                  ) : (
                    <span className="text-slate-400">Sem responsável cadastrado</span>
                  )}
                </p>
                {turmas.length > 0 && (
                  <select
                    className="mt-2 rounded-lg border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                    value={a.turma?.id ?? ""}
                    onChange={(e) => handleTurmaChange(a, e.target.value)}
                  >
                    <option value="">Sem turma</option>
                    {turmas.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome}
                      </option>
                    ))}
                  </select>
                )}
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
            </details>
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
