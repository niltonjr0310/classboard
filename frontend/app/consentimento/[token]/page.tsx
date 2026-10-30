"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { API_URL } from "../../lib/api";

type Info = {
  escola: string;
  aluno: string;
  responsavel: string | null;
  autorizadoEm: string | null;
  expirado: boolean;
};

export default function ConsentimentoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [info, setInfo] = useState<Info | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [aceito, setAceito] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [feito, setFeito] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/consentimento/${token}`)
      .then(async (r) => {
        if (!r.ok) throw new Error();
        setInfo(await r.json());
      })
      .catch(() => setErro("Link inválido ou substituído. Peça à escola para enviar outro."));
  }, [token]);

  async function autorizar() {
    setEnviando(true);
    const r = await fetch(`${API_URL}/consentimento/${token}/autorizar`, { method: "POST" }).catch(() => null);
    setEnviando(false);
    if (r?.ok) setFeito(true);
    else setErro("Não foi possível registrar agora. Tente de novo em instantes.");
  }

  const ja = feito || !!info?.autorizadoEm;

  return (
    <div className="mx-auto max-w-xl px-6 py-10 text-slate-700 dark:text-slate-300">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Autorização do responsável</h1>
      {!info && !erro && <p className="mt-4">Carregando...</p>}
      {erro && <p className="mt-4 text-red-600 dark:text-red-400">{erro}</p>}
      {info && (
        <div className="mt-4 flex flex-col gap-3 leading-relaxed">
          <p>
            {info.responsavel ? `Olá, ${info.responsavel}. ` : ""}A <strong>{info.escola}</strong> usa o ClassBoard
            para agendar aulas e provas de reforço e avisar por notificação e e-mail.
          </p>
          <p>
            Para cadastrar o(a) estudante <strong>{info.aluno}</strong>, tratamos: nome, e-mail, turma e as aulas e
            provas agendadas. Os dados servem só para a organização escolar, ficam em servidores no Brasil e no
            exterior (Render, Neon, Vercel, Brevo) e podem ser consultados, corrigidos ou apagados a qualquer
            momento, pedindo à escola. Detalhes na{" "}
            <Link href="/privacidade" className="underline" target="_blank">Política de Privacidade</Link>.
          </p>
          {ja ? (
            <p className="rounded-lg bg-emerald-50 p-3 font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              ✓ Autorização registrada. Obrigado!
            </p>
          ) : info.expirado ? (
            <p className="text-amber-600 dark:text-amber-400">
              Este link expirou. Peça à escola para enviar um novo pedido.
            </p>
          ) : (
            <>
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-1" checked={aceito} onChange={(e) => setAceito(e.target.checked)} />
                <span>
                  Sou o(a) responsável legal por {info.aluno} e autorizo o tratamento dos dados descrito acima.
                </span>
              </label>
              <button
                onClick={autorizar}
                disabled={!aceito || enviando}
                className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {enviando ? "Registrando..." : "Autorizar"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
