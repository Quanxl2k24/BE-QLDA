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
}

export enum RoleEnum {
  ADMIN = 'ADMIN',
}
