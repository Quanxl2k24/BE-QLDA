import { Module } from '@nestjs/common';
import { UploadController } from './presentation/controllers/upload.controller';
import { CloudinaryProvider } from './infrastructure/cloudinary/cloudinary.provider';
import { CloudinaryService } from './infrastructure/services/cloudinary.service';
import { UploadService } from './domain/services/upload.service.interface';
import { UploadSingleFileUseCase } from './application/use-cases/UploadSingleFile.use-case';
import { UploadMultipleFilesUseCase } from './application/use-cases/UploadMultipleFiles.use-case';
import { DeleteFileUseCase } from './application/use-cases/DeleteFile.use-case';

@Module({
  controllers: [UploadController],
  providers: [
    CloudinaryProvider,
    UploadSingleFileUseCase,
    UploadMultipleFilesUseCase,
    DeleteFileUseCase,
    {
      provide: UploadService,
      useClass: CloudinaryService,
    },
  ],
  exports: [UploadService],
})
export class UploadModule {}
