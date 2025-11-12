import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator này đánh dấu một route là "Công khai".
 * JwtAuthGuard (Global) sẽ thấy key này và bỏ qua kiểm tra Token.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);