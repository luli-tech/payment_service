import {
  Controller,
  Get,
  Post,
  Param,
  Headers,
  HttpCode,
  BadRequestException,
  UnauthorizedException,
  Req,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PaystackService } from './paystack.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Deposit Status')
@Controller('wallet')
export class PaystackController {
  constructor(private readonly paystackService: PaystackService) {}

  @Get('deposit/:reference/status')
  @ApiOperation({
    summary: 'Verify deposit status (manual check)',
    description:
      'Manually check the status of a Paystack transaction by reference. NOTE: This does NOT credit the wallet. Only webhooks do.',
  })
  @ApiResponse({ status: 200, description: 'Transaction status returned.' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Verification failed.',
  })
  @ApiResponse({ status: 404, description: 'Transaction not found.' })
  async getDepositStatus(@Param('reference') reference: string) {
    const data = await this.paystackService.verifyTransaction(reference);
    return {
      reference: data.reference,
      status: data.status,
      amount: data.amount,
    };
  }

  @Post('paystack/webhook')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Paystack Webhook Endpoint',
    description:
      'Receives payment events from Paystack. Credits user wallet on success.',
  })
  async webhook(
    @Headers('x-paystack-signature') signature: string,
    @Req() req,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing signature');
    }

    const secret = this.paystackService.getSecretKey();
    const hash = crypto
      .createHmac('sha512', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (hash !== signature) {
      throw new UnauthorizedException('Invalid signature');
    }

    const event = req.body;

    if (event.event === 'charge.success') {
      const data = event.data as { reference: string; amount: number };
      await this.paystackService.processSuccessfulPayment(
        data.reference,
        data.amount,
      );
    }

    return { status: true };
  }
}
