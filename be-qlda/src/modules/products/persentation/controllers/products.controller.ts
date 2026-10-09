import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateProductDto } from '../dto/prodcuts.dto';
import { CreateProductUseCase } from '../../application/use-case/CreateProduct.use-case';

@ApiTags('Products')
@Controller({
  path: 'products',
  version: '1',
})
export class ProductsController {
  constructor(private readonly createProductUseCase: CreateProductUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tạo mới sản phẩm kèm theo các biến thể' })
  @ApiResponse({ status: 201, description: 'Tạo sản phẩm thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ' })
  @ApiResponse({ status: 409, description: 'Slug hoặc SKU đã tồn tại' })
  async createProduct(@Body() body: CreateProductDto) {
    const data = await this.createProductUseCase.execute(body);
    return {
      message: 'Tạo sản phẩm thành công',
      data,
    };
  }
}
