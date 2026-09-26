export enum MailType {
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
  REGISTER = 'REGISTER',
  DEVICE_LIMIT_EXCEEDED = 'DEVICE_LIMIT_EXCEEDED',
  CUSTOM = 'CUSTOM',
}

export interface BaseMailContext {
  appName?: string;
  supportEmail?: string;
  year?: number;
  [key: string]: unknown;
}

export interface ForgotPasswordContext extends BaseMailContext {
  email: string;
  otp: string; // 6 kí tự
  fullName?: string;
  expiresInMinutes?: number;
}

export interface RegisterContext extends BaseMailContext {
  email: string;
  fullName?: string;
  activationUrl?: string;
  otp?: string;
}

export interface DeviceInfo {
  deviceName?: string;
  deviceType?: string;
  ipAddress?: string;
  loginTime?: string;
  userAgent?: string;
}

export interface DeviceLimitContext extends BaseMailContext {
  email: string;
  fullName?: string;
  currentDevice: DeviceInfo;
  deviceLimit?: number;
  activeDevicesCount?: number;
  activeDevices?: DeviceInfo[];
  revokeSessionsUrl?: string;
  changePasswordUrl?: string;
}

export interface SendMailOptions<T = Record<string, unknown>> {
  to: string;
  subject?: string;
  template?: string;
  context?: T;
  useQueue?: boolean;
}

export interface SendMailJobData {
  to: string;
  subject: string;
  template: string;
  context: Record<string, unknown>;
}
