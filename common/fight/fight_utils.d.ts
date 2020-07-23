/** 所有战斗属性 */
export declare class AttributeType {
    /** 攻击 */
    static ATK: number;
    /** 物防 */
    static DEF: number;
    /** 法防 */
    static MDEF: number;
    /** 生命 */
    static HP: number;
    /** 命中 */
    static HIT: number;
    /** 闪避 */
    static DODGE: number;
    /** 暴击 */
    static CRIT: number;
    /** 韧性 */
    static RESI: number;
    /** 移动速度 */
    static MOVESPEED: number;
    /** 攻击速度 */
    static ATKSPEED: number;
    /** 伤害加成 */
    static HURTADD: number;
    /** 伤害减免 */
    static HURTRED: number;
    /** 暴击伤害 */
    static CRITHURT: number;
    /** 无视防御几率 */
    static IGNDEF: number;
    /** 每5秒回血 */
    static REBLOOD: number;
    /** 掉落道具加成 */
    static DROPITEM: number;
    /** 掉落金币加成 */
    static DROPGOLD: number;
    /** 怒气 */
    static ANGRY: number;
    /** 怒气回复速度 */
    static ANGRYSPEED: number;
    /** 怒气回复速度 */
    static CRITPROB: number;
    /** 怒气回复速度 */
    static RESIPROB: number;
    /** 怒气回复速度 */
    static DODGEPROB: number;
    /** 怒气回复速度 */
    static HITPROB: number;
    /** 怒气回复速度 */
    static MOVESPEEDPERCENT: number;
    /** 怒气回复速度 */
    static ATKSPEEDPERCENT: number;
    /** PVP伤害加成 */
    static PVPDMGINCREASE: number;
    /** PVP伤害减免 */
    static PVPDMGREDUCE: number;
    /** 技能伤害加成 */
    static SKILLDMGINCREASE: number;
    /** 技能伤害减免 */
    static SKILLDMGREDUCE: number;
}
/** 超过最大轮数 */
export declare class OverRound {
    /** 超过 */
    static OVER: number;
    /** 未超过 */
    static SAFE: number;
}
/** 参战者类型 */
export declare class TeamType {
    /** 未初始化 */
    static undefine: string;
    /** 怪物 */
    static monster: string;
    /** 玩家 */
    static user: string;
}
/** 操作类型 */
export declare class ActionType {
    static skill: string;
    static acttack: string;
}
/** 是否为攻击者 */
export declare class AttackerType {
    /** 攻击者 */
    static ATTACKER: number;
    /** 防御者 */
    static DEFENSE: number;
}
/** 释放类型 */
export declare class CastType {
    /** 常规攻击 */
    static DEFAULT: number;
    /** 怒气攻击 */
    static ANGER: number;
    /** 开始战斗释放 */
    static START_BATTLE: number;
}
/** 效果类型 */
export declare class dirType {
    /** 正面效果 */
    static POSITIVE_EFFECT: number;
    /** 负面效果 */
    static NEGATIVE_EFFECT: number;
}
/** 技能效果类型 */
export declare class SkillEffectType {
    /** 无效果 */
    static NULL: number;
    /** 普攻伤害 */
    static DEFAULT_ACT: number;
    /** 治疗技能 */
    static CURE: number;
    /** 复活技能 */
    static RESURRECTION: number;
    /** 技能伤害 */
    static SKILL_ACT: number;
    /** 真实伤害 */
    static REAL_ACT: number;
}
/** 选择目标的方式 */
export declare class SelectTargetType {
    /** 敌方 */
    static target: string;
    /** 友方 */
    static team: string;
    /** 全部 */
    static all: string;
}
/** 额外伤害效果 */
export declare class ExtraDmgType {
    /** 无额外附加伤害 */
    static NONE: number;
    /** 附加固定值 */
    static FIXED_VALUE: number;
    /** 目标生命最大万分比 */
    static MAX_HP_RATE: number;
    /** 目标生命当前万分比 */
    static NOW_HP_RATE: number;
    /** 目标生命损失万分比 */
    static LOSE_HP_RATE: number;
}
/** 驱散类型 */
export declare class DispelType {
    /** 正面效果 */
    static POSITIVE: number;
    /** 负面效果 */
    static NEGATIVE: number;
    /** 所有效果 */
    static ALL: number;
}
/** 这些状态只有死亡与其他互斥,其他均可以叠加(32位) */
export declare class RoleStatusMap {
    /** 死亡 */
    static DEAD: number;
    /** 魅惑 */
    static CONFUSE: number;
    /** 睡眠 */
    static SLEEP: number;
    /** 重生 */
    static REBORN: number;
    /** (禁怒)士气无法增加 */
    static NOPOWER: number;
    /** (沉默)无法施放技能，若士气超过400不会增加士气 */
    static NOSKILL: number;
    /** (缴械)降低攻击力降低百分比 */
    static DECRATTACK: number;
    /** (破甲)防御值降低百分比 */
    static DECRDEFENCE: number;
    /** (蓄力)攻击力提升百分比(可累加) */
    static ACCRATTACK: number;
    /** 攻击力提升百分比 */
    static ADDRATTACK: number;
    /** 闪避率提升百分比 */
    static ADDRMISS: number;
    /** 格挡率提升百分比 */
    static ADDRBLOCK: number;
    /** 暴击率提升百分比 */
    static ADDRCRIT: number;
}
/** 职业种类 */
export declare class soldierKindMap {
    /** 刀 */
    static SWORD: number;
    /** 枪 */
    static SPEAR: number;
    /** 骑 */
    static RIDER: number;
    /** 谋士 */
    static ADVISER: number;
    /** 红颜 */
    static BEAUTY: number;
}
export declare class defRespMap {
    /** 闪避 */
    static MISS: number;
    /** 暴击 */
    static CRIT: number;
    /** 格挡 */
    static BLOCK: number;
    /** 反弹 */
    static REBOUND: number;
    /** 免疫 */
    static IMMUNE: number;
    /** 直接斩杀 */
    static KILL: number;
}
export declare class Camp {
    /** 无阵营 */
    static Default: number;
    /** 蜀 */
    static Shu: number;
    /** 吴 */
    static Wu: number;
    /** 魏 */
    static Wei: number;
    /** 群雄 */
    static Other: number;
}
export declare class ActionStep {
    /** 回合前 */
    static Before: number;
    /** 伤害计算前 */
    static BeforeDamage: number;
    /** 伤害计算后 */
    static AfterDamage: number;
    /** 回合后 */
    static After: number;
}
/** 目标类型 */
export declare class TargetType {
    /** 友方 */
    static friend: string;
    /** 敌方 */
    static enemy: string;
    /** 所有 */
    static all: string;
}
/** 寻敌方式 */
export declare class FindTargetWay {
    /** 优先前排 */
    static front_row: number;
    /** 优先后排 */
    static back_row: number;
    /** 剩余hp百分比 由低到高 */
    static hp_hight: number;
    /** 剩余hp百分比 由高到低 */
    static hp_lower: number;
    /** 剩余怒气百分比 由低到高 */
    static mp_hight: number;
    /** 剩余怒气百分比 由高到低 */
    static mp_lower: number;
    /** 完全随机 */
    static random: number;
}
/** 队伍中站位信息 */
export declare class SlotInfo {
    /** 前排站位列表 */
    static FRONT_SLOT_LIST: Array<number>;
}
export declare class FightUtils {
    /** 战斗最大轮数 */
    static maxRound: number;
    /** 最大站位数量 */
    static maxPos: number;
    static searchSequence: {
        [index: string]: Array<number>;
    };
    static rowSequence: {
        [index: string]: Array<number>;
    };
    static colSequence: {
        [index: string]: Array<number>;
    };
    /** 获取位置的周边位置 */
    static getRoundPosArr: (pos: number) => number[];
    /** 是否是红颜作用于己方的技能 */
    static isBeautyForSelfSkill(soldierKind: number, skillId: number): boolean;
    /** 是否是群攻技能 */
    static isGroupAttackSkill(soldierKind: number, skillId: number): boolean;
    /** 计算兵种克制伤害系数 */
    static getSoldierRestrainDamageFactor(atkSoldierKind: number, defSoldierKind: number): number;
    /** 在[from, to)内随机, factor修正系数，比如0.8表示随机到较小数字的概念为80%，默认为0.7 */
    static correctionalRandRange(from: number, to: number, factor?: number): number;
    static objectForEach(obj: any, callback: (key: string, value: any) => boolean): void;
    /**  */
    static randArray(arr: Array<number>): number;
    /**  [from, to] */
    static randRange(from: number, to: number): number;
}
