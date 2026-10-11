import { UploadFileEntity } from '../entities/upload-file.entity';

export abstract class UploadService {
  abstract uploadImage(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<UploadFileEntity>;

  abstract uploadImages(
    files: Express.Multer.File[],
    folder?: string,
  ): Promise<UploadFileEntity[]>;

  abstract deleteFile(publicId: string): Promise<{ result: string }>;
}
