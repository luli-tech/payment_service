import { Module } from '@nestjs/common';
import { PaystackService } from './paystack.service';
import { PaystackController } from './paystack.controller';
import { PaystackWebhookController } from './paystack-webhook.controller';
import { TransactionsModule } from '../transactions/transactions.module';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [TransactionsModule],
  controllers: [PaystackController, PaystackWebhookController],
  providers: [PaystackService, PrismaService],
  exports: [PaystackService],
})
export class PaystackModule {}
