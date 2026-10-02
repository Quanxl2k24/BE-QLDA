import { ArrayMinSize, IsNotEmpty, IsString } from 'class-validator';

export class RbacDTO {
  @IsNotEmpty({ each: true, message: 'Phần tử không được để trống' })
  @IsString()
  name: string;

  @IsString()
  description?: string;

  @IsNotEmpty({ each: true, message: 'Phần tử không được để trống' }) // (Tùy chọn) Kiểm tra từng phần tử không được là chuỗi rỗng
  @ArrayMinSize(1, { message: 'Mảng phải có ít nhất 1 phần tử' })
  permissonId: string[];
}
