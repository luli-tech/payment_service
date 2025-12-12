import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    picture?: string;
  };
}

@ApiTags('API Keys')
@ApiBearerAuth()
@Controller('keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post('create')
  @ApiOperation({
    summary: 'Create a new API key',
    description:
      'Generates a new API Key for service-to-service authentication. Max 5 active keys per user.',
  })
  @ApiResponse({
    status: 201,
    description:
      'API key created successfully. Returns the key string securely (masked in logs).',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Limit reached or invalid input.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized. User not authenticated.',
  })
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() createApiKeyDto: CreateApiKeyDto,
  ) {
    const userId = req.user.id;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const result = await this.apiKeysService.create({
      ...createApiKeyDto,
      userId,
    } as any);
    return {
      api_key: result.api_key,
      expires_at: result.expiresAt,
    };
  }

  @Post('rollover')
  @ApiOperation({
    summary: 'Rollover an expired API key',
    description:
      'Generates a new API Key sharing the same permissions as a previously expired key.',
  })
  @ApiResponse({
    status: 201,
    description: 'New API key generated. Old key remains expired.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request. Key not expired or invalid ID.',
  })
  @ApiResponse({ status: 404, description: 'Expired key not found.' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        expired_key_id: { type: 'string' },
        expiry: { type: 'string', example: '1M' },
      },
    },
  })
  rollover(@Body() body: { expired_key_id: string; expiry: string }) {
    return this.apiKeysService.rollover(body.expired_key_id, body.expiry);
  }
}
