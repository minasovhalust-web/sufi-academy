"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserResponseDto = void 0;
class UserResponseDto {
    constructor(partial) {
        this.id = partial.id;
        this.email = partial.email;
        this.firstName = partial.firstName;
        this.lastName = partial.lastName;
        this.role = partial.role;
        this.isActive = partial.isActive;
        this.createdAt = partial.createdAt;
        this.updatedAt = partial.updatedAt;
    }
}
exports.UserResponseDto = UserResponseDto;
//# sourceMappingURL=user-response.dto.js.map