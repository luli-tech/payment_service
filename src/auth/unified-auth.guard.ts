import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';
import { JwtAuthGuard } from './jwt-auth.guard';

@Injectable()
export class UnifiedAuthGuard implements CanActivate {
  constructor(
    private readonly apiKeyGuard: ApiKeyGuard,
    private readonly jwtAuthGuard: JwtAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];
    const apiKeyHeader = request.headers['x-api-key'];

    if (apiKeyHeader) {
      return this.apiKeyGuard.canActivate(context);
    }

    if (authHeader && authHeader.startsWith('Bearer ')) {
      return this.jwtAuthGuard.canActivate(context) as Promise<boolean>;
    }

    throw new UnauthorizedException(
      'Authentication required: Missing JWT or API Key',
    );
  }
}
