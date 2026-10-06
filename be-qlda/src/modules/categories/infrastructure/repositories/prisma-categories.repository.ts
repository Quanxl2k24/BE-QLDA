import { Injectable } from '@nestjs/common';
import { CategoriesRepository } from '../../domain/repositories/categories.repository';
import { CategoriesEntity } from '../../domain/entities/categories.entity';
import { PrismaService } from '@/database/prisma/prisma.services';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaCategoriesRepository implements CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createCategory(data: {
    name: string;
    slug: string;
    status: string;
    description?: string | null;
    parentId?: string | null;
  }): Promise<CategoriesEntity | null> {
    const category = await this.prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description ?? null,
        status: data.status ?? undefined,
        parentId: data.parentId ?? null,
      },
    });

    if (!category) return null;

    return new CategoriesEntity(
      category.id,
      category.name,
      category.slug,
      category.status,
      category.createdAt,
      category.updatedAt,

      category.description,
      category.parentId,
    );
  }

  async getCategories(params: {
    cursor?: string;
    limit: number;
    search?: string;
    status?: string;
    parentId?: string;
  }): Promise<{
    categories: CategoriesEntity[];
    nextCursor: string | null;
    hasNextPage: boolean;
  }> {
    const { cursor, limit, search, status, parentId } = params;

    const where: Prisma.CategoryWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (parentId !== undefined && parentId !== null) {
      where.parentId = parentId === 'null' ? null : parentId;
    }

    const records = await this.prisma.category.findMany({
      where,
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    const hasNextPage = records.length > limit;

    if (hasNextPage) {
      records.pop();
    }

    const nextCursor =
      hasNextPage && records.length > 0 ? records[records.length - 1].id : null;

    const data = records.map(
      (item) =>
        new CategoriesEntity(
          item.id,
          item.name,
          item.slug,
          item.status,
          item.createdAt,
          item.updatedAt,
          item.description,
          item.parentId,
        ),
    );

    return {
      categories: data,
      nextCursor,
      hasNextPage,
    };
  }

  async getCategoriesTree(): Promise<CategoriesEntity[]> {
    const records = await this.prisma.category.findMany({
      orderBy: [{ createdAt: 'asc' }],
    });

    const categoryMap = new Map<string, CategoriesEntity>();
    const rootCategories: CategoriesEntity[] = [];

    for (const item of records) {
      categoryMap.set(
        item.id,
        new CategoriesEntity(
          item.id,
          item.name,
          item.slug,
          item.status,
          item.createdAt,
          item.updatedAt,
          item.description,
          item.parentId,
          [],
        ),
      );
    }

    for (const item of records) {
      const node = categoryMap.get(item.id)!;
      if (item.parentId && categoryMap.has(item.parentId)) {
        categoryMap.get(item.parentId)!.children!.push(node);
      } else {
        rootCategories.push(node);
      }
    }

    return rootCategories;
  }

  async findById(id: string): Promise<CategoriesEntity | null> {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) return null;

    return new CategoriesEntity(
      category.id,
      category.name,
      category.slug,
      category.status,
      category.createdAt,
      category.updatedAt,
      category.description,
      category.parentId,
    );
  }

  async findBySlug(slug: string): Promise<CategoriesEntity | null> {
    const category = await this.prisma.category.findUnique({
      where: { slug },
    });

    if (!category) return null;

    return new CategoriesEntity(
      category.id,
      category.name,
      category.slug,
      category.status,
      category.createdAt,
      category.updatedAt,
      category.description,
      category.parentId,
    );
  }

  async updateCategory(
    id: string,
    data: {
      name: string;
      slug?: string;
      status: string;
      description?: string | null;
      parentId?: string | null;
    },
  ): Promise<CategoriesEntity> {
    const category = await this.prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        ...(data.slug ? { slug: data.slug } : {}),
        status: data.status,
        description: data.description ?? null,
        parentId: data.parentId ?? null,
      },
    });

    return new CategoriesEntity(
      category.id,
      category.name,
      category.slug,
      category.status,
      category.createdAt,
      category.updatedAt,
      category.description,
      category.parentId,
    );
  }

  async countSubCategories(id: string): Promise<number> {
    return await this.prisma.category.count({
      where: { parentId: id },
    });
  }

  async countProducts(id: string): Promise<number> {
    return await this.prisma.product.count({
      where: { categoryId: id },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.category.delete({
      where: { id },
    });
  }
}

// public readonly id: string,
// public readonly name: string,
// public readonly slug: string,
// public readonly description: string | null,
// public readonly status: string,
// public readonly createdAt: Date,
// public readonly updatedAt: Date,
// public readonly parentId?: string | null,
