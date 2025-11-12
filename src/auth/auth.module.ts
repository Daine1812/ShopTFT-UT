import { Module, forwardRef } from '@nestjs/common'; // Import forwardRef
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module'; // Import UsersModule
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    // 1. Dùng forwardRef() để phá vỡ vòng lặp phụ thuộc UsersModule
    forwardRef(() => UsersModule),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ConfigModule,
    
    // Cấu hình JWT
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: configService.get('JWT_EXPIRES_IN') },
      }),
      inject: [ConfigService],
    }),
  ],
// === DÁN TIẾP PHẦN 2 VÀO ĐÂY ===
  
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy], // Thêm JwtStrategy
  // 2. Export các thứ cần thiết (AuthService và PassportModule)
  exports: [AuthService, JwtModule, PassportModule], 
})
export class AuthModule {}
