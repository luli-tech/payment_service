import { Controller, Post, Headers, Body, BadRequestException } from '@nestjs/common';
import { PaystackService } from './paystack.service';
import { TransactionsService } from '../transactions/transactions.service';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Controller('wallet/paystack')
export class PaystackWebhookController {
  constructor(
    private readonly paystack: PaystackService,
    private readonly txService: TransactionsService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('webhook')
  async handle(@Headers('x-paystack-signature') signature: string, @Body() payload: any) {
    const hash = crypto
      .createHmac('sha512', this.paystack.getSecretKey())
      .update(JSON.stringify(payload))
      .digest('hex');

    if (hash !== signature) {
      throw new BadRequestException('Invalid Paystack signature');
    }

    const event = payload?.event;
    if (event !== 'charge.success') return { status: true };

    const { reference, amount, customer } = payload.data;
    // Idempotent: check if transaction already processed
    const existing = await this.prisma.transaction.findUnique({ where: { reference } });
    if (existing && existing.status === 'SUCCESS') return { status: true };

    // Find wallet by user email (or you could store userId in metadata)
    const user = await this.prisma.user.findUnique({ where: { email: customer.email } });
    if (!user) throw new BadRequestException('User not found');

    // Update wallet balance atomically
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

    return { status: true };
  }
}
