import {
  Body,
  Controller,
  Delete,
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
import {
  CreateProductDto,
  GetProductsCursorDto,
  UpdateProductDto,
} from '../dto/prodcuts.dto';
import { CreateProductUseCase } from '../../application/use-case/CreateProduct.use-case';
import { AccessTokenGuard } from '@/modules/auth/infrastructure/guards/access-token.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { PermissionEnum } from '@/common/enums';
import { GetProductsUseCase } from '../../application/use-case/GetProducts.use-case';
import { UpdateProductUseCase } from '../../application/use-case/UpdateProduct.use-case';
import { DeleteProductUseCase } from '../../application/use-case/DeleteProduct.use-case';
import { GetProductDetailUseCase } from '../../application/use-case/GetProductDetail.use-case';

@ApiTags('Products')
@Controller({
  path: 'products',
  version: '1',
})
export class ProductsController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly getProductUseCase: GetProductsUseCase,
    private readonly getProductDetailUseCase: GetProductDetailUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase,
  ) {}

  @Post()
  @UseGuards(AccessTokenGuard, PermissionsGuard)
  @RequirePermissions(PermissionEnum.PRODUCT_CREATE)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo mới sản phẩm kèm theo các biến thể' })
  @ApiResponse({ status: 201, description: 'Tạo sản phẩm thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực (Unauthorized)' })
  @ApiResponse({ status: 403, description: 'Không có quyền thực hiện (Forbidden)' })
  @ApiResponse({ status: 409, description: 'Slug hoặc SKU đã tồn tại' })
  async createProduct(@Body() body: CreateProductDto) {
    const data = await this.createProductUseCase.execute(body);
    return {
      message: 'Tạo sản phẩm thành công',
      data,
    };
  }

  @Patch(':id')
  @UseGuards(AccessTokenGuard, PermissionsGuard)
  @RequirePermissions(PermissionEnum.PRODUCT_UPDATE)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật thông tin sản phẩm và các biến thể' })
  @ApiParam({
    name: 'id',
    description: 'ID sản phẩm cần cập nhật (UUID v4)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({ status: 200, description: 'Cập nhật sản phẩm thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực (Unauthorized)' })
  @ApiResponse({ status: 403, description: 'Không có quyền thực hiện (Forbidden)' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm hoặc danh mục' })
  @ApiResponse({ status: 409, description: 'Slug hoặc SKU đã tồn tại' })
  async updateProduct(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: UpdateProductDto,
  ) {
    const data = await this.updateProductUseCase.execute(id, body);
    return {
      message: 'Cập nhật sản phẩm thành công',
      data,
    };
  }

  @Delete(':id')
  @UseGuards(AccessTokenGuard, PermissionsGuard)
  @RequirePermissions(PermissionEnum.PRODUCT_DELETE)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa sản phẩm (Soft delete)' })
  @ApiParam({
    name: 'id',
    description: 'ID sản phẩm cần xóa (UUID v4)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({ status: 200, description: 'Xóa sản phẩm thành công' })
  @ApiResponse({ status: 400, description: 'ID sản phẩm không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực (Unauthorized)' })
  @ApiResponse({ status: 403, description: 'Không có quyền thực hiện (Forbidden)' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
  async deleteProduct(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    const data = await this.deleteProductUseCase.execute(id);
    return {
      message: 'Xóa sản phẩm thành công',
      data,
    };
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lấy danh sách sản phẩm phân trang cursor (hỗ trợ lọc theo categorySlug)',
  })
  @ApiResponse({ status: 200, description: 'Lấy danh sách sản phẩm thành công' })
  async getProducts(@Query() query: GetProductsCursorDto) {
    return await this.getProductUseCase.execute(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy thông tin chi tiết sản phẩm theo ID hoặc Slug' })
  @ApiParam({
    name: 'id',
    description: 'ID (UUID v4) hoặc Slug của sản phẩm',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({ status: 200, description: 'Lấy chi tiết sản phẩm thành công' })
  @ApiResponse({ status: 400, description: 'ID hoặc slug không hợp lệ' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sản phẩm' })
  async getProductDetail(@Param('id') id: string) {
    const data = await this.getProductDetailUseCase.execute(id);
    return {
      message: 'Lấy chi tiết sản phẩm thành công',
      data,
    };
  }
}
