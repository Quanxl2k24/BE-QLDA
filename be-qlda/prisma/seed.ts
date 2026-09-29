import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { hash } from 'argon2';

const prisma = new PrismaClient();

const PERMISSIONS = [
  // Product permissions
  {
    name: 'PRODUCT:READ',
    description: 'Xem danh sách và thông tin chi tiết sản phẩm',
  },
  {
    name: 'PRODUCT:CREATE',
    description: 'Tạo sản phẩm mới',
  },
  {
    name: 'PRODUCT:UPDATE',
    description: 'Chỉnh sửa thông tin sản phẩm',
  },
  {
    name: 'PRODUCT:DELETE',
    description: 'Xóa sản phẩm',
  },

  // Order permissions
  {
    name: 'ORDER:READ',
    description: 'Xem danh sách và chi tiết đơn hàng',
  },
  {
    name: 'ORDER:UPDATE',
    description: 'Cập nhật trạng thái và thông tin đơn hàng',
  },
  {
    name: 'ORDER:CANCEL',
    description: 'Hủy đơn hàng',
  },

  // User permissions
  {
    name: 'USER:READ',
    description: 'Xem danh sách và thông tin người dùng',
  },
  {
    name: 'USER:UPDATE',
    description: 'Cập nhật thông tin người dùng',
  },
];

async function main() {
  console.log('🌱 Bắt đầu quá trình seed cơ sở dữ liệu...\n');

  // Kiểm tra biến môi trường nhạy cảm
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminFullName = process.env.ADMIN_FULL_NAME?.trim() || 'Administrator';
  const adminPhone = process.env.ADMIN_PHONE?.trim() || null;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      '❌ Thiếu biến môi trường bắt buộc: Vui lòng cấu hình ADMIN_EMAIL và ADMIN_PASSWORD trong file .env trước khi chạy seed!'
    );
  }

  // 1. Seed Permissions
  console.log('📌 Đang khởi tạo các Permission...');
  const permissionsMap = new Map<string, string>();

  for (const perm of PERMISSIONS) {
    const permission = await prisma.permission.upsert({
      where: { name: perm.name },
      update: { description: perm.description },
      create: {
        name: perm.name,
        description: perm.description,
      },
    });
    permissionsMap.set(permission.name, permission.id);
    console.log(`  - Permission: ${permission.name}`);
  }

  // 2. Seed Role (Role cao nhất: ADMIN)
  console.log('\n👑 Đang khởi tạo Role cao nhất (ADMIN)...');
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {
      description: 'Role quản trị viên cao nhất hệ thống với toàn bộ quyền',
    },
    create: {
      name: 'ADMIN',
      description: 'Role quản trị viên cao nhất hệ thống với toàn bộ quyền',
    },
  });
  console.log(`  - Role: ${adminRole.name} (id: ${adminRole.id})`);

  // 3. Gán tất cả permissions cho Role ADMIN
  console.log('\n🔗 Đang gán toàn bộ permissions cho Role ADMIN...');
  for (const [permName, permId] of permissionsMap.entries()) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: permId,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: permId,
      },
    });
    console.log(`  - Gán quyền [${permName}] -> [${adminRole.name}]`);
  }

  // 4. Seed tài khoản Admin (sử dụng thông tin từ file .env)
  console.log('\n👤 Đang khởi tạo tài khoản Admin từ biến môi trường...');
  const passwordHash = await hash(adminPassword);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: passwordHash,
      fullName: adminFullName,
      phone: adminPhone,
      status: 'ACTIVE',
      emailVerified: true,
    },
    create: {
      email: adminEmail,
      passwordHash: passwordHash,
      fullName: adminFullName,
      phone: adminPhone,
      status: 'ACTIVE',
      emailVerified: true,
    },
  });
  console.log(`  - Admin User: ${adminUser.email} (id: ${adminUser.id})`);

  // 5. Gán Role ADMIN cho tài khoản Admin
  console.log('\n🛡️  Đang gán Role ADMIN cho tài khoản Admin...');
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    },
    update: {},
    create: {
      userId: adminUser.id,
      roleId: adminRole.id,
    },
  });
  console.log(`  - Đã gán Role [${adminRole.name}] cho User [${adminUser.email}]`);

  console.log('\n✅ Seed dữ liệu thành công!');
  console.log('--------------------------------------------------');
  console.log(`📧 Admin Email   : ${adminEmail}`);
  console.log(`🔑 Admin Password: ${'*'.repeat(adminPassword.length)} (đã mã hóa qua Argon2)`);
  console.log(`🛡️  Role           : ${adminRole.name}`);
  console.log(`📋 Permissions    : ${permissionsMap.size} quyền`);
  console.log('--------------------------------------------------\n');
}

main()
  .catch((e) => {
    console.error(e.message || e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
