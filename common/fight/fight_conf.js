"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** 技能组配置 */
var BuffInfo = /** @class */ (function () {
    function BuffInfo() {
        /** 索引ID */
        this.id = 0;
        /** 正面效果 */
        this.dirType = 0;
        /** 不可被驱散 */
        this.cannotDispel = 0;
        /** 是否受到负面抗性影响 */
        this.buffResistance = 0;
        /** 效果类型 */
        this.effectType = 0;
        /** 效果固定值 */
        this.effectFixed = 0;
        /** 效果系数(万分比)	 */
        this.effectCoef = 0;
        /** 额外伤害效果 */
        this.extraDmgType = 0;
        /** 额外伤害参数 */
        this.extraDmgValue = 0;
        /** 属性修改 */
        this.attributeId = [];
        /** 属性值修改 */
        this.attributeValue = [];
        /** 攻击吸血万分比 */
        this.suckBloodPercent = 0;
        /** 攻击吸血固定值 */
        this.suckBlood = 0;
        /** 免疫负面物理伤害万分比 */
        this.immnuePhy = 0;
        /** 免疫负面技能伤害万分比 */
        this.immnueMag = 0;
        /** 免疫负面物理伤害次数 */
        this.ignorePhyTimes = 0;
        /** 免疫负面技能伤害次数 */
        this.ignoreMagTimes = 0;
        /** 限制行动 */
        this.banMove = 0;
        /** 反弹物理伤害万分比 */
        this.reboundDmg = 0;
        /** 改变技能组 */
        this.changeSkillGroup = 0;
        /** 变身资源名 */
        this.reUrl = "";
        /** 变身资源类型 */
        this.reType = 0;
        /** 变身后缩放百分比 */
        this.reScale = 0;
        /** buff特效资源 */
        this.buffRes = "";
        /** buff特效类型(1只显示一次, 2循环特效) */
        this.buffResType = 0;
        /** buff特效挂载点(1上2中3下) */
        this.buffPos = 0;
        /** buff特效渲染层级(1上2下) */
        this.buffZorder = 0;
        /** buff位置偏移 */
        this.buffOffsetX = 0;
        /** buff位置偏移1 */
        this.buffOffsetY = 0;
        /** buff特效资源1 */
        this.buffRes2 = "";
        /** buff特效类型(1只显示一次, 2循环特效)1 */
        this.buffResType2 = 0;
        /** buff特效挂载点(1上2中3下)1 */
        this.buffPos2 = 0;
        /** buff特效渲染层级(1上2下)1	 */
        this.buffZorder2 = 0;
        /** buff位置偏移2 */
        this.buffOffsetX2 = 0;
        /** buff位置偏移3 */
        this.buffOffsetY2 = 0;
        /** 是否显示数字 */
        this.showNum = 0;
    }
    return BuffInfo;
}());
exports.BuffInfo = BuffInfo;
// /** 技能buff效果 */
// export class SkillBuffInfo {
//     readonly status: number;
//     readonly cover: Array<string>;
//     readonly replace: number;
//     readonly limit: number;
//     constructor($status: number, $cover: Array<string>, $replace: number, $limit: number) {
//         this.status = $status;
//         this.cover = $cover;
//         this.replace = $replace;
//         this.limit = $limit;
//     }
// }
/** 技能组配置 */
var SkillGroup = /** @class */ (function () {
    function SkillGroup() {
        /** 技能组id */
        this.id = 0;
        /** 普攻技能 */
        this.baseSkill = 0;
        /** 怒气技能 */
        this.angerSkill = 0;
        /** 怒气技能所需怒气点 */
        this.angerSkillLimit = 0;
    }
    return SkillGroup;
}());
exports.SkillGroup = SkillGroup;
/** 技能信息 */
var SkillInfo = /** @class */ (function () {
    function SkillInfo() {
        /** 技能Id */
        this.skillId = 0;
        /** 技能名称 */
        this.name = "";
        /** 释放类型 */
        this.castType = 0;
        /** 施法动作 */
        this.action = "";
        /** 释放音效 */
        this.castSount = "";
        /** 选择目标类型 */
        this.targetType = "";
        /** 优先选中自己 */
        this.isSelfFirst = false;
        /** 寻找目标方式 */
        this.findTargetWay = 0;
        /** 范围选择目标最大个数 */
        this.targetMaxNum = 0;
        /** 子弹Id */
        this.bulletId = 0;
        /** 子弹延迟发射（ms） */
        this.bulletDelay = 0;
        /** 子弹数量 */
        this.bulletNum = 0;
        /** 子弹间隔时间毫秒 */
        this.bulletInterval = 0;
        /** 子弹发射类型 */
        this.bulletType = 0;
        /** 技能受击音效 */
        this.hitSoundEffect = "";
        /** 受击特效 */
        this.hspeRes = "";
        /** 受击特效挂点 */
        this.hspePos = "";
        /** 受击特效渲染层级 */
        this.affectedZorder = 0;
        /** 技能特效 */
        this.speId = "";
        /** 特效循环次数 */
        this.effectsTimes = 0;
        /** 效果产生次数 */
        this.effectTimes = 0;
        /** 效果产生延迟时间 */
        this.effectDelay = 0;
        /** 效果产生间隔 */
        this.effectInterval = 0;
        /** 效果类型 */
        this.effectType = 0;
        /** 正面效果 */
        this.dirType = 0;
        /** 效果固定值 */
        this.effectFixed = 0;
        /** 效果系数[万分比] */
        this.effectCoef = 0;
        /** 额外伤害类型 */
        this.extraDmgType = 0;
        /** 额外伤害值 */
        this.extraDmgValue = 0;
        /** 是否显示数字 */
        this.showNum = 0;
        /** 是否受技能暴击率影响 */
        this.canSkillCrit = 0;
        /** 是否无视闪避 */
        this.ignoreDodge = 0;
        /** 无视护甲万分比 */
        this.ignoreArmor = 0;
        /** 附加暴击率万分比 */
        this.addCrit = 0;
        /** 附加吸血万分比 */
        this.suckBloodPercent = 0;
        /** 附加吸血固定值 */
        this.suckBlood = 0;
        /** 抽怒万分比 */
        this.suckMpPercent = 0;
        /** 消怒万分比 〉0时减少目标怒气 〈0时恢复目标怒气 */
        this.burnMpPercent = 0;
        /** 驱散效果 */
        this.dispel = 0;
        /** 屏幕震动时间毫秒(只支持近战或者bulletType为2的技能) */
        this.shakeTime = 0;
        /** 震动强度横向 */
        this.shakeX = 0;
        /** 震动强度纵向 */
        this.shakeY = 0;
        /** 产生的buff */
        this.buffId = 0;
        /** BUFF生效几率（万分比） */
        this.buffOdds = 0;
        /** BUFF持续时间（毫秒） */
        this.buffTime = 0;
        /** 施放者BUFF */
        this.ownerBuffId = 0;
        /** 释放者BUFF生效几率（万分比） */
        this.ownerBuffOdds = 0;
        /** 释放者BUFF持续时间（毫秒） */
        this.ownerBuffTime = 0;
        /** 技能icon */
        this.icon = "";
        /** 技能描述 */
        this.desc = "";
        /** 技能参数 */
        this.descPara = "";
        /** 最小选择数量 */
        this.targetMinNum = 1;
    }
    return SkillInfo;
}());
exports.SkillInfo = SkillInfo;
var HeroInfo = /** @class */ (function () {
    function HeroInfo() {
        /**模板ID */
        this.id = 0;
        /** 模型ID */
        this.modelId = 0;
        /** 英雄名称 */
        this.heroName = "";
        /** 阵营(1-魏，2-蜀，3-吴，4-群雄) */
        this.camp = 0;
        /** 定位(1-物攻，2-法攻，3-防御，4-辅助) */
        this.ability = 0;
        /** 基础品质 */
        this.quality = 0;
        /** 基础星级 */
        this.starBase = 0;
        /** 突破类型 */
        this.rebornType = 0;
        /** 基础攻击系数 */
        this.atkC = 0;
        /** 基础防御系数 */
        this.defC = 0;
        /** 基础生命系数 */
        this.hpC = 0;
        /** 基础速度系数 */
        this.speedC = 0;
        /** 天赋组ID */
        this.innateGroup = 0;
        /** 技能组ID */
        this.skillGroupId = 0;
        /** 技能效果名称1 */
        this.skillEffectName1 = "";
        /** 技能效果描述1 */
        this.skillEffectDesc1 = "";
        /** 技能效果名称2 */
        this.skillEffectName2 = "";
        /** 技能效果描述2 */
        this.skillEffectDesc2 = "";
    }
    return HeroInfo;
}());
exports.HeroInfo = HeroInfo;
/** 角色在背包中的信息 */
var BagHeroData = /** @class */ (function () {
    function BagHeroData() {
        /** 在背包中的索引 */
        this.bag_pos = 0;
        /** 角色模板id */
        this.rid = 0;
        this.awake = 0;
        this.tier = 0;
        /** 角色等级 */
        this.level = 0;
        /** 角色装备列表 {[pos:装备部位]:装备id} */
        this.equip = {};
    }
    return BagHeroData;
}());
exports.BagHeroData = BagHeroData;
/** 属性结构 */
var AttrDict = /** @class */ (function () {
    function AttrDict() {
    }
    return AttrDict;
}());
exports.AttrDict = AttrDict;
/** 战斗相关配置 */
var FightConf = /** @class */ (function () {
    /**
     * 初始化配置
     * @param gConfSkill                技能信息配置
     * @param gConfSkillGroup           技能组配置
     * @param gConfBuff                 buff配置
     * @param gConfCombatHeroTemplate   角色模板配置
     */
    function FightConf(gConfSkill, gConfSkillGroup, gConfBuff, gConfCombatHeroTemplate) {
        this._skillDict = {};
        this._skillGroupDict = {};
        this._buffDict = {};
        this._combat_hero_info = {};
        if (!gConfSkill) {
            return;
        }
        if (!gConfSkillGroup) {
            return;
        }
        if (!gConfBuff) {
            return;
        }
        if (!gConfCombatHeroTemplate) {
            return;
        }
        for (var tKey1 in gConfSkill) {
            var tSkillID = Number(tKey1);
            if (!gConfSkill[tSkillID]) {
                continue;
            }
            this._skillDict[tSkillID] = gConfSkill[tSkillID];
        }
        for (var tKey2 in gConfSkillGroup) {
            var tSkillGroupID = Number(tKey2);
            if (!gConfSkillGroup[tSkillGroupID]) {
                continue;
            }
            this._skillGroupDict[tSkillGroupID] = gConfSkillGroup[tSkillGroupID];
        }
        for (var tKey3 in gConfBuff) {
            var tBuffID = Number(tKey3);
            if (!gConfBuff[tBuffID]) {
                continue;
            }
            this._buffDict[tBuffID] = gConfBuff[tBuffID];
        }
        for (var tKey4 in gConfCombatHeroTemplate) {
            var id = Number(tKey4);
            if (!gConfCombatHeroTemplate[id]) {
                continue;
            }
            this._combat_hero_info[id] = gConfCombatHeroTemplate[id];
        }
        FightConf._inst = this;
    }
    /** 获取技能信息 */
    FightConf.get_skill_info = function (skill_id, skill_lv) {
        // FightSkill.inst.init_skill();
        if (!FightConf._inst) {
            return null;
        }
        if (!FightConf._inst._skillDict) {
            return null;
        }
        skill_lv = skill_lv || 1;
        if (!FightConf._inst._skillDict[skill_id + skill_lv]) {
            return null;
        }
        return FightConf._inst._skillDict[skill_id + skill_lv];
    };
    /** 获取技能组信息 */
    FightConf.get_skill_group = function (group_id) {
        if (!FightConf._inst) {
            return null;
        }
        if (!FightConf._inst._skillGroupDict) {
            return null;
        }
        if (!FightConf._inst._skillGroupDict[group_id]) {
            return null;
        }
        return FightConf._inst._skillGroupDict[group_id];
    };
    /** 获取buff信息 */
    FightConf.get_buff_info = function (buff_id) {
        if (!FightConf._inst) {
            return null;
        }
        if (!FightConf._inst._buffDict) {
            return null;
        }
        if (!FightConf._inst._buffDict[buff_id]) {
            return null;
        }
        return FightConf._inst._buffDict[buff_id];
    };
    /** 获取角色战斗模板信息 */
    FightConf.get_combat_hero_info = function (id) {
        if (!FightConf._inst) {
            return null;
        }
        if (!FightConf._inst._combat_hero_info) {
            return null;
        }
        return FightConf._inst._combat_hero_info[id];
    };
    return FightConf;
}());
exports.FightConf = FightConf;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlnaHRfY29uZi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2NvZGUvZmlnaHQvZmlnaHRfY29uZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUdBLFlBQVk7QUFDWjtJQUFBO1FBQ0ksV0FBVztRQUNGLE9BQUUsR0FBVyxDQUFDLENBQUM7UUFDeEIsV0FBVztRQUNGLFlBQU8sR0FBVyxDQUFDLENBQUM7UUFDN0IsWUFBWTtRQUNILGlCQUFZLEdBQVcsQ0FBQyxDQUFDO1FBQ2xDLGlCQUFpQjtRQUNSLG1CQUFjLEdBQVcsQ0FBQyxDQUFDO1FBQ3BDLFdBQVc7UUFDRixlQUFVLEdBQVcsQ0FBQyxDQUFDO1FBQ2hDLFlBQVk7UUFDSCxnQkFBVyxHQUFXLENBQUMsQ0FBQztRQUNqQyxpQkFBaUI7UUFDUixlQUFVLEdBQVcsQ0FBQyxDQUFDO1FBQ2hDLGFBQWE7UUFDSixpQkFBWSxHQUFXLENBQUMsQ0FBQztRQUNsQyxhQUFhO1FBQ0osa0JBQWEsR0FBVyxDQUFDLENBQUM7UUFDbkMsV0FBVztRQUNGLGdCQUFXLEdBQWtCLEVBQUUsQ0FBQztRQUN6QyxZQUFZO1FBQ0gsbUJBQWMsR0FBa0IsRUFBRSxDQUFDO1FBQzVDLGNBQWM7UUFDTCxxQkFBZ0IsR0FBVyxDQUFDLENBQUM7UUFDdEMsY0FBYztRQUNMLGNBQVMsR0FBVyxDQUFDLENBQUM7UUFDL0Isa0JBQWtCO1FBQ1QsY0FBUyxHQUFXLENBQUMsQ0FBQztRQUMvQixrQkFBa0I7UUFDVCxjQUFTLEdBQVcsQ0FBQyxDQUFDO1FBQy9CLGlCQUFpQjtRQUNSLG1CQUFjLEdBQVcsQ0FBQyxDQUFDO1FBQ3BDLGlCQUFpQjtRQUNSLG1CQUFjLEdBQVcsQ0FBQyxDQUFDO1FBQ3BDLFdBQVc7UUFDRixZQUFPLEdBQVcsQ0FBQyxDQUFDO1FBQzdCLGdCQUFnQjtRQUNQLGVBQVUsR0FBVyxDQUFDLENBQUM7UUFDaEMsWUFBWTtRQUNILHFCQUFnQixHQUFXLENBQUMsQ0FBQztRQUN0QyxZQUFZ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