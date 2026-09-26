import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 p-8">
      <h1 className="text-3xl font-bold text-zinc-900">ClassBoard</h1>
      <p className="text-zinc-600">Gestão de aulas particulares</p>
      <div className="flex gap-4">
        <Link href="/professores" className="rounded bg-blue-600 px-5 py-2 text-white hover:bg-blue-700">
          Professores
        </Link>
        <Link href="/alunos" className="rounded bg-green-600 px-5 py-2 text-white hover:bg-green-700">
          Alunos
        </Link>
        <Link href="/aulas" className="rounded bg-purple-600 px-5 py-2 text-white hover:bg-purple-700">
          Aulas
        </Link>
      </div>
    </div>
  );
}