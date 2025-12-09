import { ApiKeyPermission } from '../../common/enums/api-key-permission.enum';

export class CreateApiKeyDto {
  name: string;
  permissions: ApiKeyPermission[];
  expiry: string; // "1H", "1D", "1M", "1Y"
}

