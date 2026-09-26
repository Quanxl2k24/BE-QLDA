/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { MailerService } from '@nestjs-modules/mailer';
import { getQueueToken } from '@nestjs/bullmq';
import { MailType } from './types/mail.types';

describe('MailService', () => {
  let service: MailService;
  let mockSendMail: jest.Mock;
  let mockQueueAdd: jest.Mock;

  beforeEach(async () => {
    mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-msg-id' });
    mockQueueAdd = jest.fn().mockResolvedValue({ id: 'job-1' });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: MailerService,
          useValue: {
            sendMail: mockSendMail,
          },
        },
        // Mock BullQueue_email token (required sau khi bỏ @Optional)
        {
          provide: getQueueToken('email'),
          useValue: {
            add: mockQueueAdd,
          },
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateOtp', () => {
    it('should generate a 6-digit numeric string', () => {
      const otp = service.generateOtp(6);
      expect(otp).toHaveLength(6);
      expect(/^\d{6}$/.test(otp)).toBe(true);
    });
  });

  describe('sendForgotPassword', () => {
    it('should enqueue job with forgot-password template and 6-char OTP (default queue)', async () => {
      const otp = '849201';
      await service.sendForgotPassword('user@example.com', otp, {
        fullName: 'Test User',
      });

      // Mặc định → đẩy vào queue
      expect(mockQueueAdd).toHaveBeenCalledWith(
        'send-email',
        expect.objectContaining({
          to: 'user@example.com',
          template: 'forgot-password',
          context: expect.objectContaining({
            email: 'user@example.com',
            otp: '849201',
            fullName: 'Test User',
            expiresInMinutes: 5,
          }),
        }),
        expect.any(Object),
      );
    });

    it('should send direct when useQueue=false', async () => {
      const otp = '849201';
      await service.sendForgotPassword('user@example.com', otp, {
        fullName: 'Test User',
        useQueue: false,
      });

      // useQueue=false → gửi thẳng SMTP
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          template: 'forgot-password',
        }),
      );
      expect(mockQueueAdd).not.toHaveBeenCalled();
    });
  });

  describe('sendRegisterWelcome', () => {
    it('should enqueue job with register template', async () => {
      await service.sendRegisterWelcome('newuser@example.com', {
        fullName: 'New User',
      });

      expect(mockQueueAdd).toHaveBeenCalledWith(
        'send-email',
        expect.objectContaining({
          to: 'newuser@example.com',
          template: 'register',
          context: expect.objectContaining({
            email: 'newuser@example.com',
            fullName: 'New User',
          }),
        }),
        expect.any(Object),
      );
    });
  });

  describe('sendDeviceLimitAlert', () => {
    it('should enqueue job with device-limit-alert template and currentDevice info', async () => {
      await service.sendDeviceLimitAlert('user@example.com', {
        currentDevice: {
          deviceName: 'iPhone 15 Pro',
          deviceType: 'Mobile',
          ipAddress: '127.0.0.1',
        },
        deviceLimit: 3,
        activeDevicesCount: 4,
      });

      expect(mockQueueAdd).toHaveBeenCalledWith(
        'send-email',
        expect.objectContaining({
          to: 'user@example.com',
          template: 'device-limit-alert',
          context: expect.objectContaining({
            email: 'user@example.com',
            deviceLimit: 3,
            activeDevicesCount: 4,
            currentDevice: expect.objectContaining({
              deviceName: 'iPhone 15 Pro',
            }),
          }),
        }),
        expect.any(Object),
      );
    });
  });

  describe('sendMailByType', () => {
    it('should dispatch FORGOT_PASSWORD to correct template via queue', async () => {
      await service.sendMailByType(
        MailType.FORGOT_PASSWORD,
        'user@example.com',
        { otp: '654321' },
      );

      expect(mockQueueAdd).toHaveBeenCalledWith(
        'send-email',
        expect.objectContaining({
          to: 'user@example.com',
          template: 'forgot-password',
        }),
        expect.any(Object),
      );
    });
  });
});
