import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionsService: TransactionsService,
  ) {}

  // Create a wallet for a user (if not exists)
  async create(createWalletDto: CreateWalletDto) {
    const { userId } = createWalletDto as any; // expecting userId field
    const existing = await this.prisma.wallet.findUnique({ where: { userId } });
    if (existing) {
      throw new BadRequestException('Wallet already exists for this user');
    }
    return this.prisma.wallet.create({ data: { userId } });
  }

  async findAll() {
    return this.prisma.wallet.findMany();
  }

  async findOne(id: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { id } });
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }
    return wallet;
  }

  // Get balance for a user (identified by userId from JWT or API key)
  async getBalance(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }
    return { balance: wallet.balance };
  }

  // Transfer funds between wallets
  async transfer(senderUserId: string, recipientWalletId: string, amount: number) {
    if (amount <= 0) {
      throw new BadRequestException('Transfer amount must be positive');
    }
    const senderWallet = await this.prisma.wallet.findUnique({ where: { userId: senderUserId } });
    const recipientWallet = await this.prisma.wallet.findUnique({ where: { id: recipientWalletId } });
    if (!senderWallet || !recipientWallet) {
      throw new NotFoundException('Sender or recipient wallet not found');
    }
    if (senderWallet.balance < amount) {
      throw new BadRequestException('Insufficient balance');
    }
    // Perform atomic update using transaction
    await this.prisma.$transaction([
      this.prisma.wallet.update({
        where: { id: senderWallet.id },
        data: { balance: { decrement: amount } },
      }),
      this.prisma.wallet.update({
        where: { id: recipientWallet.id },
        data: { balance: { increment: amount } },
      }),
    ]);
    // Record transaction
    await this.transactionsService.create({
      userId: senderUserId,
      type: 'TRANSFER',
      amount,
      status: 'SUCCESS',
      reference: undefined,
      senderId: senderWallet.id,
      recipientId: recipientWallet.id,
    } as any);
    return { status: 'success', message: 'Transfer completed' };
  }

  // Expose transaction history for a user
  async getTransactions(userId: string) {
    return this.transactionsService.findByUser(userId);
  }

  async update(id: string, updateWalletDto: UpdateWalletDto) {
    return this.prisma.wallet.update({
      where: { id },
      data: updateWalletDto as any,
    });
  }

  async remove(id: string) {
    return this.prisma.wallet.delete({ where: { id } });
  }
}
