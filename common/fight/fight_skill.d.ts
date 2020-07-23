import { FightTeam } from "./fight_team";
import { FightRole } from "./fight_role";
import { FightRoleStatus } from "./fight";
import { SkillInfo } from "./fight_conf";
/** 单次攻击的的状态机 */
export declare class eachStatus {
    /**  额外闪避百分比 */
    missRate: number;
    /**  额外格挡百分比 */
    blockRate: number;
    /**  额外暴击百分比 */
    critDamageRate: number;
    /**  额外的克制百分比 */
    restrainRate: number;
    /**  额外反伤百分比 */
    rehurtRate: number;
    /**  //额外技能伤害百分比(包括) */
    skillDamageRate: number;
    /**  额外基础伤害百分比 */
    basicDamageRate: number;
}
/** 战斗后处理被动技能 */
export declare class eachResult {
    /** 基础伤害系数 */
    basicFactor: number;
    basicDamage: number;
    restrainFactor: number;
    skillFactor: number;
}
export declare class FightSkill {
    /** 计算伤害 */
    calcDamage(team_dict: {
        [team_id: number]: FightTeam;
    }, attack_role: FightRole, target_role: FightRole, skill_info: SkillInfo): {
        atk_status: FightRoleStatus;
        def_status: FightRoleStatus;
    };
}
