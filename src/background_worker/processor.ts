import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { Logger } from '@nestjs/common';

@Processor('transactions')
export class BackgroundWorkerProcessor extends WorkerHost {
  private readonly logger = new Logger(BackgroundWorkerProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    if (job.name === 'handle_webhook') {
      const payload = job.data;
      const { reference, amount, customer } = payload.data;
      this.logger.log(`Processing webhook for reference: ${reference}`);

      try {
        const existing = await this.prisma.transaction.findUnique({ where: { reference } });
        if (existing && existing.status === 'SUCCESS') {
          this.logger.log(`Transaction ${reference} already processed.`);
          return;
        }

        const user = await this.prisma.user.findUnique({ where: { email: customer.email } });
        if (!user) {
          this.logger.error(`User not found for email: ${customer.email}`);
          return;
        }

        await this.prisma.$transaction([
          this.prisma.wallet.update({
            where: { userId: user.id },
            data: { balance: { increment: amount } },
          }),
          this.prisma.transaction.upsert({
            where: { reference },
            create: {
              userId: user.id,
              type: 'DEPOSIT',
              amount,
              status: 'SUCCESS',
              reference,
            },
            update: { status: 'SUCCESS' },
          }),
        ]);
        this.logger.log(`Successfully processed deposit for ${reference}`);
      } catch (error) {
        this.logger.error(`Failed to process webhook for ${reference}`, error.stack);
        throw error;
      }
    }
  }
}
