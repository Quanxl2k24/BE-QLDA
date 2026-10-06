export class CategoriesEntity {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slug: string,
    public readonly status: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,

    public readonly description?: string | null,
    public readonly parentId?: string | null,
    public children?: CategoriesEntity[],
  ) {}
}

//   id          String
//   name        String
//   slug        String
//   description String?
//   parentId    String?
//   status      String

//   createdAt   DateTime
//   updatedAt   DateTime
