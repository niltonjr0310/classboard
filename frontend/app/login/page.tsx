"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { GoogleLogin } from "@react-oauth/google";
import Logo from "../components/Logo";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function LoginPage() {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [aceitou, setAceitou] = useState(false);

  async function handleSuccess(credentialResponse: { credential?: string }) {
    if (!credentialResponse.credential) return;
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || "Não foi possível entrar.");
      }

      const data = await res.json();
      localStorage.setItem("cb_token", data.token);
      localStorage.setItem("cb_usuario", JSON.stringify(data.usuario));
      localStorage.removeItem("cb_escola");

      if (data.usuario.role === "SUPERADMIN") {
        router.push("/escolas");
      } else if (data.usuario.role === "ADMIN") {
        router.push("/");
      } else {
        router.push("/minhas-aulas");
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao entrar com Google.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <Logo className="h-12 w-12" />
      <h1 className="mt-5 text-2xl font-bold text-slate-900 dark:text-white">
        Entrar no ClassBoard
      </h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Entre com a sua conta Google para ver suas aulas ou administrar o sistema.
      </p>

      <label className="mt-8 flex max-w-sm cursor-pointer items-start gap-2 text-left text-sm text-slate-600 dark:text-slate-300">
        <input
          type="checkbox"
          checked={aceitou}
          onChange={(e) => setAceitou(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-violet-600"
        />
        <span>
          Li e aceito os{" "}
          <Link href="/termos" target="_blank" className="font-medium text-violet-600 underline dark:text-violet-400">
            Termos de Uso
          </Link>{" "}
          e a{" "}
          <Link href="/privacidade" target="_blank" className="font-medium text-violet-600 underline dark:text-violet-400">
            Política de Privacidade
          </Link>
          .
        </span>
      </label>

      <div className="mt-5 min-h-[44px]">
        {!aceitou ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Marque a caixa acima para liberar o login.
          </p>
        ) : carregando ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Entrando...</p>
        ) : (
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => setErro("Não foi possível entrar com o Google.")}
            locale="pt_BR"
          />
        )}
      </div>

      {erro && (
        <div className="mt-6 w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
          {erro}
        </div>
      )}
    </div>
  );
}
