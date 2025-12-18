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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CombatController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const combat_service_1 = require("./combat.service");
let CombatController = class CombatController {
    combatService;
    constructor(combatService) {
        this.combatService = combatService;
    }
    async createCombat(req, data) {
        return this.combatService.createCombat(req.user.sub, data);
    }
    async getCombats(req, campaignId) {
        return this.combatService.getCombats(req.user.sub, campaignId);
    }
    async getCombat(req, id) {
        return this.combatService.getCombat(req.user.sub, id);
    }
    async deleteCombat(req, id) {
        return this.combatService.deleteCombat(req.user.sub, id);
    }
    async addParticipant(req, combatId, data) {
        return this.combatService.addParticipant(req.user.sub, {
            combatId,
            ...data
        });
    }
    async updateParticipant(req, participantId, data) {
        return this.combatService.updateParticipant(req.user.sub, participantId, data);
    }
    async removeParticipant(req, participantId) {
        return this.combatService.removeParticipant(req.user.sub, participantId);
    }
    async startCombat(req, id) {
        return this.combatService.startCombat(req.user.sub, id);
    }
    async nextTurn(req, id) {
        return this.combatService.nextTurn(req.user.sub, id);
    }
    async endCombat(req, id) {
        return this.combatService.endCombat(req.user.sub, id);
    }
};
exports.CombatController = CombatController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CombatController.prototype, "createCombat", null);
__decorate([
    (0, common_1.Get)('campaign/:campaignId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('campaignId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CombatController.prototype, "getCombats", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CombatController.prototype, "getCombat", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CombatController.prototype, "deleteCombat", null);
__decorate([
    (0, common_1.Post)(':combatId/participants'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('combatId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CombatController.prototype, "addParticipant", null);
__decorate([
    (0, common_1.Put)('participants/:participantId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('participantId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], CombatController.prototype, "updateParticipant", null);
__decorate([
    (0, common_1.Delete)('participants/:participantId'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('participantId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CombatController.prototype, "removeParticipant", null);
__decorate([
    (0, common_1.Post)(':id/start'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CombatController.prototype, "startCombat", null);
__decorate([
    (0, common_1.Post)(':id/next-turn'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CombatController.prototype, "nextTurn", null);
__decorate([
    (0, common_1.Post)(':id/end'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], CombatController.prototype, "endCombat", null);
exports.CombatController = CombatController = __decorate([
    (0, common_1.Controller)('combat'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [combat_service_1.CombatService])
], CombatController);
//# sourceMappingURL=combat.controller.js.map