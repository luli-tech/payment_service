import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper to convert expiry string to Date
  private parseExpiry(expiry: string): Date {
    const now = new Date();
    const amount = parseInt(expiry.slice(0, -1), 10);
    const unit = expiry.slice(-1).toUpperCase();
    switch (unit) {
      case 'H':
        return new Date(now.getTime() + amount * 60 * 60 * 1000);
      case 'D':
        return new Date(now.getTime() + amount * 24 * 60 * 60 * 1000);
      case 'M':
        return new Date(now.setMonth(now.getMonth() + amount));
      case 'Y':
        return new Date(now.setFullYear(now.getFullYear() + amount));
      default:
        throw new BadRequestException('Invalid expiry format');
    }
  }

  async create(createApiKeyDto: CreateApiKeyDto) {
    const { name, permissions, expiry, userId } = createApiKeyDto as any;
    // Enforce max 5 active keys per user
    const activeCount = await this.prisma.apiKey.count({
      where: { userId, revoked: false, expiresAt: { gt: new Date() } },
    });
    if (activeCount >= 5) {
      throw new BadRequestException('Maximum of 5 active API keys per user reached');
    }
    const expiresAt = this.parseExpiry(expiry);
    const apiKey = uuidv4();
    const record = await this.prisma.apiKey.create({
      data: { name, permissions, expiresAt, key: apiKey, userId },
    });
    return { api_key: record.key, expires_at: record.expiresAt };
  }

  async findAll() {
    return this.prisma.apiKey.findMany();
  }

  async findOne(id: string) {
    const key = await this.prisma.apiKey.findUnique({ where: { id } });
    if (!key) throw new NotFoundException('API key not found');
    return key;
  }

  async update(id: string, updateApiKeyDto: UpdateApiKeyDto) {
    return this.prisma.apiKey.update({ where: { id }, data: updateApiKeyDto as any });
  }

  async remove(id: string) {
    return this.prisma.apiKey.delete({ where: { id } });
  }

  // Rollover an expired key
  async rollover(expiredKeyId: string, newExpiry: string) {
    const oldKey = await this.prisma.apiKey.findUnique({ where: { id: expiredKeyId } });
    if (!oldKey) throw new NotFoundException('Expired API key not found');
    if (new Date(oldKey.expiresAt) > new Date()) {
      throw new BadRequestException('Provided key is not expired');
    }
    const newKey = uuidv4();
    const expiresAt = this.parseExpiry(newExpiry);
    const record = await this.prisma.apiKey.create({
      data: {
        name: oldKey.name,
        permissions: oldKey.permissions,
        expiresAt,
        key: newKey,
        userId: oldKey.userId,
      },
    });
    return { api_key: record.key, expires_at: record.expiresAt };
  }
}
