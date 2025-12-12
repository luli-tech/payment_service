import {
  Controller,
  Post,
  Headers,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { PaystackService } from './paystack.service';
import * as crypto from 'crypto';
import { PaystackWebhookEvent } from 'src/utils/types/pasytackWebHoodTypes';
@Controller('wallet/paystack')
export class PaystackWebhookController {
  constructor(private readonly paystack: PaystackService) {}

  @Post('webhook')
  async handle(
    @Headers('x-paystack-signature') signature: string,
    @Body() payload: PaystackWebhookEvent,
  ) {
    // Verify signature
    const hash = crypto
      .createHmac('sha512', this.paystack.getSecretKey())
      .update(JSON.stringify(payload))
      .digest('hex');

    if (hash !== signature) {
      throw new BadRequestException('Invalid Paystack signature');
    }

    const event = payload?.event;

    if (event === 'charge.success') {
      const reference: string = String(payload?.data?.reference);
      const amount: number = Number(payload?.data?.amount);

      if (!reference || isNaN(amount)) {
        throw new BadRequestException('Invalid payload data');
      }

      // Process the payment before returning
      await this.paystack.processSuccessfulPayment(reference, amount);
    }

    return { status: true };
  }
}

// import {
//   Controller,
//   Post,
//   Headers,
//   Body,
//   BadRequestException,
// } from '@nestjs/common';
// import { PaystackService } from './paystack.service';

// import * as crypto from 'crypto';

// @Controller('wallet/paystack')
// export class PaystackWebhookController {
//   constructor(
//     private readonly paystack: PaystackService,

//   ) {}

//   @Post('webhook')
//   async handle(
//     @Headers('x-paystack-signature') signature: string,
//     @Body() payload: any,
//   ) {
//     const hash = crypto
//       .createHmac('sha512', this.paystack.getSecretKey())
//       .update(JSON.stringify(payload))
//       .digest('hex');

//     if (hash !== signature) {
//       throw new BadRequestException('Invalid Paystack signature in');
//     }

//     const event = payload?.event;
//     if (event === 'charge.success') {
//       const reference = payload?.data?.reference;
//       const amount = payload?.data?.amount;

//     return { status: true };
//       await this.paystack.processSuccessfulPayment(reference, amount);
//     }
// }
