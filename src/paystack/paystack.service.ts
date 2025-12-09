import { Injectable } from '@nestjs/common';
import { CreatePaystackDto } from './dto/create-paystack.dto';
import { UpdatePaystackDto } from './dto/update-paystack.dto';

@Injectable()
export class PaystackService {
  create(createPaystackDto: CreatePaystackDto) {
    return 'This action adds a new paystack';
  }

  findAll() {
    return `This action returns all paystack`;
  }

  findOne(id: number) {
    return `This action returns a #${id} paystack`;
  }

  update(id: number, updatePaystackDto: UpdatePaystackDto) {
    return `This action updates a #${id} paystack`;
  }

  remove(id: number) {
    return `This action removes a #${id} paystack`;
  }
}
