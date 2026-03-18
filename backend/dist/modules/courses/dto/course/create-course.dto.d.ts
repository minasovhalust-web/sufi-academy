export declare enum CourseStatus {
    DRAFT = "DRAFT",
    PUBLISHED = "PUBLISHED",
    ARCHIVED = "ARCHIVED"
}
export declare class CreateCourseDto {
    title: string;
    description?: string;
    slug?: string;
    status?: CourseStatus;
    price?: number;
    currency?: string;
}
