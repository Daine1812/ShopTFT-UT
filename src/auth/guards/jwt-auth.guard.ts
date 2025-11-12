// src/auth/guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

// === DÁN TIẾP PHẦN 2 VÀO ĐÂY ===

  /**
   * Ghi đè phương thức canActivate
   * (Logic này chạy trước TẤT CẢ các API)
   */
  canActivate(context: ExecutionContext) {
    // 1. Kiểm tra xem API có "chìa khóa" @Public() không
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 2. Nếu có @Public(), cho qua luôn (return true)
    if (isPublic) {
      return true;
    }

    // 3. Nếu không, chạy quy trình kiểm tra Token (JWT) như bình thường
    return super.canActivate(context);
  }
}
// === HẾT PHẦN 2 ===