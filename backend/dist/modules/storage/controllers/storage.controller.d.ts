import { StorageService } from '../storage.interface';
interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
}
export declare class StorageController {
    private readonly storageService;
    private readonly logger;
    constructor(storageService: StorageService);
    uploadFile(file: MulterFile): Promise<{
        key: string;
        url: string;
        name: string;
        mimeType: string;
        size: number;
    }>;
}
export {};
