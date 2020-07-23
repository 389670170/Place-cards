"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fight_utils_1 = require("./fight_utils");
var fight_skill_1 = require("./fight_skill");
var fight_conf_1 = require("./fight_conf");
var fight_team_1 = require("./fight_team");
/** 战斗成员信息 */
var FightRoleStatus = /** @class */ (function () {
    function FightRoleStatus(fight_role) {
        this.refBuffAndHPByFightRole(fight_role);
        this[2] = 0;
        this[3] = 0;
        this[4] = 0;
        this[5] = 0;
        this[6] = 0;
    }
    /** 通过角色信息获取新的buff列表和剩余hp */
    FightRoleStatus.prototype.refBuffAndHPByFightRole = function (fight_role) {
        if (!fight_role) {
            return;
        }
        var tBuffList = {};
        for (var tKey in fight_role.buff_list) {
            var tBuffInfo = fight_role.buff_list[tKey];
            if (!tBuffInfo) {
                continue;
            }
            tBuffList[tKey] = { 1: tBuffInfo.round, 2: tBuffInfo.count };
        }
        this[0] = tBuffList;
        this[1] = fight_role.now_hp;
        this[3] = fight_role.now_mp;
    };
    return FightRoleStatus;
}());
exports.FightRoleStatus = FightRoleStatus;
var ActionInfo = /** @class */ (function () {
    function ActionInfo(atk_pos, def_pos, round) {
        /** 是否为发起攻击的队伍 */
        this.is_attacker = 0;
        this.atk_status = {};
        this.def_status = {};
        /** 效果对应id  技能、buff */
        this.attack_id = 0;
        /** 攻击方式 */
        this.attack_type = 0;
        this.atk_pos = atk_pos;
        this.def_pos = def_pos;
        this.status = {
            round: round,
            powerDamageFactor: 1.0,
            skillDamageFactor: 1.0,
            critDamageRate: 0,
        };
    }
    return ActionInfo;
}());
exports.ActionInfo = ActionInfo;
/** 战报信息 */
var BattleReport = /** @class */ (function () {
    /** 战报 */
    function BattleReport(atk_team, def_team) {
        this.success = 0;
        /** 每一轮中的action列表 */
        this.rounds = {};
        /** 超过最大回合数限制 1-超过 0-未超过 */
        this.over_rounds = fight_utils_1.OverRound.SAFE;
        this.atk_headpic = atk_team.head_pic;
        this.atk_name = atk_team.name;
        this.atk_team_health = atk_team.team_health;
        this.atk_remain_health = 0;
        this.atk_team = atk_team.getTeamInfoBeforeFight();
        this.atk_health_map = {};
        this.def_headpic = def_team.head_pic;
        this.def_name = def_team.name;
        this.def_team_health = def_team.team_health;
        this.def_remain_health = 0;
        this.def_team = def_team.getTeamInfoBeforeFight();
        this.def_health_map = {};
    }
    ;
    return BattleReport;
}());
exports.BattleReport = BattleReport;
/**
 * 获取战斗队伍信息 (玩家)
 * @param is_attacker       是否为攻击发起者
 * @param team              对应队伍信息                              {[team_pos:队伍中的位置]:背包中的位置}
 * @param hero_dict          玩家角色背包信息                         {[team_pos:队伍中的位置]:角色信息}
 * @param attr_dict         各个英雄 功能附加的属性（不包含技能的)      {[team_pos:队伍中的位置]:属性结构体}
 * @param fight_force_dict  各个英雄 对应战力                         {[team_pos:队伍中的位置]:对应的战力}
 */
function getPlayerTeam(is_attacker, team, hero_dict, attr_dict, fight_force_dict) {
    return new fight_team_1.FightTeam(fight_utils_1.TeamType.user, is_attacker, team, hero_dict, attr_dict, fight_force_dict);
}
exports.getPlayerTeam = getPlayerTeam;
/**
 * 获取战报
 * @param atk_team          攻击者队伍信息
 * @param def_team          防御者队伍信息
 * @param options           附加参数
 */
function fight(atk_team, def_team, options) {
    var _a;
    return (_a = Fight.inst) === null || _a === void 0 ? void 0 : _a.fight(atk_team, def_team, options);
}
exports.fight = fight;
var Fight = /** @class */ (function () {
    /**
     * 初始化战斗模块 ，将配置表传入
     * @param gConfSkill
     * @param gConfSkillGroup
     * @param gConfBuff
     * @param gConfCombatHeroTemplate
     */
    function Fight(gConfSkill, gConfSkillGroup, gConfBuff, gConfCombatHeroTemplate) {
        this._fight_skill = new fight_skill_1.FightSkill();
        new fight_conf_1.FightConf(gConfSkill, gConfSkillGroup, gConfBuff, gConfCombatHeroTemplate);
        Fight._inst = this;
    }
    Object.defineProperty(Fight, "inst", {
        get: function () {
            return Fight._inst;
        },
        enumerable: true,
        configurable: true
    });
    /** 排列出是出手顺序 */
    Fight.prototype.sort_role_list = function (list) {
        for (var i = 0; i < list.length; i++) { // 每次排序时 重新获取当前角色属性信息
            list[i].fight_role.resetTempNowAttr();
        }
        return list.sort(function (a, b) {
            if (!a) {
                return 1;
            }
            if (!b) {
                return -1;
            }
            if (a.fight_role.round != b.fight_role.round) {
                return a.fight_role.round - b.fight_role.round;
            } // 本轮攻击过的不再攻击
            if (a.fight_role.now_attr[fight_utils_1.AttributeType.ATKSPEED] != b.fight_role.now_attr[fight_utils_1.AttributeType.ATKSPEED]) {
                return b.fight_role.now_attr[fight_utils_1.AttributeType.ATKSPEED] - a.fight_role.now_attr[fight_utils_1.AttributeType.ATKSPEED];
            } // 判断角色当前速度
            if (a.atk_team != b.atk_team) {
                return b.atk_team.is_attacker - a.atk_team.is_attacker;
            }
            ; // 判断是否为攻击者
            return b.pos - a.pos; // 判断位置是否靠前
        });
    };
    Fight.prototype.fight = function (atk_team, def_team, options) {
        options = options || {};
        var tBattleReport = new BattleReport(atk_team, def_team);
        var tFightRoleList = [];
        for (var tKey in atk_team.roles) {
            if (!atk_team.roles[tKey] || atk_team.roles[tKey].team_pos == -1) {
                continue;
            }
            tFightRoleList.push({ atk_team: atk_team, def_team: def_team, pos: atk_team.roles[tKey].team_pos, fight_role: atk_team.roles[tKey] });
        }
        for (var tKey in def_team.roles) {
            if (!def_team.roles[tKey] || def_team.roles[tKey].team_pos == -1) {
                continue;
            }
            tFightRoleList.push({ atk_team: def_team, def_team: atk_team, pos: atk_team.roles[tKey].team_pos, fight_role: def_team.roles[tKey] });
        }
        var tTeamDict = {};
        tTeamDict[atk_team.team_id] = atk_team;
        tTeamDict[def_team.team_id] = def_team;
        var round = 0;
        var tActionList = [];
        tBattleReport.rounds[round] = tActionList;
        tActionList = tActionList.concat(this.doPassiveSkillOnStart(atk_team, def_team));
        do {
            round++;
            tActionList = [];
            tBattleReport.rounds[round] = tActionList;
            tActionList = tActionList.concat(this.doPreAction(atk_team, def_team, round));
            var i = 0;
            do {
                i++;
                tFightRoleList = this.sort_role_list(tFightRoleList);
                var tFightRoleInfo = tFightRoleList[0];
                if (!tFightRoleInfo) {
                    continue;
                }
                ;
                var tFightRole = tFightRoleInfo.fight_role;
                tFightRole.round = round; // 标记角色已经行动过
                if (tFightRole.is_dead) {
                    continue;
                } // 已经死亡
                var tActionInfo = this.doAction(round, tFightRoleInfo.fight_role, tTeamDict);
                if (!tActionInfo) {
                    continue;
                }
                tActionInfo.is_attacker = tFightRoleInfo.atk_team.is_attacker;
                tBattleReport.rounds[round].push(tActionInfo);
            } while (i < tFightRoleList.length && !atk_team.isAllDead() && !def_team.isAllDead());
            tActionList = tActionList.concat(this.doAfterAction(atk_team, def_team, round));
        } while (round <= fight_utils_1.FightUtils.maxRound && !atk_team.isAllDead() && !def_team.isAllDead());
        if (atk_team.isAllDead()) {
            def_team.is_win = 1;
        }
        else if (def_team.isAllDead()) {
            atk_team.is_win = 1;
        }
        if (round > fight_utils_1.FightUtils.maxRound) {
            if (def_team.type == fight_utils_1.TeamType.user) {
                if (atk_team.team_health > def_team.team_health) {
                    atk_team.is_win = 1;
                    tBattleReport.success = 1;
                }
                else if (atk_team.team_health == def_team.team_health) {
                    if (!options.firstMove) {
                        atk_team.is_win = 1;
                        tBattleReport.success = 1;
                    }
                }
            }
            else {
                def_team.is_win = 1;
                tBattleReport.success = 0;
            }
            tBattleReport.over_rounds = fight_utils_1.OverRound.OVER;
        }
        else {
            if (atk_team.is_win) {
                tBattleReport.success = 1;
            }
            else {
                tBattleReport.success = 0;
            }
        }
        tBattleReport.atk_health_map = atk_team.health_map;
        tBattleReport.def_health_map = def_team.health_map;
        tBattleReport.atk_remain_health = atk_team.team_health;
        tBattleReport.def_remain_health = def_team.team_health;
        return tBattleReport;
    };
    /** 战斗开始前处理技能效果 */
    Fight.prototype.doPassiveSkillOnStart = function (atk_team, def_team) {
        var tActionList = [];
        return tActionList;
    };
    /** 处理战斗全局状态 */
    Fight.prototype.processFightStatus = function (team) {
        var tActionList = [];
        return tActionList;
    };
    ;
    /** 当前轮 战前处理 */
    Fight.prototype.doPreAction = function (atk_team, def_team, curRound) {
        var tActionList = [];
        return tActionList;
    };
    ;
    /** 当前轮 战后处理 */
    Fight.prototype.doAfterAction = function (atk_team, def_team, curRound) {
        var tActionList = [];
        return tActionList;
    };
    ;
    /** 获取目标的pos [{pos:number ,is_self:boolean}] */
    Fight.prototype.getTargetPos = function (attack_role, team_dict, skill_info) {
        var atk_team = null;
        var def_team = null;
        for (var tTeamID in team_dict) {
            if (!team_dict[tTeamID]) {
                continue;
            }
            if (team_dict[tTeamID].is_attacker == fight_utils_1.AttackerType.ATTACKER) {
                atk_team = team_dict[tTeamID];
            }
            else {
                def_team = team_dict[tTeamID];
            }
        }
        if (!atk_team || !def_team) {
            return [];
        }
        var tCanSelectPosList = [];
        var tTargetPosList = [];
        var tTargeter;
        var tIsSelf = false;
        var tIsTargetReversal = attack_role.isTargetReversal(); // 是否反转目标
        var tFightRoleList = [];
        switch (skill_info.targetType) {
            case fight_utils_1.TargetType.friend:
                tIsSelf = true;
                tTargeter = tIsTargetReversal ? def_team : atk_team;
                for (var tKey in tTargeter.roles) {
                    if (!tTargeter.roles[tKey]) {
                        continue;
                    }
                    tFightRoleList.push(tTargeter.roles[tKey]);
                }
                break;
            case fight_utils_1.TargetType.enemy:
                tIsSelf = false;
                tTargeter = tIsTargetReversal ? atk_team : def_team;
                for (var tKey in tTargeter.roles) {
                    if (!tTargeter.roles[tKey]) {
                        continue;
                    }
                    tFightRoleList.push(tTargeter.roles[tKey]);
                }
                break;
            case fight_utils_1.TargetType.all:
                tIsSelf = false;
                for (var tKey in atk_team.roles) {
                    if (!atk_team.roles[tKey]) {
                        continue;
                    }
                    tFightRoleList.push(atk_team.roles[tKey]);
                }
                for (var tKey in def_team.roles) {
                    if (!def_team.roles[tKey]) {
                        continue;
                    }
                    tFightRoleList.push(def_team.roles[tKey]);
                }
                break;
            default:
                return tTargetPosList;
        }
        switch (skill_info.effectType) {
            case fight_utils_1.SkillEffectType.RESURRECTION:
                for (var i = 0; i < tFightRoleList.length; i++) {
                    var tFightRoleInfo = tFightRoleList[i];
                    if (!tFightRoleInfo) {
                        continue;
                    }
                    if (tFightRoleInfo.now_hp > 0) {
                        continue;
                    }
                    var isFront = (fight_utils_1.SlotInfo.FRONT_SLOT_LIST.indexOf(tFightRoleInfo.team_pos) != -1);
                    tCanSelectPosList.push({
                        team_pos: tFightRoleInfo.team_pos,
                        hp: tFightRoleInfo.now_hp,
                        mp: tFightRoleInfo.now_mp,
                        is_front: isFront,
                        team_id: tFightRoleInfo.team_id,
                    });
                }
                break;
            case fight_utils_1.SkillEffectType.CURE:
                for (var i = 0; i < tFightRoleList.length; i++) {
                    var tFightRoleInfo = tFightRoleList[i];
                    if (!tFightRoleInfo) {
                        continue;
                    }
                    if (tFightRoleInfo.now_hp <= 0) {
                        continue;
                    }
                    var isFront = (fight_utils_1.SlotInfo.FRONT_SLOT_LIST.indexOf(tFightRoleInfo.team_pos) != -1);
                    tCanSelectPosList.push({
                        team_pos: tFightRoleInfo.team_pos,
                        hp: tFightRoleInfo.now_hp,
                        mp: tFightRoleInfo.now_mp,
                        is_front: isFront,
                        team_id: tFightRoleInfo.team_id,
                    });
                }
                break;
            case fight_utils_1.SkillEffectType.DEFAULT_ACT:
            case fight_utils_1.SkillEffectType.REAL_ACT:
            case fight_utils_1.SkillEffectType.SKILL_ACT:
                for (var i = 0; i < tFightRoleList.length; i++) {
                    var tFightRoleInfo = tFightRoleList[i];
                    if (!tFightRoleInfo) {
                        continue;
                    }
                    if (tFightRoleInfo.now_hp <= 0) {
                        continue;
                    }
                    var isFront = (fight_utils_1.SlotInfo.FRONT_SLOT_LIST.indexOf(tFightRoleInfo.team_pos) != -1);
                    tCanSelectPosList.push({
                        team_pos: tFightRoleInfo.team_pos,
                        hp: tFightRoleInfo.now_hp,
                        mp: tFightRoleInfo.now_mp,
                        is_front: isFront,
                        team_id: tFightRoleInfo.team_id,
                    });
                }
                break;
            case fight_utils_1.SkillEffectType.NULL:
            default:
                return tTargetPosList;
        }
        var tTargetNum = 0; // 获取目标数量
        if (skill_info.targetMinNum) {
            tTargetNum = fight_utils_1.FightUtils.randRange(skill_info.targetMinNum, skill_info.targetMaxNum - 1);
        }
        else {
            tTargetNum = skill_info.targetMaxNum;
        }
        for (var i = 0; i < tTargetNum; i++) {
            if (tCanSelectPosList.length <= 0) {
                break;
            } // 已经没有人可以选了
            var tTargetIdx = attack_role.team_pos;
            if (i == 0 && skill_info.isSelfFirst) { // 如果是优先选自己 先选自己 否则按照寻敌方式查找
                var j = 0;
                for (j = 0; j < tCanSelectPosList.length; j++) {
                    if (tCanSelectPosList[j].team_id != attack_role.team_id || tCanSelectPosList[j].team_pos != attack_role.team_pos) {
                        continue;
                    }
                    break;
                }
                tTargetPosList.push(tCanSelectPosList[j]);
                tCanSelectPosList.splice(j, 1);
                continue;
            }
            switch (skill_info.findTargetWay) {
                case fight_utils_1.FindTargetWay.front_row:
                    tCanSelectPosList = tCanSelectPosList.sort(function (a, b) { if (b.is_front == a.is_front) {
                        return a.team_pos - b.team_pos;
                    }
                    else if (b.is_front) {
                        return 1;
                    }
                    else {
                        return -1;
                    } });
                    tTargetIdx = i;
                    break;
                case fight_utils_1.FindTargetWay.back_row:
                    tCanSelectPosList = tCanSelectPosList.sort(function (a, b) { if (a.is_front == b.is_front) {
                        return a.team_pos - b.team_pos;
                    }
                    else if (a.is_front) {
                        return 1;
                    }
                    else {
                        return -1;
                    } });
                    tTargetIdx = i;
                    break;
                case fight_utils_1.FindTargetWay.hp_hight:
                    tCanSelectPosList = tCanSelectPosList.sort(function (a, b) { return a.hp - b.hp; });
                    tTargetIdx = i;
                    break;
                case fight_utils_1.FindTargetWay.hp_lower:
                    tCanSelectPosList = tCanSelectPosList.sort(function (a, b) { return b.hp - a.hp; });
                    tTargetIdx = i;
                    break;
                case fight_utils_1.FindTargetWay.mp_hight:
                    tCanSelectPosList = tCanSelectPosList.sort(function (a, b) { return a.mp - b.mp; });
                    tTargetIdx = i;
                    break;
                case fight_utils_1.FindTargetWay.mp_lower:
                    tCanSelectPosList = tCanSelectPosList.sort(function (a, b) { return b.mp - a.mp; });
                    tTargetIdx = i;
                    break;
                case fight_utils_1.FindTargetWay.random:
                    tTargetIdx = fight_utils_1.FightUtils.randRange(0, tCanSelectPosList.length - 1);
                    break;
                default:
                    tTargetIdx = fight_utils_1.FightUtils.randRange(0, tCanSelectPosList.length - 1);
                    break;
            }
            tTargetPosList.push(tCanSelectPosList[tTargetIdx]);
            tCanSelectPosList.splice(tTargetIdx, 1);
        }
        return tTargetPosList;
    };
    /** 战斗前处理所有的被动技能 */
    Fight.prototype.doPassiveSkillOnBeforeAction = function (atk_team, def_team) {
        var tActionList = [];
        return tActionList;
    };
    /**
     * 获取角色在此回合说需要做的操作
     * @param round             当前回合数
     * @param fight_role        进行行动的角色
     * @param team_dict          行动角色所在队伍
     * @param def_team          行动角色敌对队伍
     * @returns ActionInfo
     */
    Fight.prototype.doAction = function (round, fight_role, team_dict) {
        if (!fight_role) {
            return null;
        }
        if (!fight_role.can_action) {
            return null;
        } // 被限制行动
        if (!fight_role.skill_group) {
            return null;
        }
        var tActionType = 0;
        if (fight_role.now_mp >= fight_role.skill_group.angerSkillLimit) {
            tActionType = fight_utils_1.CastType.ANGER;
        }
        else {
            tActionType = fight_utils_1.CastType.DEFAULT;
        }
        var tSkillID = 0;
        switch (tActionType) {
            case fight_utils_1.CastType.DEFAULT:
                tSkillID = fight_role.skill_group.baseSkill;
                break;
            case fight_utils_1.CastType.ANGER:
                tSkillID = fight_role.skill_group.angerSkill;
                break;
            default:
                break;
        }
        if (!tSkillID) {
            return null;
        }
        var tSkillInfo = fight_conf_1.FightConf.get_skill_info(tSkillID, fight_role.skill_level_dict[tSkillID]);
        if (!tSkillInfo) {
            return null;
        }
        fight_role.addMP(-fight_role.skill_group.angerSkillLimit);
        var tTargetPos = this.getTargetPos(fight_role, team_dict, tSkillInfo);
        var tActioInfo = new ActionInfo(fight_role.fight_pos, [], round);
        for (var i = 0; i < tTargetPos.length; i++) {
            var tPosInfo = tTargetPos[i];
            if (!tPosInfo) {
                continue;
            }
            var tFightTeam = team_dict[tPosInfo.team_id];
            if (!tFightTeam) {
                continue;
            }
            tActioInfo.def_pos.push(tPosInfo);
            var tFightRole = tFightTeam.getFightRole(tPosInfo);
            if (!tFightRole) {
                continue;
            }
            var tFinalActionStatus = this._fight_skill.calcDamage(team_dict, fight_role, tFightRole, tSkillInfo);
            tActioInfo.atk_status[fight_role.fight_pos.team_id] = tActioInfo.atk_status[fight_role.fight_pos.team_id] || {};
            tActioInfo.atk_status[fight_role.fight_pos.team_id][fight_role.fight_pos.team_pos] = tFinalActionStatus.atk_status;
            tActioInfo.def_status[tFightRole.fight_pos.team_id] = tActioInfo.def_status[tFightRole.fight_pos.team_id] || {};
            tActioInfo.def_status[tFightRole.fight_pos.team_id][tFightRole.fight_pos.team_pos] = tFinalActionStatus.def_status;
        }
        return tActioInfo;
    };
    Fight._inst = null;
    return Fight;
}());
exports.Fight = Fight;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZmlnaHQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9jb2RlL2ZpZ2h0L2ZpZ2h0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQXFPO0FBQ3JPLDZDQUEyQztBQUMzQywyQ0FBaUc7QUFFakcsMkNBQXlDO0FBR3pDLGFBQWE7QUFDYjtJQWdCSSx5QkFBWSxVQUFxQjtRQUM3QixJQUFJLENBQUMsdUJBQXVCLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDekMsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNaLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDWixJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ1osSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNaLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDaEIsQ0FBQztJQUVELDRCQUE0QjtJQUNyQixpREFBdUIsR0FBOUIsVUFBK0IsVUFBcUI7UUFDaEQsSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUFFLE9BQU87U0FBRTtRQUM1QixJQUFJLFNBQVMsR0FBa0QsRUFBRSxDQUFDO1FBQ2xFLEtBQUssSUFBSSxJQUFJLElBQUksVUFBVSxDQUFDLFNBQVMsRUFBRTtZQUNuQyxJQUFJLFNBQVMsR0FBRyxVQUFVLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzNDLElBQUksQ0FBQyxTQUFTLEVBQUU7Z0JBQUUsU0FBUzthQUFFO1lBQzdCLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7U0FDaEU7UUFFRCxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsU0FBUyxDQUFDO1FBQ3BCLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMs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