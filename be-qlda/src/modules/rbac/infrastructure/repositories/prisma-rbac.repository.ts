import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PermissonEntity } from '../../domain/entities/permission.entity';
import { RoleEntity } from '../../domain/entities/role.entity';
import { RbacRepository } from '../../domain/repositories/rbac.repository';
import { PrismaService } from '@/database/prisma/prisma.services';
import { RoleEnum } from '@/common/enums/rbac.enum';

@Injectable()
export class PrismaRbacRepository implements RbacRepository {
  constructor(private prisma: PrismaService) {}

  async createRole(data: {
    name: string;
    permissonId: string[];
    description?: string;
  }): Promise<RoleEntity> {
    return await this.prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: {
          name: data.name,
          description: data.description,
        },
      });

      if (data.permissonId && data.permissonId.length > 0) {
        await tx.rolePermission.createMany({
          data: data.permissonId.map((permId) => ({
            roleId: role.id,
            permissionId: permId,
          })),
        });
      }

      return new RoleEntity(
        role.id,
        role.name,
        role.description ?? '',
        role.createdAt,
        role.updatedAt,
      );
    });
  }

  async getPermisson(): Promise<PermissonEntity[] | null> {
    const data = await this.prisma.permission.findMany();
    if (!data) return null;

    return data.map(
      (item) =>
        new PermissonEntity(
          item.id,
          item.name,
          item.description,
          item.createdAt,
          item.updatedAt,
        ),
    );
  }

  async getRoles(): Promise<RoleEntity[]> {
    const roles = await this.prisma.role.findMany({
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return roles.map((role) => {
      const permissions = role.rolePermissions.map(
        (rp) =>
          new PermissonEntity(
            rp.permission.id,
            rp.permission.name,
            rp.permission.description,
            rp.permission.createdAt,
            rp.permission.updatedAt,
          ),
      );

      return new RoleEntity(
        role.id,
        role.name,
        role.description,
        role.createdAt,
        role.updatedAt,
        permissions,
      );
    });
  }

  async getRolesByUserId(userId: string): Promise<RoleEntity[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    return userRoles.map((ur) => {
      const permissions = ur.role.rolePermissions.map(
        (rp) =>
          new PermissonEntity(
            rp.permission.id,
            rp.permission.name,
            rp.permission.description,
            rp.permission.createdAt,
            rp.permission.updatedAt,
          ),
      );

      return new RoleEntity(
        ur.role.id,
        ur.role.name,
        ur.role.description,
        ur.role.createdAt,
        ur.role.updatedAt,
        permissions,
      );
    });
  }

  async updateRole(
    id: string,
    data: {
      name?: string;
      permissonId?: string[];
      description?: string;
    },
  ): Promise<RoleEntity> {
    const existingRole = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!existingRole) {
      throw new NotFoundException('Role not found');
    }

    if (
      existingRole.name === RoleEnum.ADMIN &&
      data.name &&
      data.name !== RoleEnum.ADMIN
    ) {
      throw new BadRequestException(
        'Không thể đổi tên vai trò quản trị viên hệ thống (ADMIN)',
      );
    }

    if (data.name && data.name !== existingRole.name) {
      const duplicate = await this.prisma.role.findUnique({
        where: { name: data.name },
      });
      if (duplicate) {
        throw new ConflictException('Tên vai trò đã tồn tại');
      }
    }

    return await this.prisma.$transaction(async (tx) => {
      await tx.role.update({
        where: { id },
        data: {
          ...(data.name ? { name: data.name } : {}),
          ...(data.description !== undefined
            ? { description: data.description }
            : {}),
        },
      });

      if (data.permissonId !== undefined) {
        await tx.rolePermission.deleteMany({
          where: { roleId: id },
        });

        if (data.permissonId.length > 0) {
          await tx.rolePermission.createMany({
            data: data.permissonId.map((permId) => ({
              roleId: id,
              permissionId: permId,
            })),
          });
        }
      }

      const updatedRole = await tx.role.findUnique({
        where: { id },
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      const permissions = updatedRole!.rolePermissions.map(
        (rp) =>
          new PermissonEntity(
            rp.permission.id,
            rp.permission.name,
            rp.permission.description,
            rp.permission.createdAt,
            rp.permission.updatedAt,
          ),
      );

      return new RoleEntity(
        updatedRole!.id,
        updatedRole!.name,
        updatedRole!.description,
        updatedRole!.createdAt,
        updatedRole!.updatedAt,
        permissions,
      );
    });
  }

  async deleteRole(id: string): Promise<boolean> {
    const existingRole = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!existingRole) {
      throw new NotFoundException('Role not found');
    }

    if (existingRole.name === RoleEnum.ADMIN) {
      throw new BadRequestException(
        'Không thể xóa vai trò quản trị viên hệ thống (ADMIN)',
      );
    }

    const userRoleCount = await this.prisma.userRole.count({
      where: { roleId: id },
    });

    if (userRoleCount > 0) {
      throw new BadRequestException(
        'Không thể xóa vai trò đang được gán cho người dùng',
      );
    }

    await this.prisma.role.delete({
      where: { id },
    });

    return true;
  }

  async assignRoleToUser(
    userId: string,
    roleIds: string[],
    replace = false,
  ): Promise<RoleEntity[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const uniqueRoleIds = Array.from(new Set(roleIds));
    const roles = await this.prisma.role.findMany({
      where: { id: { in: uniqueRoleIds } },
    });

    if (roles.length !== uniqueRoleIds.length) {
      const foundIds = new Set(roles.map((r) => r.id));
      const missingIds = uniqueRoleIds.filter((id) => !foundIds.has(id));
      throw new NotFoundException(
        `Một hoặc nhiều vai trò không tồn tại: ${missingIds.join(', ')}`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      if (replace) {
        await tx.userRole.deleteMany({
          where: { userId },
        });

        await tx.userRole.createMany({
          data: uniqueRoleIds.map((roleId) => ({
            userId,
            roleId,
          })),
        });
      } else {
        const existingUserRoles = await tx.userRole.findMany({
          where: { userId },
          select: { roleId: true },
        });

        const existingRoleIds = new Set(
          existingUserRoles.map((ur) => ur.roleId),
        );
        const rolesToAdd = uniqueRoleIds.filter(
          (roleId) => !existingRoleIds.has(roleId),
        );

        if (rolesToAdd.length > 0) {
          await tx.userRole.createMany({
            data: rolesToAdd.map((roleId) => ({
              userId,
              roleId,
            })),
          });
        }
      }
    });

    return await this.getRolesByUserId(userId);
  }
}
