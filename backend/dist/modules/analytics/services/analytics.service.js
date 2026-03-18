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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const analytics_repository_1 = require("../repositories/analytics.repository");
const DEFAULT_LOOKBACK_DAYS = 30;
let AnalyticsService = class AnalyticsService {
    constructor(analyticsRepository) {
        this.analyticsRepository = analyticsRepository;
    }
    async logEvent(input) {
        await this.analyticsRepository.createLog(input);
    }
    async getSummary(query) {
        const range = this.toDateRange(query);
        const [summary, trend] = await Promise.all([
            this.analyticsRepository.summary(range),
            this.analyticsRepository.countByDay(range),
        ]);
        return { range: { from: range.from, to: range.to }, summary, trend };
    }
    async getCourseStats(query) {
        const range = this.toDateRange(query);
        return {
            range: { from: range.from, to: range.to },
            ...(await this.analyticsRepository.courseStats(range)),
        };
    }
    async getUserStats(query) {
        const range = this.toDateRange(query);
        const topActors = await this.analyticsRepository.topActors(range);
        return { range: { from: range.from, to: range.to }, topActors };
    }
    async log(event, actorId, subjectId, subjectType, metadata) {
        await this.logEvent({ event, actorId, subjectId, subjectType, metadata });
    }
    toDateRange(query) {
        const to = query.to ? new Date(query.to) : new Date();
        const from = query.from
            ? new Date(query.from)
            : new Date(to.getTime() - DEFAULT_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
        return { from, to };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [analytics_repository_1.AnalyticsRepository])
], AnalyticsService);
//# sourceMappingURL=analytics.service.js.map