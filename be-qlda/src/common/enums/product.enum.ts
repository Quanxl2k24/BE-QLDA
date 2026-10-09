export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DRAFT = 'DRAFT',
  ARCHIVED = 'ARCHIVED',
}

export function toProductStatus(value: string): ProductStatus {
  if (Object.values(ProductStatus).includes(value as ProductStatus)) {
    return value as ProductStatus;
  }

  throw new Error(`Invalid product status in database: ${value}`);
}
