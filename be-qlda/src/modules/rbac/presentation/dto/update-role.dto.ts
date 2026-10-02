import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true, message: 'Mỗi permissionId phải là chuỗi UUID' })
  permissonId?: string[];
}
