import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@/database/prisma/prisma.services';
import { PERMISSIONS_KEY } from '@/common/decorators/permissions.decorator';
import { RoleEnum } from '@/common/enums/rbac.enum';

@Injectable()
export class  PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Không yêu cầu permission -> cho qua
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // được gắn bởi AccessTokenGuard ({ sub: userId, email: ... })

    if (!user || !user.sub) {
      throw new ForbiddenException(
        'Không tìm thấy thông tin xác thực của người dùng',
      );
    }

    // Lấy thông tin vai trò và quyền hạn của người dùng từ database
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId: user.sub },
      include: {
        role: {
          include: {
            rolePermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!userRoles || userRoles.length === 0) {
      throw new ForbiddenException('Tài khoản chưa được gán bất kỳ vai trò nào');
    }

    // Super Admin có toàn bộ quyền
    const isAdmin = userRoles.some((ur) => ur.role?.name === RoleEnum.ADMIN);
    if (isAdmin) {
      return true;
    }

    // Tổng hợp tất cả các permission name của user
    const userPermissions = new Set<string>();
    for (const ur of userRoles) {
      for (const rp of ur.role.rolePermissions) {
        if (rp.permission?.name) {
          userPermissions.add(rp.permission.name);
        }
      }
    }

    // Kiểm tra xem user có đủ tất cả permissions được yêu cầu không
    const hasPermission = requiredPermissions.every((perm) =>
      userPermissions.has(perm),
    );

    if (!hasPermission) {
      throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này');
    }

    return true;
  }
}
