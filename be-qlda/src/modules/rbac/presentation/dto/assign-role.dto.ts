import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
} from 'class-validator';

export class AssignRoleDto {
  @IsOptional()
  @IsArray({ message: 'roleIds phải là một mảng' })
  @ArrayMinSize(1, { message: 'Danh sách roleIds phải có ít nhất 1 phần tử' })
  @IsString({ each: true, message: 'Mỗi roleId phải là chuỗi UUID' })
  roleIds?: string[];

  @IsOptional()
  @IsString({ message: 'roleId phải là chuỗi UUID' })
  roleId?: string;

  @IsOptional()
  @IsBoolean()
  replace?: boolean;
}
