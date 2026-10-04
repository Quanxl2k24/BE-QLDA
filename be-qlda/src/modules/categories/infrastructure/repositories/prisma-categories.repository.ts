import { Injectable } from '@nestjs/common';
import { CategoriesRepository } from '../../domain/repositories/categories.repository';
import { CategoriesEntity } from '../../domain/entities/categories.entity';
import { PrismaService } from '@/database/prisma/prisma.services';
import { Category } from '@prisma/client';

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
}

// public readonly id: string,
// public readonly name: string,
// public readonly slug: string,
// public readonly description: string | null,
// public readonly status: string,
// public readonly createdAt: Date,
// public readonly updatedAt: Date,
// public readonly parentId?: string | null,
