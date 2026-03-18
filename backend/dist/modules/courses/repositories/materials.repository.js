"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../../prisma/prisma.service");
let MaterialsRepository = class MaterialsRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        return this.prisma.material.create({ data });
    }
    async findByLesson(lessonId) {
        return this.prisma.material.findMany({ where: { lessonId } });
    }
    async findById(id) {
        return this.prisma.material.findUnique({
            where: { id },
            include: { lesson: { include: { module: { include: { course: true } } } } },
        });
    }
    async delete(id) {
        await this.prisma.material.delete({ where: { id } });
    }
};
exports.MaterialsRepository = MaterialsRepository;
exports.MaterialsRepository = MaterialsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], MaterialsRepository);
//# sourceMappingURL=materials.repository.js.map