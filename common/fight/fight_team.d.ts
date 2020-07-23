import { FightRole, FightPos } from "./fight_role";
import { BagHeroData, AttrDict, SkillGroup } from "./fight_conf";
export declare class FightTeam {
    /** 队伍临时ID */
    team_id: string;
    /** 此队伍参战角色数量 */
    private _fight_role_cnt;
    /** 角色信息 */
    roles: {
        [team_pos: number]: FightRole;
    };
    /** 队伍信息 */
    team: {
        [team_pos: number]: number;
    };
    /** 队伍总战斗力 */
    team_fight_force: number;
    /** 战斗对象的类型(user/monster) */
    type: string;
    /** 是否为攻击方 */
    is_attacker: number;
    /** 是否胜利(0/1) */
    is_win: number;
    /** 未死英雄的位置数组 */
    alive_pos_list: Array<number>;
    /** 总的英雄数目 */
    total: number;
    /** 头像 */
    head_pic: string;
    /** 名字 */
    name: string;
    /** 战斗全局状态(对所有武将的加成) */
    fightStatus: {
        /** 血量加成比例 */
        healthRate: number;
        /** 攻击加成比例(对非魔法类有效) */
        attackRate: number;
        /** 谋略加成比例(对魔法类有效) */
        magicAttackRate: number;
        /** 武防加成比例(对非魔法类有效) */
        defenceRate: number;
        /** 魔防加成比例(对魔法类有效) */
        magicDefenceRate: number;
        /** 伤害系数 */
        damageFactor: number;
    };
    /**
     * 获取战斗队伍信息
     * @param is_attacker       是否为攻击发起者
     * @param team              对应队伍信息                              {[team_pos:队伍中的位置]:背包中的位置}
     * @param hero_dict         队伍中各成员信息                          {[team_pos:队伍中的位置]:角色信息}
     * @param attr_dict         各个英雄 功能附加的属性（不包含技能的)      {[team_pos:队伍中的位置]:属性结构体}
     * @param fight_force_dict  各个英雄 对应战力                         {[team_pos:队伍中的位置]:对应的战力}
     */
    constructor(team_type: string, is_attacker: boolean, team: {
        [team_pos: number]: number;
    }, hero_dict: {
        [team_pos: number]: BagHeroData;
    }, attr_dict: {
        [team_pos: number]: AttrDict;
    }, fight_force_dict: {
        [team_pos: number]: number;
    });
    /** 队伍总血量 */
    get team_health(): number;
    /** 获取当前队伍中各角色的生命值 */
    get health_map(): {
        [bag_pos: number]: number;
    };
    /**
     * 获取战斗队伍信息
     * @param is_attacker       是否为攻击发起者
     * @param hero_bag          玩家角色背包信息                            {[team_pos:背包中位置]:角色信息}
     * @param attr_dict         各个英雄 功能附加的属性（不包含技能的)        {[team_pos:队伍中的位置]:属性结构体}
     * @param fight_force_dict  各个英雄 对应战力                           {[team_pos:队伍中的位置]:对应的战力}
     */
    private init_from_user;
    /** 获取战斗角色信息 */
    getFightRole(fight_pos: FightPos): FightRole | null;
    /** 获取战斗前队伍信息 */
    getTeamInfoBeforeFight(): {
        [pos: number]: {
            id: number;
            level: number;
            power: number;
            health: number;
            awake: number;
            skill: SkillGroup | null;
        };
    };
    remove_list_item(list: Array<any>, item: any): any[];
    /** 是否全部阵亡 */
    isAllDead(): 0 | 1;
    /** 阵亡武将数量 */
    getDeadCount(): number;
    /** 存活英雄数量 */
    get alive(): number;
    /** 根据pos获取role */
    getRole(team_pos: number): FightRole | null;
}
