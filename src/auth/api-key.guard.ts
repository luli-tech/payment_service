import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'] as string;
    if (!apiKey) {
      throw new UnauthorizedException('API key missing');
    }
    const keyRecord = await this.prisma.apiKey.findUnique({ where: { key: apiKey } });
    if (!keyRecord) {
      throw new UnauthorizedException('Invalid API key');
    }
    if (keyRecord.revoked) {
      throw new ForbiddenException('API key revoked');
    }
    if (new Date(keyRecord.expiresAt) < new Date()) {
      throw new ForbiddenException('API key expired');
    }
    // attach to request for downstream use
    (request as any).apiKey = keyRecord;
    return true;
  }
}
