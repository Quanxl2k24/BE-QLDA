import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as crypto from 'crypto';
import {
  DeviceInfo,
  DeviceLimitContext,
  ForgotPasswordContext,
  MailType,
  RegisterContext,
  SendMailJobData,
  SendMailOptions,
} from './types/mail.types';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly defaultAppName = 'Kinh Đô Mooncake';
  private readonly defaultSupportEmail = 'hotro@kinhdo.vn';

  constructor(
    private readonly mailerService: MailerService,
    @InjectQueue('email')
    private readonly emailQueue: Queue<SendMailJobData>,
  ) {}

  /**
   * Sinh mã OTP 6 ký tự số ngẫu nhiên an toàn bằng crypto
   * @param length Số lượng ký tự (mặc định 6)
   */
  generateOtp(length: number = 6): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return crypto.randomInt(min, max + 1).toString();
  }

  /**
   * Gửi email quên mật khẩu với mã code OTP 6 ký tự
   */
  async sendForgotPassword(
    to: string,
    otp: string,
    options?: {
      fullName?: string;
      expiresInMinutes?: number;
      subject?: string;
      customTemplate?: string;
      useQueue?: boolean;
    },
  ): Promise<void> {
    const context: ForgotPasswordContext = {
      email: to,
      otp: otp || this.generateOtp(6),
      fullName: options?.fullName,
      expiresInMinutes: options?.expiresInMinutes ?? 5,
      appName: this.defaultAppName,
      supportEmail: this.defaultSupportEmail,
      year: new Date().getFullYear(),
    };

    const subject =
      options?.subject ||
      `[${this.defaultAppName}] Mã xác nhận đặt lại mật khẩu: ${context.otp}`;
    const template = options?.customTemplate || 'forgot-password';

    await this.sendMailInternal({
      to,
      subject,
      template,
      context,
      useQueue: options?.useQueue,
    });
  }

  /**
   * Gửi email chào mừng khi đăng ký tài khoản thành công
   */
  async sendRegisterWelcome(
    to: string,
    options?: {
      fullName?: string;
      otp?: string;
      activationUrl?: string;
      subject?: string;
      customTemplate?: string;
      useQueue?: boolean;
    },
  ): Promise<void> {
    const context: RegisterContext = {
      email: to,
      fullName: options?.fullName,
      otp: options?.otp,
      activationUrl: options?.activationUrl,
      appName: this.defaultAppName,
      supportEmail: this.defaultSupportEmail,
      year: new Date().getFullYear(),
    };

    const subject =
      options?.subject ||
      `[${this.defaultAppName}] Chào mừng bạn gia nhập thành viên mới!`;
    const template = options?.customTemplate || 'register';

    await this.sendMailInternal({
      to,
      subject,
      template,
      context,
      useQueue: options?.useQueue,
    });
  }

  /**
   * Gửi email cảnh báo bảo mật khi đăng nhập quá 3 thiết bị
   */
  async sendDeviceLimitAlert(
    to: string,
    data: {
      fullName?: string;
      currentDevice: DeviceInfo;
      deviceLimit?: number;
      activeDevicesCount?: number;
      activeDevices?: DeviceInfo[];
      changePasswordUrl?: string;
      subject?: string;
      customTemplate?: string;
      useQueue?: boolean;
    },
  ): Promise<void> {
    const context: DeviceLimitContext = {
      email: to,
      fullName: data.fullName,
      currentDevice: {
        ...data.currentDevice,
        loginTime:
          data.currentDevice.loginTime ||
          new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      },
      deviceLimit: data.deviceLimit ?? 3,
      activeDevicesCount: data.activeDevicesCount,
      activeDevices: data.activeDevices,
      changePasswordUrl: data.changePasswordUrl,
      appName: this.defaultAppName,
      supportEmail: this.defaultSupportEmail,
      year: new Date().getFullYear(),
    };

    const subject =
      data.subject ||
      `[CẢNH BÁO BẢO MẬT] Phát hiện đăng nhập vượt quá ${context.deviceLimit} thiết bị`;
    const template = data.customTemplate || 'device-limit-alert';

    await this.sendMailInternal({
      to,
      subject,
      template,
      context,
      useQueue: data.useQueue,
    });
  }

  /**
   * Gửi email linh hoạt theo từng loại MailType (có thể tùy biến custom template và context)
   */
  async sendMailByType(
    type: MailType,
    to: string,
    contextData: Record<string, unknown>,
    options?: {
      subject?: string;
      customTemplate?: string;
      useQueue?: boolean;
    },
  ): Promise<void> {
    switch (type) {
      case MailType.FORGOT_PASSWORD: {
        const otp =
          typeof contextData.otp === 'string'
            ? contextData.otp
            : this.generateOtp(6);
        await this.sendForgotPassword(to, otp, {
          ...options,
          ...contextData,
        });
        return;
      }

      case MailType.REGISTER:
        await this.sendRegisterWelcome(to, {
          ...options,
          ...contextData,
        });
        return;

      case MailType.DEVICE_LIMIT_EXCEEDED: {
        const currentDevice = (contextData.currentDevice || {}) as DeviceInfo;
        await this.sendDeviceLimitAlert(to, {
          ...contextData,
          ...options,
          currentDevice,
        });
        return;
      }

      case MailType.CUSTOM:
      default: {
        const defaultSubject =
          typeof contextData.subject === 'string'
            ? contextData.subject
            : `[${this.defaultAppName}] Thông báo từ hệ thống`;
        const template =
          options?.customTemplate ||
          (typeof contextData.template === 'string'
            ? contextData.template
            : 'register');

        await this.sendCustomMail({
          to,
          subject: options?.subject || defaultSubject,
          template,
          context: {
            appName: this.defaultAppName,
            supportEmail: this.defaultSupportEmail,
            year: new Date().getFullYear(),
            ...contextData,
          },
          useQueue: options?.useQueue,
        });
        return;
      }
    }
  }

  /**
   * Gửi email tùy biến bất kỳ template nào với dữ liệu context tự do
   */
  async sendCustomMail(options: {
    to: string;
    subject: string;
    template: string;
    context: Record<string, unknown>;
    useQueue?: boolean;
  }): Promise<void> {
    const fullContext: Record<string, unknown> = {
      appName: this.defaultAppName,
      supportEmail: this.defaultSupportEmail,
      year: new Date().getFullYear(),
      ...options.context,
    };

    await this.sendMailInternal({
      to: options.to,
      subject: options.subject,
      template: options.template,
      context: fullContext,
      useQueue: options.useQueue,
    });
  }

  /**
   * Gửi trực tiếp qua MailerService (không qua hàng đợi)
   */
  async sendDirect(options: {
    to: string;
    subject: string;
    template: string;
    context: Record<string, unknown>;
  }): Promise<void> {
    this.logger.log(
      `Sending email directly to ${options.to} with template [${options.template}]`,
    );
    await this.mailerService.sendMail({
      to: options.to,
      subject: options.subject,
      template: options.template,
      context: options.context,
    });
  }

  /**
   * Đẩy email vào BullMQ queue để xử lý nền bất đồng bộ
   */
  async sendToQueue(jobData: SendMailJobData): Promise<void> {
    this.logger.log(
      `Enqueuing email job to ${jobData.to} with template [${jobData.template}]`,
    );
    await this.emailQueue.add('send-email', jobData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 200 },
    });
  }

  /**
   * Hàm điều phối nội bộ:
   * - useQueue === false  → gửi thẳng qua SMTP (synchronous, chờ kết quả)
   * - mặc định          → đẩy vào Redis queue (async, worker xử lý nền)
   */
  private async sendMailInternal(
    options: SendMailOptions<Record<string, unknown>>,
  ): Promise<void> {
    const jobData: SendMailJobData = {
      to: options.to,
      subject: options.subject || `[${this.defaultAppName}] Thông báo`,
      template: options.template || 'register',
      context: options.context || {},
    };

    if (options.useQueue === false) {
      await this.sendDirect(jobData);
      return;
    }

    // Mặc định luôn đẩy vào queue (BullMQ + Redis)
    await this.sendToQueue(jobData);
  }
}
