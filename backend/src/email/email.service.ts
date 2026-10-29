import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
    // Evita que uma conexão SMTP bloqueada deixe a requisição pendurada.
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  /**
   * Envia em segundo plano (não trava quem chamou).
   * Com BREVO_API_KEY usa a API HTTPS do Brevo (funciona em hospedagens que
   * bloqueiam SMTP, como o Render gratuito). Sem ela, usa o Gmail por SMTP.
   */
  async enviar(to: string, subject: string, html: string, remetente = 'ClassBoard') {
    const nome = remetente.replace(/[<>"\r\n]/g, '');
    const brevoKey = process.env.BREVO_API_KEY;

    if (brevoKey) {
      const de = process.env.EMAIL_FROM || process.env.GMAIL_USER;
      if (!de) {
        this.logger.warn('E-mail não enviado: configure EMAIL_FROM (remetente verificado no Brevo).');
        return;
      }
      void fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'api-key': brevoKey },
        body: JSON.stringify({
          sender: { name: nome, email: de },
          to: [{ email: to }],
          subject,
          htmlContent: html,
        }),
        signal: AbortSignal.timeout(15000),
      })
        .then(async (res) => {
          if (!res.ok) {
            this.logger.error(`Brevo recusou o e-mail (${res.status}): ${await res.text()}`);
          }
        })
        .catch((err: Error) => this.logger.error('Erro ao enviar e-mail (Brevo)', err));
      return;
    }

    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      this.logger.warn(
        'E-mail não enviado: configure BREVO_API_KEY ou GMAIL_USER e GMAIL_APP_PASSWORD',
      );
      return;
    }

    void this.transporter
      .sendMail({
        from: `${nome} <${process.env.GMAIL_USER}>`,
        to,
        subject,
        html,
      })
      .catch((err: Error) => this.logger.error('Erro ao enviar e-mail', err));
  }
}
