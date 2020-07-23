/** 技能组配置 */
export declare class BuffInfo {
    /** 索引ID */
    readonly id: number;
    /** 正面效果 */
    readonly dirType: number;
    /** 不可被驱散 */
    readonly cannotDispel: number;
    /** 是否受到负面抗性影响 */
    readonly buffResistance: number;
    /** 效果类型 */
    readonly effectType: number;
    /** 效果固定值 */
    readonly effectFixed: number;
    /** 效果系数(万分比)	 */
    readonly effectCoef: number;
    /** 额外伤害效果 */
    readonly extraDmgType: number;
    /** 额外伤害参数 */
    readonly extraDmgValue: number;
    /** 属性修改 */
    readonly attributeId: Array<number>;
    /** 属性值修改 */
    readonly attributeValue: Array<number>;
    /** 攻击吸血万分比 */
    readonly suckBloodPercent: number;
    /** 攻击吸血固定值 */
    readonly suckBlood: number;
    /** 免疫负面物理伤害万分比 */
    readonly immnuePhy: number;
    /** 免疫负面技能伤害万分比 */
    readonly immnueMag: number;
    /** 免疫负面物理伤害次数 */
    readonly ignorePhyTimes: number;
    /** 免疫负面技能伤害次数 */
    readonly ignoreMagTimes: number;
    /** 限制行动 */
    readonly banMove: number;
    /** 反弹物理伤害万分比 */
    readonly reboundDmg: number;
    /** 改变技能组 */
    readonly changeSkillGroup: number;
    /** 变身资源名 */
    readonly reUrl: string;
    /** 变身资源类型 */
    readonly reType: number;
    /** 变身后缩放百分比 */
    readonly reScale: number;
    /** buff特效资源 */
    readonly buffRes: string;
    /** buff特效类型(1只显示一次, 2循环特效) */
    readonly buffResType: number;
    /** buff特效挂载点(1上2中3下) */
    readonly buffPos: number;
    /** buff特效渲染层级(1上2下) */
    readonly buffZorder: number;
    /** buff位置偏移 */
    readonly buffOffsetX: number;
    /** buff位置偏移1 */
    readonly buffOffsetY: number;
    /** buff特效资源1 */
    readonly buffRes2: string;
    /** buff特效类型(1只显示一次, 2循环特效)1 */
    readonly buffResType2: number;
    /** buff特效挂载点(1上2中3下)1 */
    readonly buffPos2: number;
    /** buff特效渲染层级(1上2下)1	 */
    readonly buffZorder2: number;
    /** buff位置偏移2 */
    readonly buffOffsetX2: number;
    /** buff位置偏移3 */
    readonly buffOffsetY2: number;
    /** 是否显示数字 */
    readonly showNum: number;
}
/** 技能组配置 */
export declare class SkillGroup {
    /** 技能组id */
    readonly id: number;
    /** 普攻技能 */
    readonly baseSkill: number;
    /** 怒气技能 */
    readonly angerSkill: number;
    /** 怒气技能所需怒气点 */
    readonly angerSkillLimit: number;
}
/** 技能信息 */
export declare class SkillInfo {
    /** 技能Id */
    readonly skillId: number;
    /** 技能名称 */
    readonly name: string;
    /** 释放类型 */
    readonly castType: number;
    /** 施法动作 */
    readonly action: string;
    /** 释放音效 */
    readonly castSount: string;
    /** 选择目标类型 */
    readonly targetType: string;
    /** 优先选中自己 */
    readonly isSelfFirst: boolean;
    /** 寻找目标方式 */
    readonly findTargetWay: number;
    /** 范围选择目标最大个数 */
    readonly targetMaxNum: number;
    /** 子弹Id */
    readonly bulletId: number;
    /** 子弹延迟发射（ms） */
    readonly bulletDelay: number;
    /** 子弹数量 */
    readonly bulletNum: number;
    /** 子弹间隔时间毫秒 */
    readonly bulletInterval: number;
    /** 子弹发射类型 */
    readonly bulletType: number;
    /** 技能受击音效 */
    readonly hitSoundEffect: string;
    /** 受击特效 */
    readonly hspeRes: string;
    /** 受击特效挂点 */
    readonly hspePos: string;
    /** 受击特效渲染层级 */
    readonly affectedZorder: number;
    /** 技能特效 */
    readonly speId: string;
    /** 特效循环次数 */
    readonly effectsTimes: number;
    /** 效果产生次数 */
    readonly effectTimes: number;
    /** 效果产生延迟时间 */
    readonly effectDelay: number;
    /** 效果产生间隔 */
    readonly effectInterval: number;
    /** 效果类型 */
    readonly effectType: number;
    /** 正面效果 */
    readonly dirType: number;
    /** 效果固定值 */
    readonly effectFixed: number;
    /** 效果系数[万分比] */
    readonly effectCoef: number;
    /** 额外伤害类型 */
    readonly extraDmgType: number;
    /** 额外伤害值 */
    readonly extraDmgValue: number;
    /** 是否显示数字 */
    readonly showNum: number;
    /** 是否受技能暴击率影响 */
    readonly canSkillCrit: number;
    /** 是否无视闪避 */
    readonly ignoreDodge: number;
    /** 无视护甲万分比 */
    readonly ignoreArmor: number;
    /** 附加暴击率万分比 */
    readonly addCrit: number;
    /** 附加吸血万分比 */
    readonly suckBloodPercent: number;
    /** 附加吸血固定值 */
    readonly suckBlood: number;
    /** 抽怒万分比 */
    readonly suckMpPercent: number;
    /** 消怒万分比 〉0时减少目标怒气 〈0时恢复目标怒气 */
    readonly burnMpPercent: number;
    /** 驱散效果 */
    readonly dispel: number;
    /** 屏幕震动时间毫秒(只支持近战或者bulletType为2的技能) */
    readonly shakeTime: number;
    /** 震动强度横向 */
    readonly shakeX: number;
    /** 震动强度纵向 */
    readonly shakeY: number;
    /** 产生的buff */
    readonly buffId: number;
    /** BUFF生效几率（万分比） */
    readonly buffOdds: number;
    /** BUFF持续时间（毫秒） */
    readonly buffTime: number;
    /** 施放者BUFF */
    readonly ownerBuffId: number;
    /** 释放者BUFF生效几率（万分比） */
    readonly ownerBuffOdds: number;
    /** 释放者BUFF持续时间（毫秒） */
    readonly ownerBuffTime: number;
    /** 技能icon */
    readonly icon: string;
    /** 技能描述 */
    readonly desc: string;
    /** 技能参数 */
    readonly descPara: string;
    /** 最小选择数量 */
    readonly targetMinNum: number;
}
export declare class HeroInfo {
    /**模板ID */
    readonly id: number;
    /** 模型ID */
    readonly modelId: number;
    /** 英雄名称 */
    readonly heroName: string;
    /** 阵营(1-魏，2-蜀，3-吴，4-群雄) */
    readonly camp: number;
    /** 定位(1-物攻，2-法攻，3-防御，4-辅助) */
    readonly ability: number;
    /** 基础品质 */
    readonly quality: number;
    /** 基础星级 */
    readonly starBase: number;
    /** 突破类型 */
    readonly rebornType: number;
    /** 基础攻击系数 */
    readonly atkC: number;
    /** 基础防御系数 */
    readonly defC: number;
    /** 基础生命系数 */
    readonly hpC: number;
    /** 基础速度系数 */
    readonly speedC: number;
    /** 天赋组ID */
    readonly innateGroup: number;
    /** 技能组ID */
    readonly skillGroupId: number;
    /** 技能效果名称1 */
    readonly skillEffectName1: string;
    /** 技能效果描述1 */
    readonly skillEffectDesc1: string;
    /** 技能效果名称2 */
    readonly skillEffectName2: string;
    /** 技能效果描述2 */
    readonly skillEffectDesc2: string;
}
/** 角色在背包中的信息 */
export declare class BagHeroData {
    /** 在背包中的索引 */
    bag_pos: number;
    /** 角色模板id */
    rid: number;
    awake: number;
    tier: number;
    /** 角色等级 */
    level: number;
    /** 角色装备列表 {[pos:装备部位]:装备id} */
    equip: {
        [pos: number]: number;
    };
}
/** 属性结构 */
export declare class AttrDict {
    [attr_id: string]: number;
}
/** 战斗相关配置 */
export declare class FightConf {
    private static _inst;
    /**
     * 初始化配置
     * @param gConfSkill                技能信息配置
     * @param gConfSkillGroup           技能组配置
     * @param gConfBuff                 buff配置
     * @param gConfCombatHeroTemplate   角色模板配置
     */
    constructor(gConfSkill: any, gConfSkillGroup: any, gConfBuff: any, gConfCombatHeroTemplate: any);
    private _skillDict;
    /** 获取技能信息 */
    static get_skill_info(skill_id: number, skill_lv: number): SkillInfo | null;
    private _skillGroupDict;
    /** 获取技能组信息 */
    static get_skill_group(group_id: number): SkillGroup | null;
    private _buffDict;
    /** 获取buff信息 */
    static get_buff_info(buff_id: number): BuffInfo | null;
    private _combat_hero_info;
    /** 获取角色战斗模板信息 */
    static get_combat_hero_info(id: number): HeroInfo | null;
}
