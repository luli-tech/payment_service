import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { CreatePaystackDto } from './dto/create-paystack.dto';
import { UpdatePaystackDto } from './dto/update-paystack.dto';

@Injectable()
export class PaystackService {
  private readonly secretKey: string;
  private readonly baseUrl = 'https://api.paystack.co';

  constructor(private readonly configService: ConfigService) {
    this.secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY') || '';
    if (!this.secretKey) {
      throw new BadRequestException('Paystack secret key not configured');
    }
  }

  // Initialize a Paystack transaction and return the authorization URL
  async initialize(createPaystackDto: CreatePaystackDto) {
    const { amount, email, userId } = createPaystackDto as any; // expecting these fields
    const reference = `wallet_${userId}_${Date.now()}`;
    const payload = {
      email,
      amount,
      reference,
    };
    const response = await axios.post(`${this.baseUrl}/transaction/initialize`, payload, {
      headers: { Authorization: `Bearer ${this.secretKey}` },
    });
    if (!response.data?.data?.authorization_url) {
      throw new BadRequestException('Failed to initialize Paystack transaction');
    }
    return {
      reference,
      authorization_url: response.data.data.authorization_url,
    };
  }

  // Placeholder for other CRUD methods (not used)
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
