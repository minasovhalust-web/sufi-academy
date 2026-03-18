"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCourseModuleDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_course_module_dto_1 = require("./create-course-module.dto");
class UpdateCourseModuleDto extends (0, mapped_types_1.PartialType)(create_course_module_dto_1.CreateCourseModuleDto) {
}
exports.UpdateCourseModuleDto = UpdateCourseModuleDto;
//# sourceMappingURL=update-course-module.dto.js.map