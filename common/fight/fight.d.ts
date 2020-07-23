import { SkillGroup, AttrDict, BagHeroData } from "./fight_conf";
import { FightRole, FightPos } from "./fight_role";
import { FightTeam } from "./fight_team";
/** 战斗成员信息 */
export declare class FightRoleStatus {
    /** 角色buff {[index:buff_id]:{1:剩余回合 ,2:叠加层数}} */
    0: {
        [index: string]: {
            1: number;
            2: number;
        };
    };
    /** 本次被攻击后剩余血量 */
    1: number;
    /** 本次被攻击后所受伤害 */
    2: number;
    /** 本次被攻击后剩余士气 */
    3: number;
    /** 防守方的状态：2：闪避、 3：暴击、 4：格挡、 5：反弹  6、免疫  7、直接斩杀   */
    4: number;
    /** 实际变化的血量(扣血为负数。比如最后一击，扣多少血就死掉。这个跟前端血条显示相关) */
    5: number;
    /** 吸血  0，为不吸血，非0为吸血（如果受到伤害 先 -50 在 吸血20 最后受30伤） */
    6: number;
    constructor(fight_role: FightRole);
    /** 通过角色信息获取新的buff列表和剩余hp */
    refBuffAndHPByFightRole(fight_role: FightRole): void;
}
export declare class ActionInfo {
    /** 是否为发起攻击的队伍 */
    is_attacker: number;
    /** 效果发起者位置 */
    atk_pos: FightPos;
    /** 效果目标者位置 */
    def_pos: Array<FightPos>;
    atk_status: {
        [team_id: string]: {
            [team_pos: number]: FightRoleStatus;
        };
    };
    def_status: {
        [team_id: string]: {
            [team_pos: number]: FightRoleStatus;
        };
    };
    /** 效果对应id  技能、buff */
    attack_id: number;
    /** 攻击方式 */
    attack_type: number;
    status: {
        round: number;
        powerDamageFactor: number;
        skillDamageFactor: number;
        critDamageRate: number;
    };
    constructor(atk_pos: FightPos, def_pos: Array<FightPos>, round: number);
}
/** 战报信息 */
export declare class BattleReport {
    success: number;
    /** 每一轮中的action列表 */
    rounds: {
        [round: number]: Array<ActionInfo>;
    };
    atk_headpic: string;
    atk_name: string;
    atk_team_health: number;
    atk_remain_health: number;
    atk_team: {
        [pos: number]: {
            id: number;
            level: number;
            power: number;
            health: number;
            awake: number;
            skill: SkillGroup | null;
        };
    };
    def_headpic: string;
    def_name: string;
    def_team_health: number;
    def_remain_health: number;
    def_team: {
        [pos: number]: {
            id: number;
            level: number;
            power: number;
            health: number;
            awake: number;
            skill: SkillGroup | null;
        };
    };
    /** 战斗结束后上阵英雄剩余血量 {[英雄ID:剩余血量]} */
    atk_health_map: {
        [rid: number]: number;
    };
    def_health_map: {
        [rid: number]: number;
    };
    /** 超过最大回合数限制 1-超过 0-未超过 */
    over_rounds: number;
    /** 战报 */
    constructor(atk_team: FightTeam, def_team: FightTeam);
}
/**
 * 获取战斗队伍信息 (玩家)
 * @param is_attacker       是否为攻击发起者
 * @param team              对应队伍信息                              {[team_pos:队伍中的位置]:背包中的位置}
 * @param hero_dict          玩家角色背包信息                         {[team_pos:队伍中的位置]:角色信息}
 * @param attr_dict         各个英雄 功能附加的属性（不包含技能的)      {[team_pos:队伍中的位置]:属性结构体}
 * @param fight_force_dict  各个英雄 对应战力                         {[team_pos:队伍中的位置]:对应的战力}
 */
export declare function getPlayerTeam(is_attacker: boolean, team: {
    [team_pos: number]: number;
}, hero_dict: {
    [team_pos: number]: BagHeroData;
}, attr_dict: {
    [team_pos: number]: AttrDict;
}, fight_force_dict: {
    [team_pos: number]: number;
}): FightTeam;
/**
 * 获取战报
 * @param atk_team          攻击者队伍信息
 * @param def_team          防御者队伍信息
 * @param options           附加参数
 */
export declare function fight(atk_team: FightTeam, def_team: FightTeam, options?: {
    firstMove?: boolean;
}): BattleReport | undefined;
export declare class Fight {
    private _fight_skill;
    private static _inst;
    static get inst(): Fight | null;
    /**
     * 初始化战斗模块 ，将配置表传入
     * @param gConfSkill
     * @param gConfSkillGroup
     * @param gConfBuff
     * @param gConfCombatHeroTemplate
     */
    constructor(gConfSkill: any, gConfSkillGroup: any, gConfBuff: any, gConfCombatHeroTemplate: any);
    /** 排列出是出手顺序 */
    private sort_role_list;
    fight(atk_team: FightTeam, def_team: FightTeam, options?: {
        firstMove?: boolean;
    }): BattleReport;
    /** 战斗开始前处理技能效果 */
    private doPassiveSkillOnStart;
    /** 处理战斗全局状态 */
    private processFightStatus;
    /** 当前轮 战前处理 */
    private doPreAction;
    /** 当前轮 战后处理 */
    private doAfterAction;
    /** 获取目标的pos [{pos:number ,is_self:boolean}] */
    private getTargetPos;
    /** 战斗前处理所有的被动技能 */
    private doPassiveSkillOnBeforeAction;
    /**
     * 获取角色在此回合说需要做的操作
     * @param round             当前回合数
     * @param fight_role        进行行动的角色
     * @param team_dict          行动角色所在队伍
     * @param def_team          行动角色敌对队伍
     * @returns ActionInfo
     */
    private doAction;
}
