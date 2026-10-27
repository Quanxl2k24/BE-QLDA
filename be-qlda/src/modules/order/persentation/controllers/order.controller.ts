import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AccessTokenGuard } from '@/modules/auth/infrastructure/guards/access-token.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { PermissionEnum } from '@/common/enums';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import * as types from '@/common/types/types';

import { CreateOrderDto } from '../dto/createOrder.dto';
import {
  AdminGetOrdersQueryDto,
  GetMyOrdersQueryDto,
} from '../dto/get-orders.dto';
import {
  CancelOrderDto,
  UpdateOrderStatusDto,
} from '../dto/update-order-status.dto';

import { CreateOrderUseCase } from '../../application/use-case/create-order.use-case';
import { GetOrderDetailUseCase } from '../../application/use-case/get-order-detail.use-case';
import { GetMyOrdersUseCase } from '../../application/use-case/get-my-orders.use-case';
import { CancelOrderUseCase } from '../../application/use-case/cancel-order.use-case';
import { UpdateOrderStatusUseCase } from '../../application/use-case/update-order-status.use-case';
import { AdminGetOrdersUseCase } from '../../application/use-case/admin-get-orders.use-case';

@ApiTags('Orders')
@Controller({
  path: 'orders',
  version: '1',
})
export class OrderController {
  constructor(
    private readonly createOrderUseCase: CreateOrderUseCase,
    private readonly getOrderDetailUseCase: GetOrderDetailUseCase,
    private readonly getMyOrdersUseCase: GetMyOrdersUseCase,
    private readonly cancelOrderUseCase: CancelOrderUseCase,
    private readonly updateOrderStatusUseCase: UpdateOrderStatusUseCase,
    private readonly adminGetOrdersUseCase: AdminGetOrdersUseCase,
  ) {}

  @Post()
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Tạo đơn hàng mới (COD / Hỗ trợ mở rộng Online Payment)',
    description:
      'Tạo đơn hàng từ giỏ hàng hoặc mua ngay. Hệ thống tự động trừ kho nguyên tử (atomic decrement), chống race condition/deadlock, và chống double-click bằng Idempotency.',
  })
  @ApiResponse({ status: 201, description: 'Tạo đơn hàng thành công' })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu không hợp lệ hoặc sản phẩm không đủ tồn kho',
  })
  @ApiResponse({
    status: 409,
    description: 'Yêu cầu đặt hàng đang được xử lý (Conflict / Idempotency)',
  })
  async createOrder(
    @CurrentUser() user: types.PayloadToken,
    @Body() body: CreateOrderDto,
  ) {
    return await this.createOrderUseCase.execute(user.sub, body);
  }

  @Get('my-orders')
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lấy danh sách đơn hàng của người dùng hiện tại',
    description: 'Hỗ trợ phân trang và lọc theo trạng thái đơn hàng.',
  })
  @ApiResponse({ status: 200, description: 'Lấy danh sách đơn hàng thành công' })
  async getMyOrders(
    @CurrentUser() user: types.PayloadToken,
    @Query() query: GetMyOrdersQueryDto,
  ) {
    return await this.getMyOrdersUseCase.execute({
      userId: user.sub,
      status: query.status,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get('admin/list')
  @UseGuards(AccessTokenGuard, PermissionsGuard)
  @RequirePermissions(PermissionEnum.ORDER_READ)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Quản trị: Lấy danh sách toàn bộ đơn hàng',
    description:
      'Hỗ trợ tìm kiếm theo mã đơn, email, SĐT khách hàng, lọc theo trạng thái và khoảng thời gian.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách đơn hàng quản trị thành công',
  })
  async adminGetOrders(@Query() query: AdminGetOrdersQueryDto) {
    return await this.adminGetOrdersUseCase.execute({
      search: query.search,
      status: query.status,
      userId: query.userId,
      fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
      toDate: query.toDate ? new Date(query.toDate) : undefined,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get(':idOrCode')
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Xem chi tiết đơn hàng theo ID (UUID) hoặc Mã đơn hàng (orderCode)',
  })
  @ApiParam({
    name: 'idOrCode',
    description: 'UUID của đơn hàng hoặc mã đơn hàng dạng ORD-XXXXXX',
  })
  @ApiResponse({ status: 200, description: 'Lấy chi tiết đơn hàng thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập đơn hàng này' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy đơn hàng' })
  async getOrderDetail(
    @CurrentUser() user: types.PayloadToken,
    @Param('idOrCode') idOrCode: string,
  ) {
    return await this.getOrderDetailUseCase.execute(idOrCode, user.sub);
  }

  @Patch(':id/cancel')
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Khách hàng hủy đơn hàng',
    description:
      'Chỉ được hủy khi đơn ở trạng thái PENDING hoặc CONFIRMED. Tồn kho sẽ được tự động hoàn trả nguyên tử vào kho hàng.',
  })
  @ApiParam({ name: 'id', description: 'UUID của đơn hàng' })
  @ApiResponse({ status: 200, description: 'Hủy đơn hàng thành công' })
  @ApiResponse({ status: 400, description: 'Đơn hàng không ở trạng thái được phép hủy' })
  async cancelOrder(
    @CurrentUser() user: types.PayloadToken,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: CancelOrderDto,
  ) {
    return await this.cancelOrderUseCase.execute(id, user.sub, body.reason, false);
  }

  @Patch(':id/status')
  @UseGuards(AccessTokenGuard, PermissionsGuard)
  @RequirePermissions(PermissionEnum.ORDER_UPDATE)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Quản trị: Cập nhật trạng thái đơn hàng (State Machine)',
    description:
      'Chuyển đổi trạng thái đơn hàng tuân theo quy tắc State Machine. Nếu chuyển sang DELIVERED đối với đơn COD, hệ thống tự động cập nhật thanh toán thành PAID.',
  })
  @ApiParam({ name: 'id', description: 'UUID của đơn hàng' })
  @ApiResponse({ status: 200, description: 'Cập nhật trạng thái thành công' })
  @ApiResponse({
    status: 400,
    description: 'Chuyển đổi trạng thái không hợp lệ theo quy tắc State Machine',
  })
  async updateOrderStatus(
    @CurrentUser() user: types.PayloadToken,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: UpdateOrderStatusDto,
  ) {
    return await this.updateOrderStatusUseCase.execute(
      id,
      body.status,
      user.sub,
      body.note,
    );
  }

  @Patch('admin/:id/cancel')
  @UseGuards(AccessTokenGuard, PermissionsGuard)
  @RequirePermissions(PermissionEnum.ORDER_CANCEL)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Quản trị: Hủy đơn hàng với quyền Admin',
    description:
      'Admin có quyền hủy đơn hàng ở các trạng thái hợp lệ kèm theo lý do, kho hàng sẽ được tự động hoàn trả.',
  })
  @ApiParam({ name: 'id', description: 'UUID của đơn hàng' })
  @ApiResponse({ status: 200, description: 'Hủy đơn hàng thành công' })
  async adminCancelOrder(
    @CurrentUser() user: types.PayloadToken,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: CancelOrderDto,
  ) {
    return await this.cancelOrderUseCase.execute(
      id,
      user.sub,
      body.reason ?? 'Quản trị viên hủy đơn hàng',
      true,
    );
  }
}
