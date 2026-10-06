import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Enable versioning for the API
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  // Global ValidationPipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Tự động loại bỏ các trường không có trong DTO
      forbidNonWhitelisted: true, // Báo lỗi nếu client gửi trường lạ
      transform: true, // Tự động ép kiểu dữ liệu (vd: string -> number)
      transformOptions: {
        enableImplicitConversion: true, // Khuyên dùng: giúp ép kiểu mượt hơn
      },
    }),
  );
  // Global ResponseInterceptor
  app.useGlobalInterceptors(new ResponseInterceptor());

  // swagger
  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('Hệ thống quản lý bánh trung thu Kinh Đô')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true, withCredentials: true },
  });
  //cookie
  app.use(cookieParser());

  //server listen
  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `Server is running on http://localhost:${process.env.PORT ?? 3000}/api/docs`,
  );
}
bootstrap();
