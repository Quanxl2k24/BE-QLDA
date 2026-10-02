import { SetMetadata } from '@nestjs/common';
import { PermissionEnum } from '../enums/rbac.enum';

export const PERMISSIONS_KEY = 'permissions';

export const RequirePermissions = (...permissions: (PermissionEnum | string)[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
