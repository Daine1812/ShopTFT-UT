import { SetMetadata } from '@nestjs/common';
import { Role } from '../../users/role.enum'; // Import Role enum

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);