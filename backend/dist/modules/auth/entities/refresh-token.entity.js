"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshTokenEntity = void 0;
class RefreshTokenEntity {
    constructor(partial) { Object.assign(this, partial); }
    get isValid() { return !this.revokedAt && this.expiresAt > new Date(); }
}
exports.RefreshTokenEntity = RefreshTokenEntity;
//# sourceMappingURL=refresh-token.entity.js.map