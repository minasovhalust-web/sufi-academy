import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';

declare global {
  namespace Prisma {
    interface PrismaClient {
      $extends: any;
    }

    type CourseDelegate<ExtArgs = any> = any;
    type CourseModuleDelegate<ExtArgs = any> = any;
    type LessonDelegate<ExtArgs = any> = any;
    type MaterialDelegate<ExtArgs = any> = any;
    type EnrollmentDelegate<ExtArgs = any> = any;

    export interface CourseCreateInput {
      id?: string;
      title: string;
      description?: string | null;
      slug: string;
      status?: CourseStatus;
      instructor: Prisma.UserCreateNestedOneWithoutTaughtCoursesInput;
      modules?: Prisma.CourseModuleCreateNestedManyWithoutCourseInput;
      enrollments?: Prisma.EnrollmentCreateNestedManyWithoutCourseInput;
    }

    export interface CourseUpdateInput {
      id?: Prisma.StringFieldUpdateOperationsInput | string;
      title?: Prisma.StringFieldUpdateOperationsInput | string;
      description?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
      slug?: Prisma.StringFieldUpdateOperationsInput | string;
      status?: Prisma.EnumCourseStatusFieldUpdateOperationsInput | CourseStatus;
      instructor?: Prisma.UserUpdateOneRequiredWithoutTaughtCoursesNestedInput;
      modules?: Prisma.CourseModuleUpdateManyWithoutCourseNestedInput;
      enrollments?: Prisma.EnrollmentUpdateManyWithoutCourseNestedInput;
      createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
      updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    }

    export interface CourseModuleCreateInput {
      id?: string;
      title: string;
      order: number;
      course: Prisma.CourseCreateNestedOneWithoutModulesInput;
      lessons?: Prisma.LessonCreateNestedManyWithoutModuleInput;
    }

    export interface CourseModuleUpdateInput {
      id?: Prisma.StringFieldUpdateOperationsInput | string;
      title?: Prisma.StringFieldUpdateOperationsInput | string;
      order?: Prisma.IntFieldUpdateOperationsInput | number;
      course?: Prisma.CourseUpdateOneRequiredWithoutModulesNestedInput;
      lessons?: Prisma.LessonUpdateManyWithoutModuleNestedInput;
      createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
      updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    }

    export interface LessonCreateInput {
      id?: string;
      title: string;
      content?: string | null;
      order: number;
      duration?: number | null;
      module: Prisma.CourseModuleCreateNestedOneWithoutLessonsInput;
      materials?: Prisma.MaterialCreateNestedManyWithoutLessonInput;
    }

    export interface LessonUpdateInput {
      id?: Prisma.StringFieldUpdateOperationsInput | string;
      title?: Prisma.StringFieldUpdateOperationsInput | string;
      content?: Prisma.NullableStringFieldUpdateOperationsInput | string | null;
      order?: Prisma.IntFieldUpdateOperationsInput | number;
      duration?: Prisma.NullableIntFieldUpdateOperationsInput | number | null;
      module?: Prisma.CourseModuleUpdateOneRequiredWithoutLessonsNestedInput;
      materials?: Prisma.MaterialUpdateManyWithoutLessonNestedInput;
      createdAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
      updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    }

    export interface MaterialCreateInput {
      id?: string;
      title: string;
      type: MaterialType;
      url: string;
      lesson: Prisma.LessonCreateNestedOneWithoutMaterialsInput;
    }

    export interface EnrollmentCreateInput {
      id?: string;
      status?: EnrollmentStatus;
      progress?: number;
      user: Prisma.UserCreateNestedOneWithoutEnrollmentsInput;
      course: Prisma.CourseCreateNestedOneWithoutEnrollmentsInput;
      enrolledAt?: Date | string;
      updatedAt?: Date | string;
    }

    export interface EnrollmentUpdateInput {
      id?: Prisma.StringFieldUpdateOperationsInput | string;
      status?: Prisma.EnumEnrollmentStatusFieldUpdateOperationsInput | EnrollmentStatus;
      progress?: Prisma.IntFieldUpdateOperationsInput | number;
      user?: Prisma.UserUpdateOneRequiredWithoutEnrollmentsNestedInput;
      course?: Prisma.CourseUpdateOneRequiredWithoutEnrollmentsNestedInput;
      enrolledAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
      updatedAt?: Prisma.DateTimeFieldUpdateOperationsInput | Date | string;
    }
  }
}

export {};
