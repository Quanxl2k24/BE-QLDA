import {
  Body,
  Controller,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import {
  AuthForgotDTO,
  AuthLoginDTO,
  AuthOTPForgotDTO,
  AuthRestPasswordDTO,
  AuthResendOtpDTO,
} from '../dto/auth-login.dto';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh.use-case';
import { RefreshTokenGuard } from '../../infrastructure/guards/refresh-token.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { PayloadToken } from '@/common/types/types';
import { AccessTokenGuard } from '../../infrastructure/guards/access-token.guard';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { ForgotUseCase } from '../../application/use-cases/forgot.use-case';
import { OTPUseCase } from '../../application/use-cases/otp.use-case';
import { RestPasswordUseCase } from '../../application/use-cases/rest-pass.use-case';
import { ResendOtpUseCase } from '../../application/use-cases/resend-otp.use-case';
@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly configService: ConfigService,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly forgotUseCase: ForgotUseCase,
    private readonly otpUseCase: OTPUseCase,
    private readonly restPasswordUseCase: RestPasswordUseCase,
    private readonly resendOtpUseCase: ResendOtpUseCase,
  ) {}

  @Post('/login')
  async login(
    @Body() body: AuthLoginDTO,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const result = await this.loginUseCase.execute(body, req);

    res.cookie('accessToken', result.data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: Number(this.configService.get('MAX_AGE_ACCESS')) * 60 * 1000,
      path: '/',
    });

    res.cookie('refreshToken', result.data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:
        Number(this.configService.get('MAX_AGE_REFRESH')) * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return {
      message: 'Login successfully',
    };
  }

  @Post('/refresh')
  @UseGuards(RefreshTokenGuard)
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @CurrentUser() user: PayloadToken,
  ) {
    const result = await this.refreshTokenUseCase.execute(
      req.cookies.refreshToken,
      user,
    );

    res.cookie('accessToken', result.data.accessTokenNew, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: Number(this.configService.get('MAX_AGE_ACCESS')) * 60 * 1000,
      path: '/',
    });

    res.cookie('refreshToken', result.data.refreshTokenNew, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: Math.max(0, result.data.expiresAt.getTime() - Date.now()),
      path: '/',
    });

    return {
      message: 'Refresh token successfully',
    };
  }

  @UseGuards(AccessTokenGuard)
  @Post('/logout')
  async logout(@Res({ passthrough: true }) res: Response, @Req() req: Request) {
    res.clearCookie('refreshToken');
    res.clearCookie('accessToken');
    return this.logoutUseCase.execute(req.cookies.refreshToken);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: AuthForgotDTO) {
    return this.forgotUseCase.execute(body.email);
  }

  @Post('/otp-forgot')
  async otpForgot(@Body() body: AuthOTPForgotDTO) {
    return this.otpUseCase.execute(body.email, body.otp);
  }

  @Post('/rest-password')
  async restPassword(
    @Query('token') token: string,
    @Body() body: AuthRestPasswordDTO,
  ) {
    return this.restPasswordUseCase.execute(token, body.password);
  }

  @Post('/resend-otp')
  async resendOtp(@Body() body: AuthResendOtpDTO) {
    return this.resendOtpUseCase.execute(body.email);
  }
}
