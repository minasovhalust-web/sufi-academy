import { EnrollmentsService } from '../services/enrollments.service';
import { CreateEnrollmentDto } from '../dto/enrollment/create-enrollment.dto';
import { UpdateEnrollmentDto } from '../dto/enrollment/update-enrollment.dto';
export declare class EnrollmentsController {
    private readonly enrollmentsService;
    constructor(enrollmentsService: EnrollmentsService);
    enroll(dto: CreateEnrollmentDto, req: any): Promise<any>;
    findMy(req: any): Promise<any[]>;
    findByCourse(courseId: string, req: any): Promise<any[]>;
    updateProgress(courseId: string, dto: UpdateEnrollmentDto, req: any): Promise<any>;
    unenroll(courseId: string, req: any): Promise<void>;
}
