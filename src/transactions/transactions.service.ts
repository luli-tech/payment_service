import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  // Create a transaction record; ensures reference uniqueness if provided
  async create(dto: CreateTransactionDto) {
    try {
      if (dto.reference) {
        const existing = await this.prisma.transaction.findUnique({
          where: { reference: dto.reference },
        });
        if (existing) {
          throw new BadRequestException('Duplicate transaction reference');
        }
      }
      return await this.prisma.transaction.create({ data: dto as any });
    } catch (error) {
       throw error;
    }
  }

  // Return all transactions for a given user, most recent first
  async findByUser(userId: string) {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required to fetch transactions');
      }

      const wallet = await this.prisma.wallet.findUnique({
        where: { userId },
        select: { id: true },
      });
  
      const transactions = await this.prisma.transaction.findMany({
        where: {
          OR: [
            { userId },
            ...(wallet ? [{ recipientId: wallet.id }] : []),
          ],
        },
        orderBy: { createdAt: 'desc' },
      });

      return transactions.map((t) => ({
        type: t.type.toLowerCase(),
        amount: t.amount,
        status: t.status.toLowerCase(),
      }));
    } catch (error) {
       throw error;
    }
  }

  // The following CRUD methods are kept for completeness but are not used directly
  findAll() {
    return this.prisma.transaction.findMany();
  }

  async findOne(id: string) {
    try {
      return await this.prisma.transaction.findUnique({ where: { id } });
    } catch (error) {
      throw error;
    }
  }

  async update(id: string, updateDto: UpdateTransactionDto) {
    try {
      return await this.prisma.transaction.update({
        where: { id },
        data: updateDto as any,
      });
    } catch (error) {
      throw error;
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.transaction.delete({ where: { id } });
    } catch (error) {
      throw error;
    }
  }
}
