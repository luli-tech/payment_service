import { Controller, Post, Headers, Body, BadRequestException } from '@nestjs/common';
import { PaystackService } from './paystack.service';
import { BackgroundWorkerService } from '../background_worker/background_worker.service';
import * as crypto from 'crypto';

@Controller('wallet/paystack')
export class PaystackWebhookController {
  constructor(
    private readonly paystack: PaystackService,
    private readonly bgWorker: BackgroundWorkerService,
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
    if (event === 'charge.success') {
      // Offload processing to background worker
      await this.bgWorker.addWebhookJob(payload);
    }

    return { status: true };
  }
}
