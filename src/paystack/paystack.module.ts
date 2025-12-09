import { Module } from '@nestjs/common';
import { PaystackService } from './paystack.service';
import { PaystackController } from './paystack.controller';
import { PaystackWebhookController } from './paystack-webhook.controller';
import { TransactionsModule } from '../transactions/transactions.module';
import { PrismaService } from '../prisma/prisma.service';
import { BackgroundWorkerModule } from '../background_worker/background_worker.module';

@Module({
  imports: [TransactionsModule, BackgroundWorkerModule],
  controllers: [PaystackController, PaystackWebhookController],
  providers: [PaystackService, PrismaService],
  exports: [PaystackService],
})
export class PaystackModule {}
