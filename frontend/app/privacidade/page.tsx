import Link from "next/link";

export const metadata = { title: "Política de Privacidade — ClassBoard" };

const CONTATO = process.env.NEXT_PUBLIC_CONTATO_EMAIL || "niltonjosevezarojunior@gmail.com";

export default function Page() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-10 text-slate-700 dark:text-slate-300 [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-slate-900 dark:[&_h2]:text-white [&_p]:mb-3 [&_p]:leading-relaxed [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mb-1">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Política de Privacidade</h1>
      <p className="mt-1 text-sm text-slate-500">Última atualização: 27/10/2026</p>

      <p className="mt-4">Esta política explica como o ClassBoard trata dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD, Lei 13.709/2018).</p>

      <h2>1. Quem é o controlador</h2>
      <p>Nilton Vezaro Junior (NV T.I) opera o sistema. Quando uma escola contrata o ClassBoard, a escola decide quais pessoas cadastrar e é a controladora dos dados dos seus alunos e professores; o ClassBoard atua como operador.</p>

      <h2>2. Dados que tratamos</h2>
      <ul>
        <li><strong>Alunos:</strong> nome, e-mail e série.</li>
        <li><strong>Professores:</strong> nome, e-mail e disciplina.</li>
        <li><strong>Aulas e provas:</strong> data, horário, duração, matéria, status e quem participa.</li>
        <li><strong>Notificações:</strong> o histórico de avisos enviados dentro do sistema.</li>
        <li><strong>Login:</strong> e-mail e nome da conta Google usada para entrar. Nunca recebemos a sua senha do Google.</li>
      </ul>
      <p>Não coletamos documentos, dados de saúde, localização nem dados financeiros.</p>

      <h2>3. Para que usamos</h2>
      <ul>
        <li>Identificar quem está entrando e liberar o que cada perfil pode ver.</li>
        <li>Agendar aulas e provas e avisar alunos e professores por notificação e e-mail.</li>
      </ul>
      <p>Não vendemos dados, não usamos para publicidade e não fazemos perfilamento.</p>

      <h2>4. Base legal</h2>
      <p>Execução do contrato de prestação do serviço com a escola e, quando aplicável, consentimento do titular. Para menores de 18 anos, o tratamento depende do consentimento específico de pelo menos um dos pais ou responsável legal (art. 14 da LGPD), obtido pela escola.</p>

      <h2>5. Com quem compartilhamos</h2>
      <p>Apenas com prestadores necessários para o sistema funcionar:</p>
      <ul>
        <li>Google (login e envio de e-mails);</li>
        <li>Vercel (hospedagem do site);</li>
        <li>Railway (hospedagem do servidor);</li>
        <li>Neon (banco de dados).</li>
      </ul>
      <p>Alguns desses prestadores armazenam dados fora do Brasil, com salvaguardas contratuais próprias.</p>

      <h2>6. Por quanto tempo guardamos</h2>
      <p>Enquanto o contrato com a escola estiver ativo. Após o encerramento, os dados são excluídos em até 90 dias, salvo obrigação legal de guarda. Cópias de segurança podem levar um período adicional para serem apagadas.</p>

      <h2>7. Seus direitos</h2>
      <p>Você pode pedir confirmação do tratamento, acesso, correção, anonimização, exclusão, portabilidade, informação sobre compartilhamento e revogação do consentimento (art. 18 da LGPD). Menores exercem esses direitos por meio dos responsáveis.</p>

      <h2>8. Segurança</h2>
      <p>Usamos conexão criptografada (HTTPS), login pelo Google, controle de acesso por perfil e banco de dados com acesso restrito. Nenhum sistema é totalmente imune a falhas; em caso de incidente relevante, comunicaremos a escola e os titulares afetados.</p>

      <h2>9. Contato e encarregado</h2>
      <p>Pedidos e dúvidas sobre dados pessoais: <a className="text-violet-600 underline dark:text-violet-400" href={`mailto:${CONTATO}`}>{CONTATO}</a>.</p>

      <p className="mt-10 text-sm">
        <Link href="/login" className="text-violet-600 underline dark:text-violet-400">Voltar ao login</Link>
      </p>
    </article>
  );
}
