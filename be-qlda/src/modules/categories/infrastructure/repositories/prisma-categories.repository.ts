import { Injectable } from '@nestjs/common';
import { CategoriesRepository } from '../../domain/repositories/categories.repository';
import { CategoriesEntity } from '../../domain/entities/categories.entity';
import { PrismaService } from '@/database/prisma/prisma.services';

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

  async getCategories(params: { cursor?: string; limit: number }): Promise<{
    categories: CategoriesEntity[];
    nextCursor: string | null;
    hasNextPage: boolean;
  }> {
    const { cursor, limit } = params;
    const records = await this.prisma.category.findMany({
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
}

// public readonly id: string,
// public readonly name: string,
// public readonly slug: string,
// public readonly description: string | null,
// public readonly status: string,
// public readonly createdAt: Date,
// public readonly updatedAt: Date,
// public readonly parentId?: string | null,
