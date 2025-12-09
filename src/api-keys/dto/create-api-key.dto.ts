import { ApiKeyPermission } from '@prisma/client';

export class CreateApiKeyDto {
  name: string;
  permissions: ApiKeyPermission[];
  expiry: string; // "1H", "1D", "1M", "1Y"
}

