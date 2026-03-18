import { MaterialsService } from '../services/materials.service';
import { CreateMaterialDto } from '../dto/material/create-material.dto';
export declare class MaterialsController {
    private readonly materialsService;
    constructor(materialsService: MaterialsService);
    create(lessonId: string, dto: CreateMaterialDto, req: any): Promise<any>;
    findAll(lessonId: string, req: any): Promise<any[]>;
    findOne(id: string, req: any): Promise<any>;
    remove(id: string, req: any): Promise<void>;
}
