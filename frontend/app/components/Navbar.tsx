"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import NotificationBell from "./NotificationBell";
import { EscolaResumo, Usuario, ehAdmin, getEscolaAtual, getUsuario, sair } from "../lib/api";

const linksAdmin = [
  { href: "/professores", label: "Professores" },
  { href: "/alunos", label: "Alunos" },
  { href: "/turmas", label: "Turmas" },
  { href: "/aulas", label: "Aulas" },
  { href: "/relatorios", label: "Relatórios" },
  { href: "/escola", label: "Minha escola" },
];

const estiloLink = (ativo: boolean, cor = "indigo") =>
  `rounded-lg px-2.5 py-2 text-sm font-medium transition-colors ${
    ativo
      ? cor === "emerald"
        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
        : "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
  }`;

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [escola, setEscola] = useState<EscolaResumo | null>(null);

  useEffect(() => {
    const atualizar = () => {
      setUsuario(getUsuario());
      setEscola(getEscolaAtual());
    };
    atualizar();
    window.addEventListener("cb:escola", atualizar);
    return () => window.removeEventListener("cb:escola", atualizar);
  }, [pathname]);

  function handleLogout() {
    sair();
    setUsuario(null);
    setEscola(null);
    router.push("/login");
  }

  const admin = ehAdmin(usuario?.role);
  const dono = usuario?.role === "SUPERADMIN";

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-y-2 px-6 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
            <Logo className="h-8 w-8" />
            ClassBoard
          </Link>
          {escola && (
            <>
              <span className="h-5 w-px bg-slate-200 dark:bg-slate-800" />
              <span className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                {escola.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={escola.logoUrl} alt="" className="h-7 max-w-[96px] object-contain" />
                )}
                <span className="max-w-[160px] truncate">{escola.nome}</span>
              </span>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {admin &&
            linksAdmin.map((link) => (
              <Link key={link.href} href={link.href} className={estiloLink(pathname === link.href)}>
                {link.label}
              </Link>
            ))}
          {dono && (
            <Link href="/escolas" className={estiloLink(pathname === "/escolas")}>
              Escolas
            </Link>
          )}

          <span className="mx-2 h-5 w-px bg-slate-200 dark:bg-slate-800" />

          {usuario ? (
            <>
              {!admin && <NotificationBell />}
              {!admin && (
                <Link href="/minhas-aulas" className={estiloLink(pathname === "/minhas-aulas", "emerald")}>
                  Minhas aulas
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="rounded-lg px-2.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                Sair
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
            >
              Entrar
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
