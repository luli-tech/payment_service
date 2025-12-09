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
    this.secretKey =
      this.configService.get<string>('PAYSTACK_SECRET_KEY') || '';
    if (!this.secretKey) {
      throw new BadRequestException('Paystack secret key not configured');
    }
  }

  getSecretKey(): string {
    return this.secretKey;
  }

  // Initialize transaction
  async initialize(createPaystackDto: CreatePaystackDto) {
    const { userId, email, amount } = createPaystackDto;
    const reference = `wallet_${userId}_${Date.now()}`;

    const payload = { email, amount, reference };
    const response = await axios.post(
      `${this.baseUrl}/transaction/initialize`,
      payload,
      {
        headers: { Authorization: `Bearer ${this.secretKey}` },
      },
    );

    if (!response.data?.data?.authorization_url) {
      throw new BadRequestException(
        'Failed to initialize Paystack transaction',
      );
    }

    return {
      reference,
      authorization_url: response.data.data.authorization_url,
    };
  }

  // Verify transaction
  async verifyTransaction(reference: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transaction/verify/${reference}`,
        {
          headers: { Authorization: `Bearer ${this.secretKey}` },
        },
      );
      return response.data.data;
    } catch {
      throw new BadRequestException('Transaction verification failed');
    }
  }

  // Process successful payment from webhook
  async processSuccessfulPayment(reference: string, amount: number) {
    // TODO: implement wallet credit in DB
    console.log(`Payment successful: reference=${reference}, amount=${amount}`);
  }

  // CRUD placeholders
  create(_dto: CreatePaystackDto) {
    return 'Not implemented';
  }
  findAll() {
    return 'Not implemented';
  }
  findOne(id: number) {
    return `Not implemented for id ${id}`;
  }
  update(id: number, _dto: UpdatePaystackDto) {
    return `Not implemented for id ${id}`;
  }
  remove(id: number) {
    return `Not implemented for id ${id}`;
  }
}
