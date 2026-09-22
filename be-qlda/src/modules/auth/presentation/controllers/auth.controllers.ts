import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { AuthLoginDTO } from '../dto/auth-login.dto';
import type { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller({
  path: 'auth',
  version: '1',
})
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly configService: ConfigService,
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
}
