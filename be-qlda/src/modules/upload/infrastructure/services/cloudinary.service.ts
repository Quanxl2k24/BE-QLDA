import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import {
  v2 as cloudinary,
  UploadApiResponse,
  UploadApiErrorResponse,
} from 'cloudinary';
import { Readable } from 'stream';
import { UploadService } from '../../domain/services/upload.service.interface';
import { UploadFileEntity } from '../../domain/entities/upload-file.entity';

@Injectable()
export class CloudinaryService implements UploadService {
  private readonly logger = new Logger(CloudinaryService.name);

  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'mooncake/products',
  ): Promise<UploadFileEntity> {
    if (!file || !file.buffer) {
      throw new BadRequestException('Tập tin không hợp lệ hoặc rỗng');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
        },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error || !result) {
            this.logger.error('Lỗi upload Cloudinary:', error);
            return reject(
              new BadRequestException(
                error?.message || 'Upload hình ảnh lên Cloudinary thất bại',
              ),
            );
          }

          resolve(
            new UploadFileEntity(
              result.url,
              result.secure_url,
              result.public_id,
              result.format,
              result.width,
              result.height,
              result.bytes,
              result.resource_type,
              file.originalname,
            ),
          );
        },
      );

      Readable.from(file.buffer).pipe(uploadStream);
    });
  }

  async uploadImages(
    files: Express.Multer.File[],
    folder: string = 'mooncake/products',
  ): Promise<UploadFileEntity[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('Danh sách tập tin không được rỗng');
    }

    return Promise.all(files.map((file) => this.uploadImage(file, folder)));
  }

  async deleteFile(publicId: string): Promise<{ result: string }> {
    if (!publicId || publicId.trim() === '') {
      throw new BadRequestException('publicId không hợp lệ');
    }

    try {
      const res = await cloudinary.uploader.destroy(publicId.trim());
      if (res.result !== 'ok' && res.result !== 'not found') {
        throw new BadRequestException(
          `Không thể xóa ảnh trên Cloudinary: ${res.result}`,
        );
      }
      return { result: res.result };
    } catch (error: any) {
      this.logger.error('Lỗi xóa file Cloudinary:', error);
      throw new BadRequestException(
        error?.message || 'Xóa ảnh trên Cloudinary thất bại',
      );
    }
  }
}
