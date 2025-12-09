import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PaystackService } from './paystack.service';
import { CreatePaystackDto } from './dto/create-paystack.dto';
import { UpdatePaystackDto } from './dto/update-paystack.dto';

@Controller('paystack')
export class PaystackController {
  constructor(private readonly paystackService: PaystackService) {}

  @Post()
  create(@Body() createPaystackDto: CreatePaystackDto) {
    return this.paystackService.create(createPaystackDto);
  }

  @Get()
  findAll() {
    return this.paystackService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paystackService.findOne(+id);
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
