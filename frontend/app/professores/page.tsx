"use client";

import { useEffect, useRef, useState } from "react";
import { useSomenteAdmin } from "../hooks/useBloquearAluno";
import { API_URL, authHeaders } from "../lib/api";

type Professor = {
  id: number;
  nome: string;
  email: string;
  disciplina: string;
};


type ErroImport = { linha: number; texto: string; motivo: string };

export default function ProfessoresPage() {
  useSomenteAdmin();
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [disciplina, setDisciplina] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [massMode, setMassMode] = useState(false);
  const [massText, setMassText] = useState("");
  const [errosImport, setErrosImport] = useState<ErroImport[]>([]);
  const [massSaving, setMassSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function carregar() {
    try {
      const res = await fetch(`${API_URL}/professores`, { headers: authHeaders() });
      const data = await res.json();
      setProfessores(Array.isArray(data) ? data : []);
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
        headers: authHeaders(),
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
      const res = await fetch(`${API_URL}/professores/${id}`, { method: "DELETE", headers: authHeaders() });
      if (!res.ok) {
        const corpo = await res.json().catch(() => null);
        setFeedback(corpo?.message || "Não foi possível excluir o professor.");
        return;
      }
      setFeedback(`Professor "${nomeProfessor}" removido.`);
      await carregar();
    } catch {
      setFeedback("Não foi possível excluir. Verifique se ele tem aulas vinculadas.");
    }
  }

  function parseMassLines(text: string) {
    const validos: { linha: number; texto: string; dados: { nome: string; email: string; disciplina: string } }[] = [];
    const erros: ErroImport[] = [];
    const vistos = new Map<string, number>();

    text.split(/\r?\n/).forEach((bruta, i) => {
      const texto = bruta.trim();
      if (!texto) return;
      const linha = i + 1;
      const partes = texto.split(",").map((p) => p.trim());
      if (partes.length !== 3) {
        erros.push({ linha, texto, motivo: `Esperado 3 campos (Nome, Email, Disciplina), encontrei ${partes.length}.` });
        return;
      }
      const [nome, email, disciplina] = partes;
      if (!nome || !email || !disciplina) {
        erros.push({ linha, texto, motivo: "Tem campo vazio." });
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        erros.push({ linha, texto, motivo: `E-mail inválido: "${email}".` });
        return;
      }
      const chave = email.toLowerCase();
      if (vistos.has(chave)) {
        erros.push({ linha, texto, motivo: `E-mail repetido (já aparece na linha ${vistos.get(chave)}).` });
        return;
      }
      vistos.set(chave, linha);
      validos.push({ linha, texto, dados: { nome, email, disciplina } });
    });

    return { validos, erros };
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
      "Nome,Email,Disciplina\nMaria Silva,maria@escola.com,Matemática\nJoão Souza,joao@escola.com,História\n";
    const blob = new Blob(["﻿" + conteudo], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "modelo-professores.csv";
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
    const { validos, erros } = parseMassLines(massText);

    if (validos.length === 0 && erros.length === 0) {
      setFeedback("Nenhuma linha encontrada. Use o formato Nome, Email, Disciplina.");
      return;
    }

    setMassSaving(true);
    let sucesso = 0;

    for (const v of validos) {
      try {
        const res = await fetch(`${API_URL}/professores`, {
          method: "POST",
          headers: authHeaders(),
          body: JSON.stringify(v.dados),
        });
        if (res.ok) {
          sucesso++;
        } else {
          const corpo = await res.json().catch(() => null);
          const msg = Array.isArray(corpo?.message) ? corpo.message.join(" ") : corpo?.message;
          erros.push({ linha: v.linha, texto: v.texto, motivo: msg || `Erro do servidor (${res.status}).` });
        }
      } catch {
        erros.push({ linha: v.linha, texto: v.texto, motivo: "Sem conexão com o servidor." });
      }
    }

    setMassSaving(false);
    await carregar();

    erros.sort((x, y) => x.linha - y.linha);
    setErrosImport(erros);
    const partes = [`${sucesso} professor(es) cadastrado(s).`];
    if (erros.length > 0) partes.push(`${erros.length} linha(s) com problema: veja o motivo abaixo.`);
    setFeedback(partes.join(" "));

    if (erros.length === 0) {
      setMassText("");
      setMassMode(false);
    } else {
      // Deixa no campo só as linhas com problema, para corrigir e enviar de novo.
      setMassText(erros.map((x) => x.texto).join("\n"));
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

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {massMode ? "Cadastro em massa" : "Cadastrar professor"}
          </h2>
          <button
            type="button"
            onClick={() => setMassMode((v) => !v)}
            className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            {massMode ? "Cadastrar um por um" : "Cadastrar em massa"}
          </button>
        </div>

        {massMode ? (
          <form onSubmit={handleMassSubmit} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Um professor por linha, no formato: <code>Nome, Email, Disciplina</code>
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBaixarModelo}
                  className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
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
            {errosImport.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
                <p className="mb-1 font-semibold">
                  {errosImport.length} linha(s) com problema. Só elas ficaram no campo abaixo: corrija e envie de novo.
                </p>
                <ul className="list-disc pl-4">
                  {errosImport.map((x) => (
                    <li key={x.linha}>
                      <strong>Linha {x.linha}:</strong> {x.motivo} <code className="break-all">{x.texto}</code>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <textarea
              className="h-36 rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800"
              placeholder={"Maria Silva, maria@escola.com, Matemática\nJoão Souza, joao@escola.com, História"}
              value={massText}
              onChange={(e) => setMassText(e.target.value)}
            />
            <button
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
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
        )}
      </div>

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
