import { Module } from '@nestjs/common';
import { PrismaModule } from './database/prisma/prisma.module';
import { envValidationSchema } from './configs/env.validation';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './modules/users/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { MailModule } from './share/mail/mail.module';
import { Redis} from './database/redis/redis.module';

@Module({
  imports: [
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: envValidationSchema,
    }),
    MailModule,
    Redis,
    //------feature modules-------
    UserModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
