import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateUseCase } from '../../application/use-cases/CreateUser.use-case';
import { CreateUserDto } from '../dto/create-user.dto';
import { getUserByEmmail } from '../dto/get-user-by-email.dto';
import { GetUserByEmailUseCase } from '../../application/use-cases/GetUserByEmail.use-case';
import { ApiTags } from '@nestjs/swagger';
import { GetMeUseCase } from '../../application/use-cases/GetMe.use-case';
import type { Request } from 'express';
import { AccessTokenGuard } from '@/modules/auth/infrastructure/guards/access-token.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import * as types from '@/common/types/types';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { PermissionEnum } from '@/common/enums';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { UpdateUserUseCase } from '../../application/use-cases/UpdateUser.use-case';
import { UpdateUserDto } from '../dto/update-user.dto';

@ApiTags('User')
@Controller({
  // path: 'users',
  version: '1',
})
export class UserController {
  constructor(
    private readonly createUseCase: CreateUseCase,
    private readonly getUserByEmailUseCase: GetUserByEmailUseCase,
    private readonly getMeUseCase: GetMeUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
  ) {}

  //everybody

  @Get('user/me')
  @UseGuards(AccessTokenGuard, PermissionsGuard)
  @RequirePermissions(PermissionEnum.USER_READ)
  @HttpCode(HttpStatus.OK)
  async getMe(@CurrentUser() user: types.PayloadToken) {
    return await this.getMeUseCase.execute(user);
  }

  @Patch('user/me')
  @UseGuards(AccessTokenGuard, PermissionsGuard)
  @RequirePermissions(PermissionEnum.USER_UPDATE)
  @HttpCode(HttpStatus.OK)
  async updateUser(
    @CurrentUser() user: types.PayloadToken,
    @Body() dto: UpdateUserDto,
  ) {
    const data = await this.updateUserUseCase.execute(user.sub, dto);
    return {
      message: 'Cập nhật thông tin thành công',
      data,
    };
  }

  //admin
  @Post('user')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: CreateUserDto) {
    const user = await this.createUseCase.execute(dto);

    return {
      message: 'Create user successfully',
      data: user,
    };
  }

  @Get('user')
  @HttpCode(HttpStatus.OK)
  async getAllByUser(@Query() dto: getUserByEmmail) {
    const user = await this.getUserByEmailUseCase.execute(dto.email);
    return {
      message: 'Get user by email successfully',
      data: user,
    };
  }
}
