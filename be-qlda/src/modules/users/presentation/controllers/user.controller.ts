import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import { CreateUseCase } from '../../application/use-cases/CreateUser.use-case';
import { CreateUserDto } from '../dto/create-user.dto';
import { GetUserByEmailDto } from '../dto/get-user-by-email.dto';
import { GetUserByEmailUseCase } from '../../application/use-cases/GetUserByEmail.use-case';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetMeUseCase } from '../../application/use-cases/GetMe.use-case';
import { AccessTokenGuard } from '@/modules/auth/infrastructure/guards/access-token.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import * as types from '@/common/types/types';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { PermissionEnum } from '@/common/enums';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { UpdateUserUseCase } from '../../application/use-cases/UpdateUser.use-case';
import { UpdateUserDto } from '../dto/update-user.dto';
import { GetUsersCursorUseCase } from '../../application/use-cases/GetUsers.use-case';
import { GetUsersCursorDto } from '../dto/get-users-cursor.dto';
import { GetUserByIdUseCase } from '../../application/use-cases/GetUserById.use-case';
import { UpdateUserStatusDto } from '../dto/update-user-status.dto';
import { UpdateUserStatusUseCase } from '../../application/use-cases/UpdateUserStatus.use-case';
import { DeleteUserUseCase } from '../../application/use-cases/DeleteUser.use-case';

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
    private readonly getUsersCursorUseCase: GetUsersCursorUseCase,
    private readonly getUserByIdUseCase: GetUserByIdUseCase,
    private readonly updateUserStatusUseCase: UpdateUserStatusUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
  ) {}

  //everybody

  @Get('user/me')
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  async getMe(@CurrentUser() user: types.PayloadToken) {
    return await this.getMeUseCase.execute(user);
  }

  @Patch('user/me')
  @UseGuards(AccessTokenGuard)
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
  @UseGuards(AccessTokenGuard, PermissionsGuard)
  @RequirePermissions(PermissionEnum.USER_READ)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lấy thông tin người dùng theo email',
    description: 'Tìm kiếm người dùng chính xác bằng địa chỉ email.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tìm thấy người dùng thành công',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy người dùng với email này',
  })
  async getUserByEmail(@Query() dto: GetUserByEmailDto) {
    const user = await this.getUserByEmailUseCase.execute(dto.email);
    return {
      message: 'Get user by email successfully',
      data: user,
    };
  }

  @Get('user/:id')
  @UseGuards(AccessTokenGuard, PermissionsGuard)
  @RequirePermissions(PermissionEnum.USER_READ)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lấy thông tin người dùng theo ID',
    description: 'Lấy thông tin chi tiết của người dùng bằng UUID.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID của người dùng',
    example: 'c4e4bf7e-07a8-48b2-b13c-0e2bbd8e0556',
  })
  @ApiResponse({
    status: 200,
    description: 'Tìm thấy người dùng thành công',
  })
  @ApiResponse({
    status: 400,
    description: 'ID không phải là UUID hợp lệ',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy người dùng',
  })
  async getUserById(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const user = await this.getUserByIdUseCase.execute(id);
    return {
      message: 'Get user by id successfully',
      data: user,
    };
  }

  @Get('users')
  @UseGuards(AccessTokenGuard, PermissionsGuard)
  @RequirePermissions(PermissionEnum.USER_READ)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lấy danh sách người dùng (Phân trang Cursor)',
    description:
      'Lấy danh sách người dùng theo cơ chế phân trang Cursor. \n- **Trang đầu tiên**: Không cần truyền `cursor`. \n- **Trang tiếp theo**: Lấy giá trị `nextCursor` từ response trước truyền vào query param `cursor`.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách thành công',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Lấy danh sách người dùng thành công',
        },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                example: 'c4e4bf7e-07a8-48b2-b13c-0e2bbd8e0556',
              },
              email: { type: 'string', example: 'user@example.com' },
              fullName: { type: 'string', example: 'Nguyen Van A' },
              phone: { type: 'string', example: '0987654321' },
              status: { type: 'string', example: 'ACTIVE' },
              emailVerified: { type: 'boolean', example: false },
              createdAt: {
                type: 'string',
                format: 'date-time',
                example: '2026-10-04T00:00:00.000Z',
              },
              updatedAt: {
                type: 'string',
                format: 'date-time',
                example: '2026-10-04T00:00:00.000Z',
              },
              deletedAt: { type: 'string', nullable: true, example: null },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            nextCursor: {
              type: 'string',
              nullable: true,
              example: 'c4e4bf7e-07a8-48b2-b13c-0e2bbd8e0556',
            },
            hasNextPage: { type: 'boolean', example: true },
            limit: { type: 'number', example: 10 },
          },
        },
      },
    },
  })
  async getAllUsers(@Query() dto: GetUsersCursorDto) {
    const result = await this.getUsersCursorUseCase.execute(dto);
    return {
      message: 'Lấy danh sách người dùng thành công',
      data: result.items,
      pagination: result.pagination,
    };
  }

  @Patch('users/:id/status')
  @UseGuards(AccessTokenGuard, PermissionsGuard)
  @RequirePermissions(PermissionEnum.USER_UPDATE)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cập nhật trạng thái người dùng (Admin)',
    description:
      'Thay đổi trạng thái của tài khoản người dùng (ACTIVE, INACTIVE, SUSPENDED, BANNED). Admin không thể tự khóa chính mình.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID của người dùng cần đổi trạng thái',
    example: 'c4e4bf7e-07a8-48b2-b13c-0e2bbd8e0556',
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật trạng thái thành công',
  })
  @ApiResponse({
    status: 400,
    description: 'Trạng thái không hợp lệ hoặc tự khóa chính mình',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy người dùng',
  })
  async updateUserStatus(
    @CurrentUser() user: types.PayloadToken,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    const data = await this.updateUserStatusUseCase.execute({
      currentUserId: user.sub,
      targetId: id,
      status: dto.status,
    });
    return {
      message: 'Cập nhật trạng thái người dùng thành công',
      data,
    };
  }

  @Delete('users/:id')
  @UseGuards(AccessTokenGuard, PermissionsGuard)
  @RequirePermissions(PermissionEnum.USER_DELETE)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Xóa người dùng (Soft Delete - Admin)',
    description:
      'Xóa mềm người dùng khỏi hệ thống bằng cách cập nhật deletedAt. Admin không thể tự xóa tài khoản của chính mình.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID của người dùng cần xóa',
    example: 'c4e4bf7e-07a8-48b2-b13c-0e2bbd8e0556',
  })
  @ApiResponse({
    status: 200,
    description: 'Xóa người dùng thành công',
  })
  @ApiResponse({
    status: 400,
    description: 'Không thể tự xóa chính mình hoặc tài khoản đã bị xóa',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy người dùng',
  })
  async deleteUser(
    @CurrentUser() user: types.PayloadToken,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const data = await this.deleteUserUseCase.execute({
      currentUserId: user.sub,
      targetId: id,
    });
    return {
      message: 'Xóa người dùng thành công',
      data,
    };
  }
}
