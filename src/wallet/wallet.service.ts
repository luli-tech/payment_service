import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
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
  async create(userId: string) {
    try {
      if (!userId) {
        throw new BadRequestException('userId is required to create a wallet');
      }

      const existing = await this.prisma.wallet.findUnique({ where: { userId } });
      if (existing) {
        throw new BadRequestException('Wallet already exists for this user');
      }
      return await this.prisma.wallet.create({ data: { userId } });
    } catch (error) {
       throw error;
    }
  }

  async findAll() {
    try {
      return await this.prisma.wallet.findMany();
    } catch (error) {
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const wallet = await this.prisma.wallet.findUnique({ where: { id } });
      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }
      return wallet;
    } catch (error) {
      throw error;
    }
  }

  // Get balance for a user (identified by userId from JWT or API key)
  async getBalance(userId: string) {
    try {
      const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }
      return { balance: wallet.balance };
    } catch (error) {
      throw error;
    }
  }

  // Transfer funds between wallets
  async transfer(
    senderUserId: string,
    recipientWalletId: string,
    amount: number,
  ) {
    try {
      if (amount <= 0) {
        throw new BadRequestException('Transfer amount must be positive');
      }
      const senderWallet = await this.prisma.wallet.findUnique({
        where: { userId: senderUserId },
      });
      const recipientWallet = await this.prisma.wallet.findUnique({
        where: { id: recipientWalletId },
      });
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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
    } catch (error) {
      throw error;
    }
  }

  // Expose transaction history for a user
  async getTransactions(userId: string) {
    try {
      return await this.transactionsService.findByUser(userId);
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updateWalletDto: UpdateWalletDto) {
    try {
      return await this.prisma.wallet.update({
        where: { id },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: updateWalletDto as any,
      });
    } catch (error) {
      throw error;
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.wallet.delete({ where: { id } });
    } catch (error) {
      throw error;
    }
  }
}
