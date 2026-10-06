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
import { CreateCategoriesUseCase } from '../../application/use-cases/CreateCategories.use-case';
import { CreateCategoriesDto } from '../dto/create-categories.dto';
import { AccessTokenGuard } from '@/modules/auth/infrastructure/guards/access-token.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { PermissionEnum } from '@/common/enums';
import { GetCategoriesUseCase } from '../../application/use-cases/GetCategories.use-case';
import { GetCategoriesTreeUseCase } from '../../application/use-cases/GetCategoriesTree.use-case';
import { CategoriesDto } from '../dto/get-categories.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { UpdateCategoryUseCase } from '../../application/use-cases/UpdateCategory.use-case';

@Controller({
  path: '',
  version: '1',
})
export class CategoriesController {
  constructor(
    private readonly createCategoriesUseCase: CreateCategoriesUseCase,
    private readonly getCategoriesUseCase: GetCategoriesUseCase,
    private readonly getCategoriesTreeUseCase: GetCategoriesTreeUseCase,
    private readonly updateCategoryUseCase: UpdateCategoryUseCase,
  ) {}

  //auth
  @Post('category')
  @UseGuards(AccessTokenGuard, PermissionsGuard)
  @RequirePermissions(PermissionEnum.PRODUCT_CREATE)
  @HttpCode(HttpStatus.CREATED)
  async createCategories(@Body() body: CreateCategoriesDto) {
    return await this.createCategoriesUseCase.execute(body);
  }

  @Patch('category/:id')
  @UseGuards(AccessTokenGuard, PermissionsGuard)
  @RequirePermissions(PermissionEnum.PRODUCT_UPDATE)
  @HttpCode(HttpStatus.OK)
  async updateCategory(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: UpdateCategoryDto,
  ) {
    return await this.updateCategoryUseCase.execute(id, body);
  }

  //public
  @Get('categories/tree')
  @HttpCode(HttpStatus.OK)
  async getCategoriesTree() {
    return await this.getCategoriesTreeUseCase.execute();
  }

  @Get('categories')
  @HttpCode(HttpStatus.OK)
  async getCategories(@Query() dto: CategoriesDto) {
    return await this.getCategoriesUseCase.execute(dto);
  }
}
