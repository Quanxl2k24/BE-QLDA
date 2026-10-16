import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { AddToCartUseCase } from '../../application/use-case/AddToCart.use-case';
import { AddToCartDto } from '../dto/addToCart.dto';
import { GetCartCursorDto } from '../dto/get-cart.dto';
import { UpdateCartItemDto } from '../dto/update-cart-item.dto';
import { CartTotalsQueryDto } from '../dto/totalCart.dto';
import { AccessTokenGuard } from '@/modules/auth/infrastructure/guards/access-token.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import * as types from '@/common/types/types';
import { GetCartItem } from '../../application/use-case/GetCartItem.use-case';
import { UpdateCartItemUseCase } from '../../application/use-case/UpdateCartItem.use-case';
import { ClearCartUseCase } from '../../application/use-case/ClearCart.use-case';
import { TotalCartUseCase } from '../../application/use-case/TotalsCart.use-case';

@ApiTags('Cart')
@Controller({
  path: 'cart',
  version: '1',
})
export class CartController {
  constructor(
    private readonly addToCartUseCase: AddToCartUseCase,
    private readonly getCartItem: GetCartItem,
    private readonly updateCartItemUseCase: UpdateCartItemUseCase,
    private readonly clearCartUseCase: ClearCartUseCase,
    private readonly totalCartUseCase: TotalCartUseCase,
  ) {}

  @Post()
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Thêm sản phẩm vào giỏ hàng',
    description:
      'Thêm biến thể sản phẩm vào giỏ hàng của người dùng đang đăng nhập. Nếu sản phẩm đã có trong giỏ thì số lượng sẽ được cộng dồn sau khi kiểm tra số lượng tồn kho.',
  })
  @ApiResponse({
    status: 200,
    description: 'Thêm sản phẩm vào giỏ hàng thành công',
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu không hợp lệ hoặc số lượng vượt quá tồn kho',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa đăng nhập (Unauthorized)',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy biến thể sản phẩm',
  })
  async addToCart(
    @CurrentUser() user: types.PayloadToken,
    @Body() dto: AddToCartDto,
  ) {
    const data = await this.addToCartUseCase.execute(user.sub, dto);
    return {
      message: 'Thêm sản phẩm vào giỏ hàng thành công',
      data,
    };
  }

  @Get()
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Lấy danh sách sản phẩm trong giỏ hàng (phân trang cursor)',
    description:
      'Lấy danh sách các sản phẩm/biến thể trong giỏ hàng của người dùng hiện tại từ token (lấy userId), hỗ trợ phân trang theo cursor và tính tiền cho từng sản phẩm.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách sản phẩm trong giỏ hàng thành công',
  })
  @ApiResponse({
    status: 400,
    description: 'Cursor hoặc tham số phân trang không hợp lệ',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa đăng nhập (Unauthorized)',
  })
  async getItem(
    @CurrentUser() user: types.PayloadToken,
    @Query() query: GetCartCursorDto,
  ) {
    const result = await this.getCartItem.execute(user.sub, query);
    return {
      message: 'Lấy danh sách sản phẩm trong giỏ hàng thành công',
      cartId: result.cartId,
      data: result.items,
      summary: {
        totalItems: result.totalItems,
        totalQuantity: result.totalQuantity,
        totalPrice: result.totalPrice,
      },
      pagination: {
        nextCursor: result.nextCursor,
        hasNextPage: result.hasNextPage,
        limit: query.limit ?? 10,
      },
      nextCursor: result.nextCursor,
      hasNextPage: result.hasNextPage,
      limit: query.limit ?? 10,
    };
  }

  @Patch([':id', 'items/:id', 'item/:id'])
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cập nhật số lượng sản phẩm trong giỏ hàng (theo id param)',
    description:
      'Cập nhật số lượng của một sản phẩm trong giỏ hàng qua cartItemId hoặc variantId trên đường dẫn. Nếu số lượng bằng 0 sẽ tự động xóa sản phẩm khỏi giỏ.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của CartItem hoặc variantId cần cập nhật (UUID v4)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật số lượng sản phẩm trong giỏ hàng thành công',
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu không hợp lệ hoặc số lượng vượt quá tồn kho',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa đăng nhập (Unauthorized)',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy giỏ hàng hoặc sản phẩm trong giỏ hàng',
  })
  async updateItemQuantity(
    @CurrentUser() user: types.PayloadToken,
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    const data = await this.updateCartItemUseCase.execute(user.sub, {
      ...dto,
      itemId: id,
    });
    return {
      message:
        dto.quantity === 0
          ? 'Đã xóa sản phẩm khỏi giỏ hàng do số lượng bằng 0'
          : 'Cập nhật số lượng sản phẩm trong giỏ hàng thành công',
      data,
    };
  }

  @Patch()
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cập nhật số lượng sản phẩm trong giỏ hàng (theo body)',
    description:
      'Cập nhật số lượng của một sản phẩm trong giỏ hàng qua body (cartItemId hoặc variantId và quantity). Nếu số lượng bằng 0 sẽ tự động xóa sản phẩm khỏi giỏ.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật số lượng sản phẩm trong giỏ hàng thành công',
  })
  @ApiResponse({
    status: 400,
    description: 'Dữ liệu không hợp lệ hoặc số lượng vượt quá tồn kho',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa đăng nhập (Unauthorized)',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy giỏ hàng hoặc sản phẩm trong giỏ hàng',
  })
  async updateQuantity(
    @CurrentUser() user: types.PayloadToken,
    @Body() dto: UpdateCartItemDto,
  ) {
    const data = await this.updateCartItemUseCase.execute(user.sub, dto);
    return {
      message:
        dto.quantity === 0
          ? 'Đã xóa sản phẩm khỏi giỏ hàng do số lượng bằng 0'
          : 'Cập nhật số lượng sản phẩm trong giỏ hàng thành công',
      data,
    };
  }

  @Delete(['clear'])
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Xóa toàn bộ sản phẩm trong giỏ hàng (AC-05)',
    description:
      'Xóa tất cả các dòng hàng trong giỏ hàng của người dùng hiện tại, giữ lại bản ghi Cart, không tác động đến đơn hàng và tồn kho. Trả về số dòng hàng đã xóa.',
  })
  @ApiResponse({
    status: 200,
    description: 'Xóa toàn bộ giỏ hàng thành công',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa đăng nhập (Unauthorized)',
  })
  async clearCart(@CurrentUser() user: types.PayloadToken) {
    const result = await this.clearCartUseCase.execute(user.sub);
    return {
      message: 'Xóa toàn bộ sản phẩm trong giỏ hàng thành công',
      deletedCount: result.deletedCount,
      data: result,
    };
  }

  @Get('totals')
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Tính tổng giá trị các sản phẩm trong giỏ hàng',
    description:
      'Tính thành tiền từng sản phẩm dựa trên giá hiện tại trong DB nhân số lượng, tổng tiền các mặt hàng hợp lệ được chọn, chống sai số số thực và phát hiện sản phẩm đổi trạng thái/hết hàng.',
  })
  @ApiResponse({
    status: 200,
    description: 'Tính toán giá trị giỏ hàng thành công',
  })
  @ApiResponse({
    status: 401,
    description: 'Chưa đăng nhập (Unauthorized)',
  })
  async totalsCart(
    @CurrentUser() user: types.PayloadToken,
    @Query() query: CartTotalsQueryDto,
  ) {
    const data = await this.totalCartUseCase.execute(user.sub, query);
    return {
      message: 'Tính toán giá trị giỏ hàng thành công',
      data,
    };
  }
}
