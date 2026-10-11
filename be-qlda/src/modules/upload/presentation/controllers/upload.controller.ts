import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AccessTokenGuard } from '@/modules/auth/infrastructure/guards/access-token.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { RequirePermissions } from '@/common/decorators/permissions.decorator';
import { PermissionEnum } from '@/common/enums';
import { UploadSingleFileUseCase } from '../../application/use-cases/UploadSingleFile.use-case';
import { UploadMultipleFilesUseCase } from '../../application/use-cases/UploadMultipleFiles.use-case';
import { DeleteFileUseCase } from '../../application/use-cases/DeleteFile.use-case';
import { DeleteImageDto, UploadImageDto } from '../dto/upload-image.dto';

@ApiTags('Upload')
@Controller({
  path: 'upload',
  version: '1',
})
export class UploadController {
  constructor(
    private readonly uploadSingleFileUseCase: UploadSingleFileUseCase,
    private readonly uploadMultipleFilesUseCase: UploadMultipleFilesUseCase,
    private readonly deleteFileUseCase: DeleteFileUseCase,
  ) {}

  @Post('image')
  @UseGuards(AccessTokenGuard, PermissionsGuard)
  @RequirePermissions(PermissionEnum.FILE_UPLOAD)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload 1 hình ảnh lên Cloudinary',
    description:
      'Hỗ trợ các định dạng jpeg, png, webp, gif, svg. Dung lượng tối đa 5MB.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File hình ảnh và thư mục lưu trữ tùy chọn',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Tập tin hình ảnh cần upload',
        },
        folder: {
          type: 'string',
          example: 'mooncake/products',
          description: 'Thư mục trên Cloudinary (mặc định: mooncake/products)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 200, description: 'Upload ảnh thành công' })
  @ApiResponse({
    status: 400,
    description: 'File không hợp lệ hoặc lỗi upload',
  })
  @ApiResponse({ status: 401, description: 'Chưa xác thực (Unauthorized)' })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền thực hiện (Forbidden)',
  })
  async uploadSingleImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadImageDto,
  ) {
    const data = await this.uploadSingleFileUseCase.execute(file, body.folder);
    return {
      message: 'Upload hình ảnh thành công',
      data,
    };
  }

  @Post('images')
  @UseGuards(AccessTokenGuard, PermissionsGuard)
  @RequirePermissions(PermissionEnum.FILE_UPLOAD)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiOperation({
    summary: 'Upload nhiều hình ảnh lên Cloudinary cùng lúc (tối đa 10 ảnh)',
    description:
      'Hỗ trợ các định dạng jpeg, png, webp, gif, svg. Mỗi ảnh tối đa 5MB.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Danh sách các file hình ảnh và thư mục lưu trữ tùy chọn',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Danh sách các tập tin hình ảnh',
        },
        folder: {
          type: 'string',
          example: 'mooncake/products',
          description: 'Thư mục trên Cloudinary (mặc định: mooncake/products)',
        },
      },
      required: ['files'],
    },
  })
  @ApiResponse({ status: 200, description: 'Upload danh sách ảnh thành công' })
  @ApiResponse({
    status: 400,
    description: 'File không hợp lệ hoặc lỗi upload',
  })
  @ApiResponse({ status: 401, description: 'Chưa xác thực (Unauthorized)' })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền thực hiện (Forbidden)',
  })
  async uploadMultipleImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: UploadImageDto,
  ) {
    const data = await this.uploadMultipleFilesUseCase.execute(
      files,
      body.folder,
    );
    return {
      message: 'Upload danh sách hình ảnh thành công',
      data,
    };
  }

  @Delete()
  @UseGuards(AccessTokenGuard, PermissionsGuard)
  @RequirePermissions(PermissionEnum.FILE_UPLOAD)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Xóa hình ảnh trên Cloudinary theo publicId',
  })
  @ApiResponse({ status: 200, description: 'Xóa ảnh thành công' })
  @ApiResponse({ status: 400, description: 'publicId không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Chưa xác thực (Unauthorized)' })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền thực hiện (Forbidden)',
  })
  async deleteImage(@Body() body: DeleteImageDto) {
    const data = await this.deleteFileUseCase.execute(body.publicId);
    return {
      message: 'Xóa hình ảnh thành công',
      data,
    };
  }
}
