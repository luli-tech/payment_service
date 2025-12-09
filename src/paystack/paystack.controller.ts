import {
  Controller,
  Post,
  Headers,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { PaystackService } from './paystack.service';
import * as crypto from 'crypto';

@Controller('wallet/paystack')
export class PaystackWebhookController {
  constructor(private readonly paystack: PaystackService) {}

  @Post('webhook')
  async handleWebhook(
    @Headers('x-paystack-signature') signature: string,
    @Body() payload: any,
  ) {
    const hash = crypto
      .createHmac('sha512', this.paystack.getSecretKey())
      .update(JSON.stringify(payload))
      .digest('hex');

    if (hash !== signature) {
      throw new BadRequestException('Invalid Paystack signature');
    }

    const event = payload?.event;
    if (event === 'charge.success') {
      const reference = payload?.data?.reference;
      const amount = payload?.data?.amount;

      await this.paystack.processSuccessfulPayment(reference, amount);
    }

    return { status: true };
  }
}

// import { Controller, Get, Body, Patch, Param, Delete } from '@nestjs/common';
// import { PaystackService } from './paystack.service';
// import { UpdatePaystackDto } from './dto/update-paystack.dto';
// import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

// @ApiTags('Deposit Status')
// @Controller('wallet')
// export class PaystackController {
//   constructor(private readonly paystackService: PaystackService) {}

//   @Get('deposit/:reference/status')
//   @ApiOperation({
//     summary: 'Verify deposit status (manual check)',
//     description: 'Manually check the status of a Paystack transaction by reference. NOTE: This does NOT credit the wallet. Only webhooks do.'
//   })
//   @ApiResponse({ status: 200, description: 'Transaction status returned.' })
//   @ApiResponse({ status: 400, description: 'Bad Request. Verification failed.' })
//   @ApiResponse({ status: 404, description: 'Transaction not found.' })
//   async getDepositStatus(@Param('reference') reference: string) {
//     const data = await this.paystackService.verifyTransaction(reference);
//     return {
//       reference: data.reference,
//       status: data.status,
//       amount: data.amount,
//     };
//   }

//   @Patch(':id')
//   update(@Param('id') id: string, @Body() updatePaystackDto: UpdatePaystackDto) {
//     return this.paystackService.update(+id, updatePaystackDto);
//   }

//   @Delete(':id')
//   remove(@Param('id') id: string) {
//     return this.paystackService.remove(+id);
//   }
// }
