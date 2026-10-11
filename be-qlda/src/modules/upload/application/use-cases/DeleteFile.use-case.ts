import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { UploadService } from '../../domain/services/upload.service.interface';

@Injectable()
export class DeleteFileUseCase {
  constructor(private readonly uploadService: UploadService) {}

  async execute(publicId: string) {
    if (!publicId || publicId.trim() === '') {
      throw new BadRequestException('publicId không được để trống');
    }

    return await this.uploadService.deleteFile(publicId.trim());
  }
}
