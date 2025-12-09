import { ApiProperty } from '@nestjs/swagger';
import { ApiKeyPermission } from '../../common/enums/api-key-permission.enum';

export class CreateApiKeyDto {
  @ApiProperty({ description: 'Name of the API Key', example: 'My Service Key' })
  name: string;

  @ApiProperty({ description: 'List of permissions', enum: ApiKeyPermission, isArray: true, example: [ApiKeyPermission.READ, ApiKeyPermission.DEPOSIT] })
  permissions: ApiKeyPermission[];

  @ApiProperty({ description: 'Expiry duration', example: '1D' })
  expiry: string; // "1H", "1D", "1M", "1Y"
}

