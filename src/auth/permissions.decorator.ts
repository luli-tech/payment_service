import { SetMetadata } from '@nestjs/common';
import { ApiKeyPermission } from '@prisma/client';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: ApiKeyPermission[]) => SetMetadata(PERMISSIONS_KEY, permissions);
