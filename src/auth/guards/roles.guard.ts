import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../users/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Lấy ra danh sách 'roles' yêu cầu (vd: [Role.ADMIN])
    //    từ decorator @Roles(Role.ADMIN)
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    // 2. Nếu route không yêu cầu role nào (không có @Roles)
    //    -> cho phép tất cả (public hoặc đã qua JwtAuthGuard)
    if (!requiredRoles) {
      return true;
    }

    // 3. Lấy thông tin user từ request (đã được JwtStrategy đính vào)
    const { user } = context.switchToHttp().getRequest();

    // 4. Kiểm tra xem role của user có nằm trong danh sách role yêu cầu không
    return requiredRoles.some((role) => user.role === role);
  }
}