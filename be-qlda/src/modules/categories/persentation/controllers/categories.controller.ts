import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CreateCategoriesUseCase } from '../../application/use-cases/CreateCategories.use-case';
import { CreateCategoriesDto } from '../dto/create-categories.dto';
import { AccessTokenGuard } from '@/modules/auth/infrastructure/guards/access-token.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { PermissionEnum } from '@/common/enums';

@Controller({
  path: 'categories',
  version: '1',
})
export class CategoriesController {
  constructor(
    private readonly createCategoriesUseCase: CreateCategoriesUseCase,
  ) {}

  @UseGuards(AccessTokenGuard, PermissionsGuard)
  @RequirePermissions(PermissionEnum.PRODUCT_CREATE)
  @HttpCode(HttpStatus.CREATED)
  @Post()
  async createCategories(@Body() body: CreateCategoriesDto) {
    return await this.createCategoriesUseCase.execute(body);
  }
}
