"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var clone_1 = __importDefault(require("clone"));
var fight_role_1 = require("./fight_role");
var fight_utils_1 = require("./fight_utils");
var fight_conf_1 = require("./fight_conf");
var FightTeam = /** @class */ (function () {
    /**
     * 获取战斗队伍信息
     * @param is_attacker       是否为攻击发起者
     * @param team              对应队伍信息                              {[team_pos:队伍中的位置]:背包中的位置}
     * @param hero_dict         队伍中各成员信息                          {[team_pos:队伍中的位置]:角色信息}
     * @param attr_dict         各个英雄 功能附加的属性（不包含技能的)      {[team_pos:队伍中的位置]:属性结构体}
     * @param fight_force_dict  各个英雄 对应战力                         {[team_pos:队伍中的位置]:对应的战力}
     */
    function FightTeam(team_type, is_attacker, team, hero_dict, attr_dict, fight_force_dict) {
        /** 队伍临时ID */
        this.team_id = "" + Date.now() + (~~(Math.random() * 100));
        /** 此队伍参战角色数量 */
        this._fight_role_cnt = 0;
        /** 角色信息 */
        this.roles = {};
        /** 队伍信息 */
        this.team = {};
        /** 队伍总战斗力 */
        this.team_fight_force = 0;
        /** 战斗对象的类型(user/monster) */
        this.type = fight_utils_1.TeamType.undefine;
        /** 是否为攻击方 */
        this.is_attacker = 0;
        /** 是否胜利(0/1) */
        this.is_win = 0;
        /** 未死英雄的位置数组 */
        this.alive_pos_list = [];
        /** 总的英雄数目 */
        this.total = 0;
        /** 头像 */
        this.head_pic = '';
        /** 名字 */
        this.name = '';
        /** 战斗全局状态(对所有武将的加成) */
        this.fightStatus = {
            /** 血量加成比例 */
            healthRate: 0,
            /** 攻击加成比例(对非魔法类有效) */
            attackRate: 0,
            /** 谋略加成比例(对魔法类有效) */
            magicAttackRate: 0,
            /** 武防加成比例(对非魔法类有效) */
            defenceRate: 0,
            /** 魔防加成比例(对魔法类有效) */
            magicDefenceRate: 0,
            /** 伤害系数 */
            damageFactor: 1.0,
        };
        this.team = clone_1.default(team);
        this.type = fight_utils_1.TeamType.user;
        switch (team_type) {
            case fight_utils_1.TeamType.user:
                this.init_from_user(is_attacker, hero_dict, attr_dict, fight_force_dict);
                break;
        }
    }
    Object.defineProperty(FightTeam.prototype, "team_health", {
        /** 队伍总血量 */
        get: function () {
            var tTotalHealth = 0;
            for (var tKey in this.roles) {
                var tFightRole = this.roles[tKey];
                tTotalHealth = tTotalHealth + tFightRole.max_hp;
            }
            return tTotalHealth;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(FightTeam.prototype, "health_map", {
        /** 获取当前队伍中各角色的生命值 */
        get: function () {
            var tHealthMap = {};
            for (var tKey in this.roles) {
                var tFightRole = this.roles[tKey];
                tHealthMap[tKey] = tFightRole.now_hp;
            }
            return tHealthMap;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * 获取战斗队伍信息
     * @param is_attacker       是否为攻击发起者
     * @param hero_bag          玩家角色背包信息                            {[team_pos:背包中位置]:角色信息}
     * @param attr_dict         各个英雄 功能附加的属性（不包含技能的)        {[team_pos:队伍中的位置]:属性结构体}
     * @param fight_force_dict  各个英雄 对应战力                           {[team_pos:队伍中的位置]:对应的战力}
     */
    FightTeam.prototype.init_from_user = function (is_attacker, hero_bag, attr_dict, fight_force_dict) {
        var team = this.team;
        for (var tKey in team) {
            var tTeamPos = Number(tKey);
            var tHeroBagHeroData = hero_bag[tTeamPos];
            var tCombatHeroTemplateData = fight_conf_1.FightConf.get_combat_hero_info(tHeroBagHeroData.rid);
            if (!tCombatHeroTemplateData) {
                continue;
            }
            this._fight_role_cnt++;
            var tHeroAttr = attr_dict[tTeamPos] || {};
            var tHeroFightForce = fight_force_dict[tTeamPos] || 0;
            this.roles[tTeamPos] = fight_role_1.FightRole.initFromRole(this.team_id, tTeamPos, tHeroBagHeroData, tCombatHeroTemplateData, tHeroAttr, tHeroFightForce);
            this.team_fight_force = (this.team_fight_force || 0) + tHeroFightForce;
            this.is_attacker = is_attacker ? fight_utils_1.AttackerType.ATTACKER : fight_utils_1.AttackerType.DEFENSE;
            if (this.roles[tTeamPos].now_hp <= 0) {
                continue;
            }
            this.alive_pos_list.push(tTeamPos);
            this.total++;
        }
    };
    /** 获取战斗角色信息 */
    FightTeam.prototype.getFightRole = function (fight_pos) {
        if (this.team_id != fight_pos.team_id) {
            return null;
        }
        return this.roles[fight_pos.team_pos];
    };
    /** 获取战斗前队伍信息 */
    FightTeam.prototype.getTeamInfoBeforeFight = function () {
        var teamInfo = {};
        for (var team_pos in this.team) {
            var role = this.roles[team_pos];
            if (!role) {
                continue;
            }
            var info = {
                'id': role.id,
                'level': role.level,
                'power': role.now_mp,
                'health': role.now_hp,
                'awake': role.awake || 0,
                'skill': role.skill_group,
            };
            teamInfo[team_pos] = info;
        }
        return teamInfo;
    };
    ;
    FightTeam.prototype.remove_list_item = function (list, item) {
        var index = list.indexOf(item);
        if (index >= 0) {
            list.splice(index, 1);
        }
        return list;
    };
    ;
    /** 是否全部阵亡 */
    FightTeam.prototype.isAllDead = function () {
        return (this.alive > 0) ? 0 : 1;
    };
    ;
    /** 阵亡武将数量 */
    FightTeam.prototype.getDeadCount = function () {
        return this._fight_role_cnt - this.alive;
    };
    ;
    Object.defineProperty(FightTeam.prototype, "alive", {
        /** 存活英雄数量 */
        get: function () {
            var tAliveCnt = 0;
            for (var tKey in this.roles) {
                var tFightRole = this.roles[tKey];
                if (!tFightRole) {
                    continue;
                }
                if (tFightRole.is_dead) {
                    continue;
                }
                tAliveCnt++;
            }
            return tAliveCnt;
        },
        enumerable: true,
        configurable: true
    });
    /** 根据pos获取role */
    FightTeam.prototype.getRole = function (team_pos) {
        return this.roles[team_pos];
    };
    ;
    return FightTeam;
}());
exports.FightTeam = FightTeam;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlnaHRfdGVhbS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2NvZGUvZmlnaHQvZmlnaHRfdGVhbS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLGdEQUEwQjtBQUUxQiwyQ0FBbUQ7QUFDbkQsNkNBQWlHO0FBRWpHLDJDQUFpRztBQUVqRztJQTBDSTs7Ozs7OztPQU9HO0lBQ0gsbUJBQVksU0FBaUIsRUFBRSxXQUFvQixFQUFFLElBQW9DLEVBQUUsU0FBOEMsRUFBRSxTQUEyQyxFQUFFLGdCQUFnRDtRQWpEeE8sYUFBYTtRQUNOLFlBQU8sR0FBVyxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDckUsZ0JBQWdCO1FBQ1Isb0JBQWUsR0FBVyxDQUFDLENBQUM7UUFDcEMsV0FBVztRQUNKLFVBQUssR0FBc0MsRUFBRSxDQUFDO1FBQ3JELFdBQVc7UUFDSixTQUFJLEdBQW1DLEVBQUUsQ0FBQztRQUNqRCxhQUFhO1FBQ04scUJBQWdCLEdBQUcsQ0FBQyxDQUFDO1FBQzVCLDRCQUE0QjtRQUNyQixTQUFJLEdBQUcsc0JBQVEsQ0FBQyxRQUFRLENBQUM7UUFDaEMsYUFBYTtRQUNOLGdCQUFXLEdBQUcsQ0FBQyxDQUFDO1FBQ3ZCLGdCQUFnQjtRQUNULFdBQU0sR0FBRyxDQUFDLENBQUM7UUFDbEIsZ0JBQWdCO1FBQ1QsbUJBQWMsR0FBa0IsRUFBRSxDQUFDO1FBQzFDLGFBQWE7UUFDTixVQUFLLEdBQUcsQ0FBQyxDQUFDO1FBQ2pCLFNBQVM7UUFDRixhQUFRLEdBQUcsRUFBRSxDQUFDO1FBQ3JCLFNBQVM7UUFDRixTQUFJLEdBQUcsRUFBRSxDQUFDO1FBRWpCLHVCQUF1QjtRQUNoQixnQkFBVyxHQUFHO1lBQ2pCLGFBQWE7WUFDYixVQUFVLEVBQUUsQ0FBQztZQUNiLHNCQUFzQjtZQUN0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