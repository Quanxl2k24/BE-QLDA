import { CategoriesEntity } from '../entities/categories.entity';

export abstract class CategoriesRepository {
  abstract createCategory(data: {
    name: string;
    slug: string;
    status: string;
    description?: string | null;
    parentId?: string | null;
  }): Promise<CategoriesEntity | null>;

  abstract getCategories(data: {
    cursor?: string;
    limit: number;
    search?: string;
    status?: string;
    parentId?: string;
  }): Promise<{
    categories: CategoriesEntity[];
    nextCursor: string | null;
    hasNextPage: boolean;
  }>;

  abstract getCategoriesTree(): Promise<CategoriesEntity[]>;

  abstract findById(id: string): Promise<CategoriesEntity | null>;

  abstract findBySlug(slug: string): Promise<CategoriesEntity | null>;

  abstract updateCategory(
    id: string,
    data: {
      name: string;
      slug?: string;
      status: string;
      description?: string | null;
      parentId?: string | null;
    },
  ): Promise<CategoriesEntity>;

  abstract countSubCategories(id: string): Promise<number>;

  abstract countProducts(id: string): Promise<number>;

  abstract delete(id: string): Promise<void>;
}
