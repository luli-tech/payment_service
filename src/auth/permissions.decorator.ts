import { SetMetadata } from '@nestjs/common';
import { ApiKeyPermission } from '../common/enums/api-key-permission.enum';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: ApiKeyPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
