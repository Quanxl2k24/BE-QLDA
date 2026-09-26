import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { SendMailJobData } from './types/mail.types';

@Processor('email')
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(private readonly mailerService: MailerService) {
    super();
  }

  async process(job: Job<SendMailJobData>): Promise<void> {
    this.logger.log(
      `Processing email job #${job.id} [${job.name}] to ${job.data.to}`,
    );

    try {
      await this.mailerService.sendMail({
        to: job.data.to,
        subject: job.data.subject,
        template: job.data.template,
        context: job.data.context,
      });
      this.logger.log(
        `Email job #${job.id} sent successfully to ${job.data.to}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send email in job #${job.id} to ${job.data.to}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
