import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../users/users.entity';

/**
 * Decorator này giúp lấy thông tin 'user' đã được đính kèm
 * vào request bởi JwtStrategy.
 * * Thay vì dùng: @Req() req
 * Chúng ta sẽ dùng: @GetUser() user
 */
export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);