import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { UpdateApiKeyDto } from './dto/update-api-key.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

@ApiTags('API Keys')
@ApiBearerAuth()
@Controller('keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post('create')
  @ApiOperation({ 
    summary: 'Create a new API key', 
    description: 'Generates a new API Key for service-to-service authentication. Max 5 active keys per user.' 
  })
  @ApiResponse({ status: 201, description: 'API key created successfully. Returns the key string securely (masked in logs).' })
  @ApiResponse({ status: 400, description: 'Bad Request. Limit reached or invalid input.' })
  @ApiResponse({ status: 401, description: 'Unauthorized. User not authenticated.' })
  create(@Req() req, @Body() createApiKeyDto: CreateApiKeyDto) {
    const userId = req.user.sub;
    return this.apiKeysService.create({ ...createApiKeyDto, userId } as any);
  }

  @Post('rollover')
  @ApiOperation({ 
    summary: 'Rollover an expired API key', 
    description: 'Generates a new API Key sharing the same permissions as a previously expired key.' 
  })
  @ApiResponse({ status: 201, description: 'New API key generated. Old key remains expired.' })
  @ApiResponse({ status: 400, description: 'Bad Request. Key not expired or invalid ID.' })
  @ApiResponse({ status: 404, description: 'Expired key not found.' })
  @ApiBody({ schema: { type: 'object', properties: { expired_key_id: { type: 'string' }, expiry: { type: 'string', example: '1M' } } } })
  rollover(@Body() body: { expired_key_id: string; expiry: string }) {
    return this.apiKeysService.rollover(body.expired_key_id, body.expiry);
  }

  @Get()
  @ApiOperation({ summary: 'List all API keys (Admin/Debug)', description: 'Retrieves all API keys in the system. WARNING: Admin only.' })
  @ApiResponse({ status: 200, description: 'List of API keys returned.' })
  findAll() {
    return this.apiKeysService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get API key by ID', description: 'Retrieve details of a specific API key.' })
  @ApiResponse({ status: 200, description: 'API key details found.' })
  @ApiResponse({ status: 404, description: 'API Key not found.' })
  findOne(@Param('id') id: string) {
    return this.apiKeysService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update API key', description: 'Update permissions or name of an API key.' })
  @ApiResponse({ status: 200, description: 'API key updated.' })
  update(@Param('id') id: string, @Body() updateApiKeyDto: UpdateApiKeyDto) {
    return this.apiKeysService.update(id, updateApiKeyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoke/Remove API key', description: 'Permanently deletes or revokes an API key.' })
  @ApiResponse({ status: 200, description: 'API key removed.' })
  remove(@Param('id') id: string) {
    return this.apiKeysService.remove(id);
  }
}
