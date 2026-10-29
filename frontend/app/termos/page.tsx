import Link from "next/link";

export const metadata = { title: "Termos de Uso — ClassBoard" };

const CONTATO = process.env.NEXT_PUBLIC_CONTATO_EMAIL || "niltonjosevezarojunior@gmail.com";

export default function Page() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-10 text-slate-700 dark:text-slate-300 [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-slate-900 dark:[&_h2]:text-white [&_p]:mb-3 [&_p]:leading-relaxed [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mb-1">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Termos de Uso</h1>
      <p className="mt-1 text-sm text-slate-500">Última atualização: 27/10/2026</p>

      <h2>1. Sobre o serviço</h2>
      <p>O ClassBoard é um sistema de gestão de aulas e provas: permite cadastrar professores e alunos, agendar aulas e provas e avisar os envolvidos por notificação e e-mail. O serviço é fornecido por Nilton Vezaro Junior (NV T.I).</p>

      <h2>2. Quem pode usar</h2>
      <p>O acesso é feito com conta Google e só é liberado para e-mails previamente cadastrados pela administração da escola ou do professor responsável. Quem não estiver cadastrado não consegue entrar.</p>

      <h2>3. Perfis e permissões</h2>
      <ul>
        <li><strong>Administrador:</strong> cadastra, altera e exclui professores, alunos, aulas e provas.</li>
        <li><strong>Professor e aluno:</strong> apenas consultam suas próprias aulas, provas e notificações.</li>
      </ul>

      <h2>4. Responsabilidades do usuário</h2>
      <ul>
        <li>Manter a segurança da própria conta Google.</li>
        <li>Não tentar acessar dados de outras pessoas nem burlar as permissões do sistema.</li>
        <li>Informar dados verdadeiros no cadastro.</li>
      </ul>

      <h2>5. Responsabilidades da administração</h2>
      <p>Quem cadastra alunos e professores é responsável por ter autorização para tratar esses dados e, no caso de menores de 18 anos, pelo consentimento de pelo menos um dos pais ou responsável legal.</p>

      <h2>6. Disponibilidade</h2>
      <p>O serviço é fornecido no estado em que se encontra. Podem ocorrer interrupções para manutenção ou por falhas de terceiros (hospedagem, e-mail, Google). Os e-mails de aviso podem atrasar ou cair na caixa de spam; a conferência final das datas é feita no próprio sistema.</p>

      <h2>7. Encerramento</h2>
      <p>O acesso pode ser suspenso em caso de uso indevido. Ao encerrar o contrato, os dados podem ser exportados e depois excluídos, conforme a Política de Privacidade.</p>

      <h2>8. Alterações</h2>
      <p>Estes termos podem ser atualizados; a data da última atualização fica no topo desta página.</p>

      <h2>9. Contato</h2>
      <p>Dúvidas: <a className="text-violet-600 underline dark:text-violet-400" href={`mailto:${CONTATO}`}>{CONTATO}</a>.</p>

      <p className="mt-10 text-sm">
        <Link href="/login" className="text-violet-600 underline dark:text-violet-400">Voltar ao login</Link>
      </p>
    </article>
  );
}
