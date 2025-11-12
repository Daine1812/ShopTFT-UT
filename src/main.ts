import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// === THÊM 2 DÒNG NÀY ===
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
// ======================

async function bootstrap() {
  // === SỬA DÒNG NÀY ===
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // ======================

  app.enableCors(); // Giữ nguyên CORS

  // === THÊM KHỐI CODE NÀY ĐỂ SERVE ẢNH ===
  // Cấu hình server để phục vụ file tĩnh từ thư mục 'public'
  // __dirname là thư mục 'dist' (sau khi build), '..' để đi ra ngoài
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    // Cấu hình URL, ví dụ: /uploads/ten-file-anh.jpg
    prefix: '/',
  });
  // ======================================

  await app.listen(process.env.PORT || 3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
