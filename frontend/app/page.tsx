import Link from "next/link";

const features = [
  {
    title: "Professores",
    description: "Cadastre professores por nome, e-mail e disciplina.",
    href: "/professores",
    accent: "bg-indigo-600",
    icon: "🧑‍🏫",
  },
  {
    title: "Alunos",
    description: "Mantenha os dados de cada aluno organizados e atualizados.",
    href: "/alunos",
    accent: "bg-emerald-600",
    icon: "🎒",
  },
  {
    title: "Aulas",
    description: "Agende aulas vinculando professor e aluno, com controle de status.",
    href: "/aulas",
    accent: "bg-violet-600",
    icon: "📅",
  },
  {
    title: "Turmas",
    description: "Agrupe os alunos em turmas e acompanhe cada uma.",
    href: "/turmas",
    accent: "bg-amber-600",
    icon: "🏫",
  },
  {
    title: "Relatórios",
    description: "Veja aulas e provas por período, professor, matéria e turma. Exporte em CSV.",
    href: "/relatorios",
    accent: "bg-rose-600",
    icon: "📊",
  },
  {
    title: "Minha escola",
    description: "Nome e logo da escola, usados no cabeçalho e nos e-mails.",
    href: "/escola",
    accent: "bg-sky-600",
    icon: "🎨",
  },
];

export default function Home() {
  return (
    <div>
      <section className="mx-auto max-w-5xl px-6 pt-20 pb-16 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-4 py-1.5 text-sm font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
          Gestão de aulas particulares
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
          Organize professores, alunos e aulas em um só lugar
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
          O ClassBoard centraliza o cadastro de professores e alunos e o agendamento de aulas,
          com acompanhamento de status em tempo real — simples o bastante para uma escola usar no
          dia a dia.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/aulas"
            className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            Ver agenda de aulas
          </Link>
          <Link
            href="/professores"
            className="rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Começar pelos professores
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${f.accent}`}
              >
                {f.icon}
              </div>
              <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
                {f.title}
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{f.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 group-hover:gap-2 dark:text-indigo-400">
                Acessar
                <span aria-hidden>→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
