import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config';
import { logger } from '../utils/logger';

let transporter: Transporter | null = null;

const getTransporter = (): Transporter | null => {
  if (!config.smtp.configured) return null;
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
  });
  return transporter;
};

interface SendEmailInput {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

/**
 * Sends an email via SMTP if one is configured; otherwise logs it to the
 * console. This keeps password-reset and other transactional flows fully
 * functional in local development without requiring a mail account.
 */
export const sendEmail = async (input: SendEmailInput): Promise<void> => {
  const client = getTransporter();

  if (!client) {
    logger.info(`✉️  [email:console-fallback] to=${input.to} subject="${input.subject}"\n${input.text}`);
    return;
  }

  try {
    await client.sendMail({ from: config.smtp.from, to: input.to, subject: input.subject, text: input.text, html: input.html });
  } catch (error) {
    logger.error('Failed to send email', { to: input.to, subject: input.subject, error });
  }
};
