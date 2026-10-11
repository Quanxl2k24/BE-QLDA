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
const MAX_FILES_COUNT = 10;

@Injectable()
export class UploadMultipleFilesUseCase {
  constructor(private readonly uploadService: UploadService) {}

  async execute(files: Express.Multer.File[], folder?: string) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Vui lòng chọn ít nhất 1 hình ảnh để upload');
    }

    if (files.length > MAX_FILES_COUNT) {
      throw new BadRequestException(
        `Chỉ được upload tối đa ${MAX_FILES_COUNT} ảnh trong một lần`,
      );
    }

    for (const file of files) {
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw new BadRequestException(
          `Tập tin "${file.originalname}" có định dạng không được hỗ trợ (${file.mimetype}). Chỉ chấp nhận jpeg, png, webp, gif, svg.`,
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new BadRequestException(
          `Tập tin "${file.originalname}" vượt quá giới hạn 5MB (${(file.size / (1024 * 1024)).toFixed(2)}MB).`,
        );
      }
    }

    return await this.uploadService.uploadImages(files, folder);
  }
}
