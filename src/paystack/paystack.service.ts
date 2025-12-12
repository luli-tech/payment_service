import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaystackDto } from './dto/create-paystack.dto';
import { UpdatePaystackDto } from './dto/update-paystack.dto';

@Injectable()
export class PaystackService {
  private readonly secretKey: string;
  private readonly baseUrl = 'https://api.paystack.co';

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
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
    const { amount, userId, email } = createPaystackDto;
    
    if (!userId) {
      throw new BadRequestException('User ID is required for Paystack initialization');
    }

    if (!email) {
      throw new BadRequestException('User Email is required for Paystack');
    }

    // Amount in Kobo for Paystack (user provides Naira)
    const paystackAmount = amount * 100;
    const reference = `wallet_${userId}_${Date.now()}`;

    const payload = { email, amount: paystackAmount, reference };
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

    // Fetch user wallet for recipientId
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new BadRequestException('Wallet not found for user');
    }

    // Create Pending Transaction in DB
    try {
      await this.prisma.transaction.create({
        data: {
          userId,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          amount: paystackAmount,
          reference,
          type: 'DEPOSIT',
          status: 'PENDING',
          senderId: wallet.id,    // Set sender as self (wallet) for deposit
          recipientId: wallet.id, // Set recipient as self (wallet)
        } as any,
      });
    } catch (error) {
      console.warn('Failed to create pending transaction:', error);
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
    const transaction = await this.prisma.transaction.findUnique({
      where: { reference },
    });

    if (!transaction) {
      console.error(`Transaction not found for reference: ${reference}`);
      return; // Or throw, but for webhook we usually just log
    }

    if (transaction.status === 'SUCCESS') {
      console.log(`Transaction ${reference} already processed.`);
      return; // Idempotency
    }

    const wallet = await this.prisma.wallet.findUnique({
      where: { userId: transaction.userId },
    });

    if (!wallet) {
      console.error(`Wallet not found for user: ${transaction.userId}`);
      return;
    }

    // Atomic update
    await this.prisma.$transaction([
      this.prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'SUCCESS' },
      }),
      this.prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } }, // amount is in kobo? Spec says 5000. Assuming matched units.
      }),
    ]);

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
