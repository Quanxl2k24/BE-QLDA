import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
import { CategoriesDto } from '../dto/get-categories.dto';

@Controller({
  path: 'categories',
  version: '1',
})
export class CategoriesController {
  constructor(
    private readonly createCategoriesUseCase: CreateCategoriesUseCase,
    private readonly getCategoriesUseCase: GetCategoriesUseCase,
  ) {}

  @UseGuards(AccessTokenGuard, PermissionsGuard)
  @RequirePermissions(PermissionEnum.PRODUCT_CREATE)
  @HttpCode(HttpStatus.CREATED)
  @Post()
  async createCategories(@Body() body: CreateCategoriesDto) {
    return await this.createCategoriesUseCase.execute(body);
  }

  @Get()
  async getCategories(@Query() dto: CategoriesDto) {
    return await this.getCategoriesUseCase.execute(dto);
  }
}
