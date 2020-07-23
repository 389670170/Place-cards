import { HeroInfo, BagHeroData, AttrDict, SkillGroup } from "./fight_conf";
/** 角色位置信息 */
export declare class FightPos {
    /** 队伍id */
    team_id: string;
    /** 队伍中的位置 */
    team_pos: number;
}
/** 战斗角色信息 */
export declare class FightRole {
    /**  英雄模板ID */
    id: number;
    /** 队伍id */
    team_id: string;
    /** 角色在队伍中位置 */
    team_pos: number;
    /**  英雄等级 */
    level: number;
    /**  战斗力 */
    fightForce: number;
    /** 进入战斗时的属性 */
    readonly base_attr: AttrDict;
    /** BUFF当前增加属性 */
    private _buff_attr;
    /** 当前生命 */
    private _now_hp;
    /** 当前怒气 */
    private _now_mp;
    /** 角色已经行动过的轮数 */
    private _round;
    /** 当前buff列表  {[buff_id:buff的id]:{round:剩余回合数 ,count:叠加层数}}*/
    buff_list: {
        [buff_id: string]: {
            round: number;
            count: number;
        };
    };
    /**  技能组信息 */
    skill_group: SkillGroup | null;
    /** 技能对应等级 */
    skill_level_dict: {
        [skill_id: number]: number;
    };
    /** 重生信息 */
    reborn: {
        health: number;
        power: number;
    } | null;
    /** 觉醒等级 */
    awake: number;
    /** 死亡次数 */
    deadTimes: number;
    /** 技能释放次数 */
    skillTimes: number;
    /** 等待添加的BUFF */
    pendBufs: Array<Array<string | number>>;
    /** 获取在战报中应该处于的位置 */
    get fight_pos(): FightPos;
    /**
     * 战斗成员信息
     * @param attr
     */
    constructor(team_id: string, team_pos: number, attr: AttrDict);
    set round(value: number);
    /** 获取角色当前经过的回合数 */
    get round(): number;
    /** 当前生命值 */
    get now_hp(): number;
    /** 最大生命值 */
    get max_hp(): number;
    /** 当前怒气值 */
    get now_mp(): number;
    /** 最大怒气值 */
    get max_mp(): number;
    private _temp_now_attr;
    /** 重置当前属性 */
    resetTempNowAttr(): boolean;
    /** 当前的buff与基本属性的总和 */
    get now_attr(): AttrDict;
    /**
     * 从玩家信息获取战斗成员信息
     * @param team_id       队伍id
     * @param team_pos           站位
     * @param role          角色信息
     * @param roleConf      角色配置
     * @param attr          各功能提供属性（不包含技能的)
     * @param fight_force   角色战斗力
     */
    static initFromRole(team_id: string, team_pos: number, role: BagHeroData, roleConf: HeroInfo, attr: AttrDict, fight_force: number): FightRole;
    /** 是否反转目标 */
    isTargetReversal(): boolean;
    /** 是否死亡 */
    get is_dead(): boolean;
    /** 是否可行动 */
    get can_action(): boolean;
    /** 通过类型驱散buff */
    dispelBuffByType(type: number): void;
    /** 添加buff列表 */
    addBuffList(buff_list: Array<{
        buff_id: number;
        round: number;
    }>): void;
    /** 移除buff列表 */
    delBuffList(buff_list: Array<number>): void;
    /** 刷新buff属性效果 */
    private refBuffAttr;
    /**
     * 增加/减少士气
     * @param value
     * @returns {value:传入值 ,now:变化后剩余值 ,damage:实际变化值}
     */
    addMP(value: number): {
        value: number;
        now: number;
        damage: number;
    };
    /**
     * 增加/减少武将血量
     * @param value
     * @returns {value:传入值 ,now:变化后剩余值 ,damage:实际变化值}
     */
    addHP(value: number): {
        value: number;
        now: number;
        damage: number;
    };
}
