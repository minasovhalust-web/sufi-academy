import { CourseModulesService } from '../services/course-modules.service';
import { CreateCourseModuleDto } from '../dto/module/create-course-module.dto';
import { UpdateCourseModuleDto } from '../dto/module/update-course-module.dto';
export declare class CourseModulesController {
    private readonly modulesService;
    constructor(modulesService: CourseModulesService);
    create(courseId: string, dto: CreateCourseModuleDto, req: any): Promise<any>;
    findAll(courseId: string): Promise<any[]>;
    findOne(id: string): Promise<any>;
    update(id: string, dto: UpdateCourseModuleDto, req: any): Promise<any>;
    remove(id: string, req: any): Promise<void>;
}
