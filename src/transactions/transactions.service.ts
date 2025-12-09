import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  // Create a transaction record; ensures reference uniqueness if provided
  async create(dto: CreateTransactionDto) {
    if (dto.reference) {
      const existing = await this.prisma.transaction.findUnique({
        where: { reference: dto.reference },
      });
      if (existing) {
        throw new BadRequestException('Duplicate transaction reference');
      }
    }
    return this.prisma.transaction.create({ data: dto as any });
  }

  // Return all transactions for a given user, most recent first
  async findByUser(userId: string) {
    return this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // The following CRUD methods are kept for completeness but are not used directly
  findAll() {
    return this.prisma.transaction.findMany();
  }

  findOne(id: string) {
    return this.prisma.transaction.findUnique({ where: { id } });
  }

  update(id: string, updateDto: UpdateTransactionDto) {
    return this.prisma.transaction.update({
      where: { id },
      data: updateDto as any,
    });
  }

  remove(id: string) {
    return this.prisma.transaction.delete({ where: { id } });
  }
}
