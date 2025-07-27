import { Resend } from 'resend';
import appConfig from '../appConfig';
import logger from '../utils/logger';

const resend = new Resend(appConfig.resendApiKey);

export class EmailService {
  /**
   * Send an email using Resend
   * @param to recipient email address
   * @param subject email subject
   * @param html html content of the email
   * @param from sender email address (default: no-reply@yourdomain.com)
   */
  async sendEmail({ to, subject, html, from = 'onboarding@resend.dev' }: {
    to: string;
    subject: string;
    html: string;
    from?: string;
  }): Promise<void> {
    try {
      logger.debug('Sending email:', { from, to, subject });
      const response = await resend.emails.send({
        from,
        to,
        subject,
        html
      });
      logger.debug('Resend response:', response);
      if (response.error) {
        logger.error('Resend error:', response.error);
        throw new Error(`Resend error: ${JSON.stringify(response.error)}`);
      }
    } catch (error) {
      logger.error('Failed to send email:', error);
      throw error;
    }
  }
}

export const emailService = new EmailService();
