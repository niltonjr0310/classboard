import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ClassBoard — Gestão de aulas particulares",
  description:
    "Cadastre professores e alunos e organize o agendamento de aulas particulares em um só lugar.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-slate-200 px-6 py-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <p>ClassBoard — desenvolvido por Nilton Vezaro Junior (NV T.I)</p>
            <p className="mt-1">
              <Link href="/termos" className="underline-offset-2 hover:underline">Termos de Uso</Link>
              {" · "}
              <Link href="/privacidade" className="underline-offset-2 hover:underline">Política de Privacidade</Link>
            </p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
