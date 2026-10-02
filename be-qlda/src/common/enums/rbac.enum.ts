export enum PermissionEnum {
  // Product permissions
  PRODUCT_READ = 'PRODUCT:READ',
  PRODUCT_CREATE = 'PRODUCT:CREATE',
  PRODUCT_UPDATE = 'PRODUCT:UPDATE',
  PRODUCT_DELETE = 'PRODUCT:DELETE',

  // Order permissions
  ORDER_READ = 'ORDER:READ',
  ORDER_UPDATE = 'ORDER:UPDATE',
  ORDER_CANCEL = 'ORDER:CANCEL',

  // User permissions
  USER_READ = 'USER:READ',
  USER_UPDATE = 'USER:UPDATE',

  // Role permissions (CRUD)
  ROLE_READ = 'ROLE:READ',
  ROLE_CREATE = 'ROLE:CREATE',
  ROLE_UPDATE = 'ROLE:UPDATE',
  ROLE_DELETE = 'ROLE:DELETE',

  // Permission permissions
  PERMISSION_READ = 'PERMISSION:READ',
}

export enum RoleEnum {
  ADMIN = 'ADMIN',
  USER = 'USER',
}
