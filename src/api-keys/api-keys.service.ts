import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  // Convert "1D", "1H", "1M", "1Y" → REAL Date
  private parseExpiry(expiry: string): Date {
    if (!['H', 'D', 'M', 'Y'].includes(expiry.slice(-1).toUpperCase())) {
      throw new BadRequestException('Expiry must be one of: 1H, 1D, 1M, 1Y');
    }

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

  // Secure Hash
  private hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  // Generate a Stripe-like key
  private generateKey(): { plain: string; hashed: string } {
    const plain = `sk_live_${uuidv4().replace(/-/g, '')}`;
    return { plain, hashed: this.hashKey(plain) };
  }

  async create(dto: CreateApiKeyDto & { userId: string }) {
    const { name, permissions, expiry, userId } = dto;

    // ENFORCE permitted permissions
    const validPerms = ['READ', 'DEPOSIT', 'TRANSFER'];
    permissions.forEach((p) => {
      if (!validPerms.includes(p.toUpperCase())) {
        throw new BadRequestException(`Invalid permission: ${p}`);
      }
    });

    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new BadRequestException('User with provided ID does not exist');
      }
    }

    // Maximum 5 active keys per user
    const active = await this.prisma.apiKey.count({
      where: {
        userId,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (active >= 5)
      throw new BadRequestException('Max 5 active API keys reached');

    const expiresAt = this.parseExpiry(expiry);

    const { plain, hashed } = this.generateKey();

    const record = await this.prisma.apiKey.create({
      data: {
        name,
        permissions,
        expiresAt,
        key: hashed, // Store hashed key only
        userId,
        revoked: false,
      },
    });

    return {
      id: record.id,
      name: record.name,
      userId: record.userId,
      permissions: record.permissions,
      revoked: record.revoked,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      expiresAt: record.expiresAt,
      api_key: plain, // include the plain key
    };

    // return {
    //   api_key: plain, // Return plain ONLY ONCE
    //   expires_at: expiresAt,
    // };
  }

  async findAll() {
    return this.prisma.apiKey.findMany({
      select: {
        id: true,
        name: true,
        permissions: true,
        expiresAt: true,
        revoked: true,
        userId: true,
        createdAt: true,
        key: true,
      },
    });
  }

  async findOne(id: string) {
    const key = await this.prisma.apiKey.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        permissions: true,
        expiresAt: true,
        revoked: true,
        userId: true,
        key: true,
      },
    });

    if (!key) throw new NotFoundException('API key not found');
    return key;
  }

  async update(id: string, dto: UpdateApiKeyDto) {
    return this.prisma.apiKey.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    return this.prisma.apiKey.update({
      where: { id },
      data: { revoked: true },
    });
  }

  // Rollover logic
  async rollover(expiredKeyId: string, expiry: string) {
    const oldKey = await this.prisma.apiKey.findUnique({
      where: { id: expiredKeyId },
    });

    if (!oldKey) throw new NotFoundException('Key not found');

    if (oldKey.expiresAt > new Date()) {
      throw new BadRequestException('Key is not yet expired');
    }

    // Mark old key as revoked
    await this.prisma.apiKey.update({
      where: { id: expiredKeyId },
      data: { revoked: true },
    });

    // Create new key with same permissions
    const expiresAt = this.parseExpiry(expiry);
    const { plain, hashed } = this.generateKey();

    const newKey = await this.prisma.apiKey.create({
      data: {
        name: oldKey.name,
        permissions: oldKey.permissions,
        expiresAt,
        key: hashed,
        userId: oldKey.userId,
      },
    });

    return {
      api_key: plain,
      expires_at: expiresAt,
    };
  }
}
