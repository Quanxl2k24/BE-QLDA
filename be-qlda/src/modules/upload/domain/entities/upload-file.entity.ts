export class UploadFileEntity {
  constructor(
    public readonly url: string,
    public readonly secureUrl: string,
    public readonly publicId: string,
    public readonly format: string,
    public readonly width?: number,
    public readonly height?: number,
    public readonly bytes?: number,
    public readonly resourceType?: string,
    public readonly originalFilename?: string,
  ) {}
}
