"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fight_utils_1 = require("./fight_utils");
var fight_1 = require("./fight");
/** 单次攻击的的状态机 */
var eachStatus = /** @class */ (function () {
    function eachStatus() {
        /**  额外闪避百分比 */
        this.missRate = 0;
        /**  额外格挡百分比 */
        this.blockRate = 0;
        /**  额外暴击百分比 */
        this.critDamageRate = 0;
        /**  额外的克制百分比 */
        this.restrainRate = 0;
        /**  额外反伤百分比 */
        this.rehurtRate = 0;
        /**  //额外技能伤害百分比(包括) */
        this.skillDamageRate = 0;
        /**  额外基础伤害百分比 */
        this.basicDamageRate = 0;
    }
    return eachStatus;
}());
exports.eachStatus = eachStatus;
/** 战斗后处理被动技能 */
var eachResult = /** @class */ (function () {
    function eachResult() {
        /** 基础伤害系数 */
        this.basicFactor = 0;
        this.basicDamage = 0;
        this.restrainFactor = 0;
        this.skillFactor = 0;
    }
    return eachResult;
}());
exports.eachResult = eachResult;
var FightSkill = /** @class */ (function () {
    function FightSkill() {
    }
    /** 计算伤害 */
    FightSkill.prototype.calcDamage = function (team_dict, attack_role, target_role, skill_info) {
        var atk_status = new fight_1.FightRoleStatus(attack_role);
        var def_status = new fight_1.FightRoleStatus(target_role);
        var tIsCrit = false;
        var tIgnDef = false;
        if (skill_info.canSkillCrit) { // 技能受暴击影响 计算是否暴击
            for (var i = 0; i < skill_info.bulletNum; i++) {
                tIsCrit = (Math.random() * 100) <= (attack_role.now_attr[fight_utils_1.AttributeType.CRIT] + (skill_info.addCrit / 10000));
                if (tIsCrit) {
                    break;
                }
            }
            for (var i = 0; i < skill_info.bulletNum; i++) {
                tIgnDef = (Math.random() * 100) <= attack_role.now_attr[fight_utils_1.AttributeType.IGNDEF];
                if (tIgnDef) {
                    break;
                }
            }
        }
        var tTargetHPDamageNum = 0;
        switch (skill_info.effectType) { // 伤害类型
            case fight_utils_1.SkillEffectType.NULL: // 无效果
                tTargetHPDamageNum = tTargetHPDamageNum + 0;
                break;
            case fight_utils_1.SkillEffectType.REAL_ACT: // 真实伤害
                tTargetHPDamageNum = tTargetHPDamageNum + ((attack_role.now_attr[fight_utils_1.AttributeType.ATK] || 0) * (1 + (skill_info.effectCoef / 10000)));
                break;
            case fight_utils_1.SkillEffectType.DEFAULT_ACT: // 普攻伤害
                if (tIgnDef) {
                    tTargetHPDamageNum = tTargetHPDamageNum + ((attack_role.now_attr[fight_utils_1.AttributeType.ATK] || 0) + skill_info.effectFixed) * (1 - attack_role.now_attr[fight_utils_1.AttributeType.HURTRED] - attack_role.now_attr[fight_utils_1.AttributeType.SKILLDMGREDUCE] + attack_role.now_attr[fight_utils_1.AttributeType.HURTADD] + attack_role.now_attr[fight_utils_1.AttributeType.SKILLDMGINCREASE] + (skill_info.effectCoef / 10000));
                }
                else {
                    tTargetHPDamageNum = tTargetHPDamageNum + (((attack_role.now_attr[fight_utils_1.AttributeType.ATK] - target_role.now_attr[fight_utils_1.AttributeType.DEF] * (1 - (skill_info.ignoreArmor / 10000))) || 0) + skill_info.effectFixed) * (1 - attack_role.now_attr[fight_utils_1.AttributeType.HURTRED] - attack_role.now_attr[fight_utils_1.AttributeType.SKILLDMGREDUCE] + attack_role.now_attr[fight_utils_1.AttributeType.HURTADD] + attack_role.now_attr[fight_utils_1.AttributeType.SKILLDMGINCREASE] + (skill_info.effectCoef / 10000));
                }
                break;
            case fight_utils_1.SkillEffectType.SKILL_ACT: // 技能伤害
                if (tIgnDef) {
                    tTargetHPDamageNum = tTargetHPDamageNum + ((attack_role.now_attr[fight_utils_1.AttributeType.ATK] || 0) + skill_info.effectFixed) * (1 - attack_role.now_attr[fight_utils_1.AttributeType.HURTRED] - attack_role.now_attr[fight_utils_1.AttributeType.SKILLDMGREDUCE] + attack_role.now_attr[fight_utils_1.AttributeType.HURTADD] + attack_role.now_attr[fight_utils_1.AttributeType.SKILLDMGINCREASE] + (skill_info.effectCoef / 10000));
                }
                else {
                    tTargetHPDamageNum = tTargetHPDamageNum + (((attack_role.now_attr[fight_utils_1.AttributeType.ATK] - target_role.now_attr[fight_utils_1.AttributeType.DEF] * (1 - (skill_info.ignoreArmor / 10000))) || 0) + skill_info.effectFixed) * (1 - attack_role.now_attr[fight_utils_1.AttributeType.HURTRED] - attack_role.now_attr[fight_utils_1.AttributeType.SKILLDMGREDUCE] + attack_role.now_attr[fight_utils_1.AttributeType.HURTADD] + attack_role.now_attr[fight_utils_1.AttributeType.SKILLDMGINCREASE] + (skill_info.effectCoef / 10000));
                }
                break;
            case fight_utils_1.SkillEffectType.CURE: // 治疗技能
                tTargetHPDamageNum = tTargetHPDamageNum + ((attack_role.now_attr[fight_utils_1.AttributeType.ATK] || 0) + skill_info.effectFixed) * (1 + (skill_info.effectCoef / 10000));
                break;
            case fight_utils_1.SkillEffectType.RESURRECTION: // 复活技能
                tTargetHPDamageNum = tTargetHPDamageNum + ((attack_role.now_attr[fight_utils_1.AttributeType.ATK] || 0) + skill_info.effectFixed) * (1 + (skill_info.effectCoef / 10000));
                break;
        }
        tTargetHPDamageNum = (tTargetHPDamageNum < 0) ? 0 : tTargetHPDamageNum;
        if (tIsCrit) {
            tTargetHPDamageNum = tTargetHPDamageNum * (1 + 0.5 + attack_role.now_attr[fight_utils_1.AttributeType.CRITHURT]);
        }
        switch (skill_info.extraDmgType) { // 额外伤害类型
            case fight_utils_1.ExtraDmgType.NONE: // 无额外附加伤害
                tTargetHPDamageNum = tTargetHPDamageNum + 0;
                break;
            case fight_utils_1.ExtraDmgType.FIXED_VALUE: // 附加固定值
                tTargetHPDamageNum = tTargetHPDamageNum + skill_info.extraDmgValue;
                break;
            case fight_utils_1.ExtraDmgType.MAX_HP_RATE: // 目标生命最大万分比
                tTargetHPDamageNum = tTargetHPDamageNum + target_role.max_hp * (skill_info.extraDmgValue / 10000);
                break;
            case fight_utils_1.ExtraDmgType.NOW_HP_RATE: // 目标生命当前万分比
                tTargetHPDamageNum = tTargetHPDamageNum + target_role.now_hp * (skill_info.extraDmgValue / 10000);
                break;
            case fight_utils_1.ExtraDmgType.LOSE_HP_RATE: // 目标生命损失万分比
                tTargetHPDamageNum = tTargetHPDamageNum + (target_role.max_hp - target_role.now_hp) * (skill_info.extraDmgValue / 10000);
                break;
        }
        var tAttckerHPAddNum = 0;
        tAttckerHPAddNum = tAttckerHPAddNum + skill_info.suckBlood;
        tAttckerHPAddNum = tAttckerHPAddNum + tTargetHPDamageNum * (skill_info.suckBloodPercent / 10000);
        var tAttckerMPAddNum = 0;
        tAttckerMPAddNum = tAttckerMPAddNum + target_role.now_mp * (skill_info.suckMpPercent / 10000);
        var tTargetMPDamageNum = 0;
        tTargetMPDamageNum = tTargetMPDamageNum + target_role.now_mp * (skill_info.suckMpPercent / 10000);
        tTargetMPDamageNum = tTargetMPDamageNum + target_role.now_mp * (skill_info.burnMpPercent / 10000);
        var tTargetMPAddNum = 0;
        if (tIsCrit) {
            tTargetMPAddNum = target_role.now_attr[fight_utils_1.AttributeType.CRITPROB];
        }
        else {
            tTargetMPAddNum = target_role.now_attr[fight_utils_1.AttributeType.HITPROB];
        }
        var tAttackerMPAddNum = attack_role.now_attr[fight_utils_1.AttributeType.ANGRYSPEED];
        var tTargetBuffList = [];
        for (var i = 0; i < skill_info.bulletNum; i++) {
            var tAddBuff = (Math.random() * 100) <= skill_info.buffOdds / 100;
            if (tAddBuff) {
                tTargetBuffList.push({ buff_id: skill_info.buffId, round: skill_info.buffTime });
            }
        }
        var tAttackerBuffList = [];
        for (var i = 0; i < skill_info.bulletNum; i++) {
            var tAddBuff = (Math.random() * 100) <= skill_info.ownerBuffOdds / 100;
            if (tAddBuff) {
                tAttackerBuffList.push({ buff_id: skill_info.ownerBuffId, round: skill_info.ownerBuffTime });
            }
        }
        target_role.dispelBuffByType(skill_info.dispel); // 驱散效果
        var tAddInfo;
        tAddInfo = target_role.addHP(-tTargetHPDamageNum);
        def_status[2] = tAddInfo.value;
        // def_status[4]
        def_status[5] = tAddInfo.damage;
        tAddInfo = attack_role.addHP(tAttckerHPAddNum);
        atk_status[6] = tAttckerHPAddNum;
        tAddInfo = target_role.addMP(tTargetMPAddNum - tTargetMPDamageNum);
        tAddInfo = attack_role.addMP(tAttackerMPAddNum);
        target_role.addBuffList(tTargetBuffList);
        attack_role.addBuffList(tAttackerBuffList);
        def_status.refBuffAndHPByFightRole(target_role);
        atk_status.refBuffAndHPByFightRole(attack_role);
        return { atk_status: atk_status, def_status: def_status };
    };
    return FightSkill;
}());
exports.FightSkill = FightSkill;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlnaHRfc2tpbGwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9jb2RlL2ZpZ2h0L2ZpZ2h0X3NraWxsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQXFLO0FBR3JLLGlDQUFzRDtBQUl0RCxnQkFBZ0I7QUFDaEI7SUFBQTtRQUNJLGVBQWU7UUFDUixhQUFRLEdBQVcsQ0FBQyxDQUFDO1FBQzVCLGVBQWU7UUFDUixjQUFTLEdBQVcsQ0FBQyxDQUFDO1FBQzdCLGVBQWU7UUFDUixtQkFBYyxHQUFXLENBQUMsQ0FBQztRQUNsQyxnQkFBZ0I7UUFDVCxpQkFBWSxHQUFXLENBQUMsQ0FBQztRQUNoQyxlQUFlO1FBQ1IsZUFBVSxHQUFXLENBQUMsQ0FBQztRQUM5Qix1QkFBdUI7UUFDaEIsb0JBQWUsR0FBVyxDQUFDLENBQUM7UUFDbkMsaUJBQWlCO1FBQ1Ysb0JBQWUsR0FBVyxDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUFELGlCQUFDO0FBQUQsQ0FBQyxBQWZELElBZUM7QUFmWSxnQ0FBVTtBQWlCdkIsZ0JBQWdCO0FBQ2hCO0lBQUE7UUFDSSxhQUFhO1FBQ04sZ0JBQVcsR0FBVyxDQUFDLENBQUM7UUFDeEIsZ0JBQVcsR0FBVyxDQUFDLENBQUM7UUFDeEIsbUJBQWMsR0FBVyxDQUFDLENBQUM7UUFDM0IsZ0JBQVcsR0FBVyxDQUFDLENBQUM7SUFDbkMsQ0FBQztJQUFELGlCQUFDO0FBQUQsQ0FBQyxBQU5ELElBTUM7QUFOWSxnQ0FBVTtBQVF2QjtJQUFBO0lBbUlBLENBQUM7SUFqSUcsV0FBVztJQUNKLCtCQUFVLEdBQWpCLFVBQWtCLFNBQTJDLEVBQUUsV0FBc0IsRUFBRSxXQUFzQixFQUFFLFVBQXFCO1FBQ2hJLElBQUksVUFBVSxHQUFvQixJQUFJLHVCQUFlLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDbkUsSUFBSSxVQUFVLEdBQW9CLElBQUksdUJBQWUsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUVuRSxJQUFJLE9BQU8s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