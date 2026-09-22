import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { CreateUseCase } from '../../application/use-cases/CreateUser.use-case';
import { CreateUserDto } from '../dto/create-user.dto';
import { getUserByEmmail } from '../dto/get-user-by-email.dto';
import { getUserByEmailUseCase } from '../../application/use-cases/GetUserByEmail.use-case';

@Controller({
  path: 'users',
  version: '1',
})
export class UserController {
  constructor(
    private readonly createUseCase: CreateUseCase,
    private readonly getUserByEmailUseCase: getUserByEmailUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: CreateUserDto) {
    const user = await this.createUseCase.execute(dto);

    return {
      message: 'Create user successfully',
      data: user,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllByUser(@Query() dto: getUserByEmmail) {
    const user = await this.getUserByEmailUseCase.execute(dto.email);
    return {
      message: 'Get user by email successfully',
      data: user,
    };
  }
}
