import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { Request } from 'express';
import { PERMISSIONS_KEY } from './permissions.decorator';
import { ApiKeyPermission } from '../common/enums/api-key-permission.enum';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  // Secure Hash
  private hashKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    // Allow if JWT token is present (skip API key check to let JwtAuthGuard handle it or if using Composite)
    // However, if we strictly want this to GUARD api keys, we typically run it only if API key header is present OR if we want to enforce it.
    // The requirement says: "If x-api-key -> treat as service".

    // Check if API Key is present
    const apiKey = request.headers['x-api-key'] as string;

    // If no API key, and we are relying on this guard, strictly it fails.
    // BUT since we use @UseGuards(JwtAuthGuard, ApiKeyGuard), standard Nest behavior is ALL guards must pass.
    // This is problematic for "OR" logic.
    // We will assume a Composite Guard is better, OR we modify this guard to pass if it sees a Bearer token (deferring to JWT guard),
    // BUT that's messy.
    // Let's implement the checking logic first.

    if (!apiKey) {
      // UnifiedAuthGuard ensures this guard handles logic when header is present.
      // But if used alone, it should enforce key presence.
      throw new UnauthorizedException('API key missing');
    }

    const hashedApiKey = this.hashKey(apiKey);
    const keyRecord = await this.prisma.apiKey.findUnique({
      where: { key: hashedApiKey },
    });
    if (!keyRecord) {
      throw new UnauthorizedException('Invalid API key');
    }
    if (keyRecord.revoked) {
      throw new ForbiddenException('API key revoked');
    }
    if (new Date(keyRecord.expiresAt) < new Date()) {
      throw new ForbiddenException('API key expired');
    }

    // Check Permissions
    const requiredPermissions = this.reflector.getAllAndOverride<
      ApiKeyPermission[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (requiredPermissions) {
      const hasPermission = requiredPermissions.every((permission) =>
        keyRecord.permissions.includes(permission),
      );
      if (!hasPermission) {
        throw new ForbiddenException('Insufficient permissions');
      }
    }

    // attach to request for downstream use
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    (request as any).apiKey = keyRecord;
    return true;
  }
}
