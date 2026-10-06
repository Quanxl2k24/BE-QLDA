import { CategoriesEntity } from '../entities/categories.entity';

export abstract class CategoriesRepository {
  abstract createCategory(data: {
    name: string;
    slug: string;
    status: string;
    description?: string | null;
    parentId?: string | null;
  }): Promise<CategoriesEntity | null>;

  abstract getCategories(data: { cursor?: string; limit: number }): Promise<{
    categories: CategoriesEntity[];
    nextCursor: string | null;
    hasNextPage: boolean;
  }>;
}
