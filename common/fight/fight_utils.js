"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** 所有战斗属性 */
var AttributeType = /** @class */ (function () {
    function AttributeType() {
    }
    /** 攻击 */
    AttributeType.ATK = 1;
    /** 物防 */
    AttributeType.DEF = 2;
    /** 法防 */
    AttributeType.MDEF = 3;
    /** 生命 */
    AttributeType.HP = 4;
    /** 命中 */
    AttributeType.HIT = 5;
    /** 闪避 */
    AttributeType.DODGE = 6;
    /** 暴击 */
    AttributeType.CRIT = 7;
    /** 韧性 */
    AttributeType.RESI = 8;
    /** 移动速度 */
    AttributeType.MOVESPEED = 9;
    /** 攻击速度 */
    AttributeType.ATKSPEED = 10;
    /** 伤害加成 */
    AttributeType.HURTADD = 11;
    /** 伤害减免 */
    AttributeType.HURTRED = 12;
    /** 暴击伤害 */
    AttributeType.CRITHURT = 13;
    /** 无视防御几率 */
    AttributeType.IGNDEF = 14;
    /** 每5秒回血 */
    AttributeType.REBLOOD = 15;
    /** 掉落道具加成 */
    AttributeType.DROPITEM = 16;
    /** 掉落金币加成 */
    AttributeType.DROPGOLD = 17;
    /** 怒气 */
    AttributeType.ANGRY = 18;
    /** 怒气回复速度 */
    AttributeType.ANGRYSPEED = 19;
    /** 怒气回复速度 */
    AttributeType.CRITPROB = 20;
    /** 怒气回复速度 */
    AttributeType.RESIPROB = 21;
    /** 怒气回复速度 */
    AttributeType.DODGEPROB = 22;
    /** 怒气回复速度 */
    AttributeType.HITPROB = 23;
    /** 怒气回复速度 */
    AttributeType.MOVESPEEDPERCENT = 24;
    /** 怒气回复速度 */
    AttributeType.ATKSPEEDPERCENT = 25;
    /** PVP伤害加成 */
    AttributeType.PVPDMGINCREASE = 26;
    /** PVP伤害减免 */
    AttributeType.PVPDMGREDUCE = 27;
    /** 技能伤害加成 */
    AttributeType.SKILLDMGINCREASE = 28;
    /** 技能伤害减免 */
    AttributeType.SKILLDMGREDUCE = 29;
    return AttributeType;
}());
exports.AttributeType = AttributeType;
;
/** 超过最大轮数 */
var OverRound = /** @class */ (function () {
    function OverRound() {
    }
    /** 超过 */
    OverRound.OVER = 1;
    /** 未超过 */
    OverRound.SAFE = 0;
    return OverRound;
}());
exports.OverRound = OverRound;
/** 参战者类型 */
var TeamType = /** @class */ (function () {
    function TeamType() {
    }
    /** 未初始化 */
    TeamType.undefine = "undefine";
    /** 怪物 */
    TeamType.monster = "monster";
    /** 玩家 */
    TeamType.user = "user";
    return TeamType;
}());
exports.TeamType = TeamType;
/** 操作类型 */
var ActionType = /** @class */ (function () {
    function ActionType() {
    }
    ActionType.skill = "skill";
    ActionType.acttack = "acttack";
    return ActionType;
}());
exports.ActionType = ActionType;
/** 是否为攻击者 */
var AttackerType = /** @class */ (function () {
    function AttackerType() {
    }
    /** 攻击者 */
    AttackerType.ATTACKER = 0;
    /** 防御者 */
    AttackerType.DEFENSE = 1;
    return AttackerType;
}());
exports.AttackerType = AttackerType;
/** 释放类型 */
var CastType = /** @class */ (function () {
    function CastType() {
    }
    /** 常规攻击 */
    CastType.DEFAULT = 0;
    /** 怒气攻击 */
    CastType.ANGER = 1;
    /** 开始战斗释放 */
    CastType.START_BATTLE = 2;
    return CastType;
}());
exports.CastType = CastType;
/** 效果类型 */
var dirType = /** @class */ (function () {
    function dirType() {
    }
    /** 正面效果 */
    dirType.POSITIVE_EFFECT = 1;
    /** 负面效果 */
    dirType.NEGATIVE_EFFECT = 2;
    return dirType;
}());
exports.dirType = dirType;
/** 技能效果类型 */
var SkillEffectType = /** @class */ (function () {
    function SkillEffectType() {
    }
    /** 无效果 */
    SkillEffectType.NULL = 0;
    /** 普攻伤害 */
    SkillEffectType.DEFAULT_ACT = 1;
    /** 治疗技能 */
    SkillEffectType.CURE = 2;
    /** 复活技能 */
    SkillEffectType.RESURRECTION = 3;
    /** 技能伤害 */
    SkillEffectType.SKILL_ACT = 4;
    /** 真实伤害 */
    SkillEffectType.REAL_ACT = 5;
    return SkillEffectType;
}());
exports.SkillEffectType = SkillEffectType;
/** 选择目标的方式 */
var SelectTargetType = /** @class */ (function () {
    function SelectTargetType() {
    }
    /** 敌方 */
    SelectTargetType.target = "enemy";
    /** 友方 */
    SelectTargetType.team = "friend";
    /** 全部 */
    SelectTargetType.all = "all";
    return SelectTargetType;
}());
exports.SelectTargetType = SelectTargetType;
/** 额外伤害效果 */
var ExtraDmgType = /** @class */ (function () {
    function ExtraDmgType() {
    }
    /** 无额外附加伤害 */
    ExtraDmgType.NONE = 0;
    /** 附加固定值 */
    ExtraDmgType.FIXED_VALUE = 100;
    /** 目标生命最大万分比 */
    ExtraDmgType.MAX_HP_RATE = 200;
    /** 目标生命当前万分比 */
    ExtraDmgType.NOW_HP_RATE = 300;
    /** 目标生命损失万分比 */
    ExtraDmgType.LOSE_HP_RATE = 400;
    return ExtraDmgType;
}());
exports.ExtraDmgType = ExtraDmgType;
/** 驱散类型 */
var DispelType = /** @class */ (function () {
    function DispelType() {
    }
    /** 正面效果 */
    DispelType.POSITIVE = 1;
    /** 负面效果 */
    DispelType.NEGATIVE = 2;
    /** 所有效果 */
    DispelType.ALL = 3;
    return DispelType;
}());
exports.DispelType = DispelType;
/** 这些状态只有死亡与其他互斥,其他均可以叠加(32位) */
var RoleStatusMap = /** @class */ (function () {
    function RoleStatusMap() {
    }
    /** 死亡 */
    RoleStatusMap.DEAD = 1;
    /** 魅惑 */
    RoleStatusMap.CONFUSE = 1 << 1;
    /** 睡眠 */
    RoleStatusMap.SLEEP = 1 << 2;
    /** 重生 */
    RoleStatusMap.REBORN = 1 << 7;
    /** (禁怒)士气无法增加 */
    RoleStatusMap.NOPOWER = 1 << 10;
    /** (沉默)无法施放技能，若士气超过400不会增加士气 */
    RoleStatusMap.NOSKILL = 1 << 11;
    /** (缴械)降低攻击力降低百分比 */
    RoleStatusMap.DECRATTACK = 1 << 12;
    /** (破甲)防御值降低百分比 */
    RoleStatusMap.DECRDEFENCE = 1 << 13;
    /** (蓄力)攻击力提升百分比(可累加) */
    RoleStatusMap.ACCRATTACK = 1 << 14;
    /** 攻击力提升百分比 */
    RoleStatusMap.ADDRATTACK = 1 << 15;
    /** 闪避率提升百分比 */
    RoleStatusMap.ADDRMISS = 1 << 16;
    /** 格挡率提升百分比 */
    RoleStatusMap.ADDRBLOCK = 1 << 17;
    /** 暴击率提升百分比 */
    RoleStatusMap.ADDRCRIT = 1 << 18;
    return RoleStatusMap;
}());
exports.RoleStatusMap = RoleStatusMap;
;
/** 职业种类 */
var soldierKindMap = /** @class */ (function () {
    function soldierKindMap() {
    }
    /** 刀 */
    soldierKindMap.SWORD = 1;
    /** 枪 */
    soldierKindMap.SPEAR = 2;
    /** 骑 */
    soldierKindMap.RIDER = 3;
    /** 谋士 */
    soldierKindMap.ADVISER = 4;
    /** 红颜 */
    soldierKindMap.BEAUTY = 5;
    return soldierKindMap;
}());
exports.soldierKindMap = soldierKindMap;
;
var defRespMap = /** @class */ (function () {
    function defRespMap() {
    }
    /** 闪避 */
    defRespMap.MISS = 2;
    /** 暴击 */
    defRespMap.CRIT = 3;
    /** 格挡 */
    defRespMap.BLOCK = 4;
    /** 反弹 */
    defRespMap.REBOUND = 5;
    /** 免疫 */
    defRespMap.IMMUNE = 6;
    /** 直接斩杀 */
    defRespMap.KILL = 7;
    return defRespMap;
}());
exports.defRespMap = defRespMap;
;
/* 武将阵营 */
var Camp = /** @class */ (function () {
    function Camp() {
    }
    /** 无阵营 */
    Camp.Default = 0;
    /** 蜀 */
    Camp.Shu = 1;
    /** 吴 */
    Camp.Wu = 2;
    /** 魏 */
    Camp.Wei = 3;
    /** 群雄 */
    Camp.Other = 4;
    return Camp;
}());
exports.Camp = Camp;
/* 战斗回合步骤 */
var ActionStep = /** @class */ (function () {
    function ActionStep() {
    }
    /** 回合前 */
    ActionStep.Before = 1;
    /** 伤害计算前 */
    ActionStep.BeforeDamage = 2;
    /** 伤害计算后 */
    ActionStep.AfterDamage = 3;
    /** 回合后 */
    ActionStep.After = 4;
    return ActionStep;
}());
exports.ActionStep = ActionStep;
/** 目标类型 */
var TargetType = /** @class */ (function () {
    function TargetType() {
    }
    /** 友方 */
    TargetType.friend = "friend";
    /** 敌方 */
    TargetType.enemy = "enemy";
    /** 所有 */
    TargetType.all = "all";
    return TargetType;
}());
exports.TargetType = TargetType;
/** 寻敌方式 */
var FindTargetWay = /** @class */ (function () {
    function FindTargetWay() {
    }
    /** 优先前排 */
    FindTargetWay.front_row = 0;
    /** 优先后排 */
    FindTargetWay.back_row = 1;
    /** 剩余hp百分比 由低到高 */
    FindTargetWay.hp_hight = 2;
    /** 剩余hp百分比 由高到低 */
    FindTargetWay.hp_lower = 3;
    /** 剩余怒气百分比 由低到高 */
    FindTargetWay.mp_hight = 4;
    /** 剩余怒气百分比 由高到低 */
    FindTargetWay.mp_lower = 5;
    /** 完全随机 */
    FindTargetWay.random = 10;
    return FindTargetWay;
}());
exports.FindTargetWay = FindTargetWay;
/** 队伍中站位信息 */
var SlotInfo = /** @class */ (function () {
    function SlotInfo() {
    }
    /** 前排站位列表 */
    SlotInfo.FRONT_SLOT_LIST = [1, 2];
    return SlotInfo;
}());
exports.SlotInfo = SlotInfo;
var FightUtils = /** @class */ (function () {
    function FightUtils() {
    }
    /** 是否是红颜作用于己方的技能 */
    FightUtils.isBeautyForSelfSkill = function (soldierKind, skillId) {
        return (soldierKindMap.BEAUTY == soldierKind) && (5 == skillId || 3 == skillId);
    };
    /** 是否是群攻技能 */
    FightUtils.isGroupAttackSkill = function (soldierKind, skillId) {
        switch (soldierKind) {
            case soldierKindMap.SPEAR: return (1 == skillId);
            case soldierKindMap.RIDER: return (3 == skillId);
            case soldierKindMap.ADVISER: return (3 == skillId);
            default: return false;
        }
        return false;
    };
    /** 计算兵种克制伤害系数 */
    FightUtils.getSoldierRestrainDamageFactor = function (atkSoldierKind, defSoldierKind) {
        var factor = 1.0;
        if (atkSoldierKind == soldierKindMap.SWORD) {
            if (defSoldierKind == soldierKindMap.SPEAR ||
                defSoldierKind == soldierKindMap.ADVISER ||
                defSoldierKind == soldierKindMap.BEAUTY) {
                factor = 1.2;
            }
            else if (defSoldierKind == soldierKindMap.RIDER) {
                factor = 0.8;
            }
        }
        else if (atkSoldierKind == soldierKindMap.SPEAR) {
            if (defSoldierKind == soldierKindMap.RIDER ||
                defSoldierKind == soldierKindMap.ADVISER ||
                defSoldierKind == soldierKindMap.BEAUTY) {
                factor = 1.2;
            }
            else if (defSoldierKind == soldierKindMap.SWORD) {
                factor = 0.8;
            }
        }
        else if (atkSoldierKind == soldierKindMap.RIDER) {
            if (defSoldierKind == soldierKindMap.SWORD ||
                defSoldierKind == soldierKindMap.ADVISER ||
                defSoldierKind == soldierKindMap.BEAUTY) {
                factor = 1.2;
            }
            else if (defSoldierKind == soldierKindMap.SPEAR) {
                factor = 0.8;
            }
        }
        else if (atkSoldierKind == soldierKindMap.ADVISER) {
            if (defSoldierKind == soldierKindMap.SWORD ||
                defSoldierKind == soldierKindMap.SPEAR ||
                defSoldierKind == soldierKindMap.RIDER) {
                factor = 1.2;
            }
        }
        else if (atkSoldierKind == soldierKindMap.BEAUTY) {
            if (defSoldierKind == soldierKindMap.SWORD ||
                defSoldierKind == soldierKindMap.SPEAR ||
                defSoldierKind == soldierKindMap.RIDER) {
                factor = 1.2;
            }
        }
        return factor;
    };
    /** 在[from, to)内随机, factor修正系数，比如0.8表示随机到较小数字的概念为80%，默认为0.7 */
    FightUtils.correctionalRandRange = function (from, to, factor) {
        if (factor === void 0) { factor = 0; }
        factor = factor || 0.7;
        var randValue = Math.random();
        if (randValue < factor) {
            randValue = randValue * 0.5 / factor;
        }
        else {
            randValue = 0.5 + 0.5 * (randValue - factor) / (1 - factor);
        }
        return from + Math.floor((to - from + 1) * randValue);
    };
    /*
     @brief 遍历对象无数
     @param obj 要遍历的对象
     @param callback 每个元素的处理回调，参数为对象的(key, value)，返回错误信息后停止遍历；
     */
    FightUtils.objectForEach = function (obj, callback) {
        if (!obj)
            return;
        var keys = Object.keys(obj);
        for (var i = 0, len = keys.length; i < len; ++i) {
            var k = keys[i];
            if (callback(k, obj[k]))
                break;
        }
    };
    /**  */
    FightUtils.randArray = function (arr) {
        return arr[FightUtils.randRange(0, arr.length - 1)];
    };
    /**  [from, to] */
    FightUtils.randRange = function (from, to) {
        return from + Math.floor(Math.random() * (to - from + 1));
    };
    /** 战斗最大轮数 */
    FightUtils.maxRound = 15;
    /** 最大站位数量 */
    FightUtils.maxPos = 9;
    FightUtils.searchSequence = {
        '0': [0, 3, 6, 1, 4, 7, 2, 5, 8],
        '1': [1, 4, 7, 0, 3, 6, 2, 5, 8],
        '2': [2, 5, 8, 1, 4, 7, 0, 3, 6],
    };
    FightUtils.rowSequence = {
        '0': [0, 1, 2],
        '1': [3, 4, 5],
        '2': [6, 7, 8],
    };
    FightUtils.colSequence = {
        '0': [0, 3, 6],
        '1': [1, 4, 7],
        '2': [2, 5, 8],
    };
    /** 获取位置的周边位置 */
    FightUtils.getRoundPosArr = function (pos) {
        switch (pos) {
            case 0: return [1, 3];
            case 1: return [0, 2, 4];
            case 2: return [1, 5];
            case 3: return [0, 4, 6];
            case 4: return [1, 3, 5, 7];
            case 5: return [2, 4, 8];
            case 6: return [3, 7];
            case 7: return [4, 6, 8];
            case 8: return [5, 7];
            default: return [];
        }
    };
    return FightUtils;
}());
exports.FightUtils = FightUtils;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlnaHRfdXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9jb2RlL2ZpZ2h0L2ZpZ2h0X3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUEsYUFBYTtBQUNiO0lBQUE7SUEyREEsQ0FBQztJQTFERyxTQUFTO0lBQ0YsaUJBQUcsR0FBRyxDQUFDLENBQUM7SUFDZixTQUFTO0lBQ0YsaUJBQUcsR0FBRyxDQUFDLENBQUM7SUFDZixTQUFTO0lBQ0Ysa0JBQUksR0FBRyxDQUFDLENBQUM7SUFDaEIsU0FBUztJQUNGLGdCQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ2QsU0FBUztJQUNGLGlCQUFHLEdBQUcsQ0FBQyxDQUFDO0lBQ2YsU0FBUztJQUNGLG1CQUFLLEdBQUcsQ0FBQyxDQUFDO0lBQ2pCLFNBQVM7SUFDRixrQkFBSSxHQUFHLENBQUMsQ0FBQztJQUNoQixTQUFTO0lBQ0Ysa0JBQUksR0FBRyxDQUFDLENBQUM7SUFDaEIsV0FBVztJQUNKLHVCQUFTLEdBQUcsQ0FBQyxDQUFDO0lBQ3JCLFdBQVc7SUFDSixzQkFBUSxHQUFHLEVBQUUsQ0FBQztJQUNyQixXQUFXO0lBQ0oscUJBQU8sR0FBRyxFQUFFLENBQUM7SUFDcEIsV0FBVztJQUNKLHFCQUFPLEdBQUcsRUFBRSxDQUFDO0lBQ3BCLFdBQVc7SUFDSixzQkFBUSxHQUFHLEVBQUUsQ0FBQztJQUNyQixhQUFhO0lBQ04sb0JBQU0sR0FBRyxFQUFFLENBQUM7SUFDbkIsWUFBWTtJQUNMLHFCQUFPLEdBQUcsRUFBRSxDQUFDO0lBQ3BCLGFBQWE7SUFDTixzQkFBUSxHQUFHLEVBQUUsQ0FBQztJQUNyQixhQUFhO0lBQ04sc0JBQVEsR0FBRyxFQUFFLENBQUM7SUFDckIsU0FBUztJQUNGLG1CQUFLLEdBQUcsRUFBRSxDQUFDO0lBQ2xCLGFBQWE7SUFDTix3QkFBVSxHQUFHLEVBQUUsQ0FBQztJQUN2QixhQUFhO0lBQ04sc0JBQVEsR0FBRyxFQUFFLENBQUM7SUFDckIsYUFB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