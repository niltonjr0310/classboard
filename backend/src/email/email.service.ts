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
  });

  async enviar(to: string, subject: string, html: string, remetente = 'ClassBoard') {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      this.logger.warn(
        'E-mail não enviado: configure GMAIL_USER e GMAIL_APP_PASSWORD no .env',
      );
      return;
    }

    try {
      await this.transporter.sendMail({
        from: `${remetente.replace(/[<>"\r\n]/g, '')} <${process.env.GMAIL_USER}>`,
        to,
        subject,
        html,
      });
    } catch (err) {
      this.logger.error('Erro ao enviar e-mail', err as Error);
    }
  }
}
