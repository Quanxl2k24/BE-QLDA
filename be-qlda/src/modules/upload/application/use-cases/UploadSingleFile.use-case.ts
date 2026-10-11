import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { UploadService } from '../../domain/services/upload.service.interface';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

@Injectable()
export class UploadSingleFileUseCase {
  constructor(private readonly uploadService: UploadService) {}

  async execute(file: Express.Multer.File, folder?: string) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn tập tin hình ảnh để upload');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Định dạng file không được hỗ trợ (${file.mimetype}). Chỉ chấp nhận jpeg, png, webp, gif, svg.`,
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `Kích thước file vượt quá giới hạn cho phép (tối đa 5MB). Kích thước hiện tại: ${(file.size / (1024 * 1024)).toFixed(2)}MB`,
      );
    }

    return await this.uploadService.uploadImage(file, folder);
  }
}
