import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PaystackService } from './paystack.service';
import { CreatePaystackDto } from './dto/create-paystack.dto';
import { UpdatePaystackDto } from './dto/update-paystack.dto';

@Controller('wallet')
export class PaystackController {
  constructor(private readonly paystackService: PaystackService) {}

  @Get('deposit/:reference/status')
  async getDepositStatus(@Param('reference') reference: string) {
    const data = await this.paystackService.verifyTransaction(reference);
    return {
      reference: data.reference,
      status: data.status,
      amount: data.amount,
    };
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePaystackDto: UpdatePaystackDto) {
    return this.paystackService.update(+id, updatePaystackDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paystackService.remove(+id);
  }
}
