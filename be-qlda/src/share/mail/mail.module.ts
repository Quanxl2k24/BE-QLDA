import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailProcessor } from './mail.processor';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { QueueModule } from '../quece/quece.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { existsSync } from 'fs';
import { join } from 'path';

function resolveTemplateDir(): string {
  const candidateDirs = [
    join(__dirname, 'templates'),
    join(__dirname, 'template'),
    join(process.cwd(), 'src', 'share', 'mail', 'templates'),
    join(process.cwd(), 'src', 'share', 'mail', 'template'),
    join(process.cwd(), 'dist', 'share', 'mail', 'templates'),
    join(process.cwd(), 'dist', 'share', 'mail', 'template'),
  ];

  for (const dir of candidateDirs) {
    if (existsSync(dir)) {
      return dir;
    }
  }

  return join(__dirname, 'templates');
}

@Global()
@Module({
  imports: [
    // QueueModule export BullModule với 'email' queue đã registered
    QueueModule,

    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const port = configService.get<number>('MAIL_PORT', 587);
        const isSecure = port === 465;

        return {
          transport: {
            host: configService.get<string>('MAIL_HOST', 'smtp.gmail.com'),
            port: port,
            secure: isSecure,
            auth: {
              user: configService.get<string>('MAIL_USER'),
              pass: configService.get<string>('MAIL_PASS'),
            },
            tls: {
              rejectUnauthorized: false,
            },
          },
          defaults: {
            from: `"${configService.get<string>('MAIL_FROM_NAME', 'Kinh Đô Mooncake')}" <${
              configService.get<string>('MAIL_FROM') ||
              configService.get<string>('MAIL_USER') ||
              'noreply@kinhdo.vn'
            }>`,
          },
          template: {
            dir: resolveTemplateDir(),
            adapter: new HandlebarsAdapter(),
            options: {
              strict: false,
            },
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [MailService, MailProcessor],
  exports: [MailService, MailerModule, QueueModule],
})
export class MailModule {}
