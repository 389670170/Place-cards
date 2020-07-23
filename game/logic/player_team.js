
const util = require('util');
const clone = require('clone');
const CostLog = require('./cost_log.js');
const ResBack = require('./resback.js');
const Upgrade = require('./upgrade.js');
const loginCommon = require('./common.js');
const common = require('../../common/common.js');
const conf_mgr = require('../../common/conf_mgr.js');
const logic_event_mgr = require('./logic_event_mgr.js');
const logic = require('../logic');
const hero = require('./hero.js');
const server = require('../../common/server.js');
const { user_snapshot_data } = require('../../common/common.js');
const { ServerName, LogType, OneDayTime, TEAM_NAME, SKY_TYPE_CONFIG, HeroPartCount } = require('../../common/enum.js');
const { client_send_msg } = require('../../common/net/ws_client.js');
const { forceSyncToWorld } = require('./common.js');
const { getPlayerTeam } = require('../../common/fight/fight.js');
const { parseAwardsConfig, isModuleOpen_new, reformAwards, cloneHeroInitAttr } = require('../../common/global.js');

const act_name = `team`;

function get_default_data() {
    return {
        /** 上陣的位置對應 {[mod_name:模块名字]:{[team_id:队伍id]:{[pos:位置]:英雄背包中位置}}}   role index */
    }
}

/** 服务器启动时 创建用户数据 player.js中会自动调用 */
exports.init_user_data = function (user) {
    user[act_name] = get_default_data();

    user[act_name][TEAM_NAME.DEFAULT] = {
        '1': {
            //'index':pos,
        },
        //'2':{},
    }
};

exports.getFightForce = getFightForce;
/**
 * 获取玩家队伍的战斗力
 * @param {*} player        玩家信息
 * @param {*} team_name     队伍名字
 * @param {*} team_idx      队伍id 默认会使用队伍组的第一个队伍
 * @param {*} forceMark     强制计算
 * @param {*} callback      回调函数
 */
function getFightForce(player, team_name, team_idx, forceMark, callback) {
    // exports.getFightForce = function (player, team_name, team_idx, forceMark, callback) {
    var fightForce = 0;
    try {
        if (!TEAM_NAME[team_name]) {                            // 不存在的队伍类型
            return 0;
        }

        if (!player.memData.ffchanged && !forceMark) {
            callback && callback(player.memData.fight_force);
            return player.memData.fight_force;
        }

        team_idx = team_idx || 1;
        var team = player.user.team[team_name][team_idx];
        var fightForceNoExtra = 0;

        for (var indx in team) {
            if (!indx) { continue; }

            var user = player.user;
            var heroObj = user.hero_bag.heros[heroIndex];
            var heroFightForce = hero.getHeroFightForce(player, heroObj, team);
            fightForce += heroFightForce;
        }

        if (fightForce > player.user.mark.max_fight_force) {            // 更新玩家最高战力
            player.user.mark.max_fight_force = fightForce;
            player.markDirty('mark.max_fight_force');

            outline_sync_to_client(this);            // 在线奖励通知
        }

        if (fightForceNoExtra > player.user.mark.max_fight_force_no_extra) {
            player.user.mark.max_fight_force_no_extra = fightForceNoExtra;
            player.markDirty('mark.max_fight_force_no_extra');
        }

        player.user.temp = player.user.temp || {};
        player.user.temp.max_fight_force = player.user.temp.max_fight_force || 0;
        if (fightForce > player.user.temp.max_fight_force) {
            var tRespData = {};
            requestGlobal(                                      // 通知跨服global更新最高战力
                {
                    mod: "fight_rank",
                    act: "fight_update",
                    uid: player.uid,
                    args: {
                        fight: fightForce,
                        data: user_snapshot_data(player.user),
                    }
                },
                tRespData,
                function () {
                    if (!tRespData.code) {
                        player.user.temp.max_fight_force = fightForce;
                    }
                    callback && callback(player.user.temp.max_fight_force);
                }.bind(this)
            );
        }

        player.memData.fight_force = fightForce > player.memData.fight_force ? fightForce : player.memData.fight_force;         // 当前记录的战力小于刚刚计算出来的值则记录
        player.memData.ffchanged = 0;
        player.doOpenSeven('fightForce');
        player.doOpenHoliday('fightForce');
        logic_event_mgr.emit(logic_event_mgr.EVENT.DO_TASK, player, 'fightPower', fightForce);

        if (!tRespData) {
            callback && callback(fightForce);
        }
    } catch (err) {        // 计算战斗力出错, 不能影响其他功能
        ERROR('ff error cause by ' + player.uid);
        ERROR(err.stack);
        callback && callback(0);
    }
    return fightForce;
};

exports.addInTeam = addInTeam;
/**
 * 向队伍中添加角色 
 * @param {*} player        玩家信息
 * @param {*} team_name     队伍名字
 * @param {*} teamId        队伍id
 * @param {*} index         需要添加到队伍中的位置
 * @param {*} pos           角色在背包中的位置
 */
function addInTeam(player, team_name, teamId, index, pos) {
    if (pos > 9 || pos <= 0) { return false; }

    if (!player.user.hero_bag.heros[pos]) { return false; }

    player.user.team[team_name] = player.user.team[team_name] || {};
    player.user.team[team_name][teamId] = player.user.team[team_name][teamId] || {};

    player.memData.ffchanged = 1;

    player.user.team[team_name][teamId][index] = +pos;
    player.markDirty('team');
    getFightForce(player, team_name, teamId);
    return true;
};

exports.syncTeam = syncTeam;
function syncTeam(player, team_name, teamId, team) {
    var user = player.user;

    var valid = true;    // 保存阵容
    var oldNum = Object.keys(user.team[team_name][teamId]).length;
    var newNum = Object.keys(team[team_name]).length;

    if (newNum > 7 || oldNum > newNum) { return false; }

    if (!team[team_name] || teamId > 3 || teamId <= 0) { return false; }
    if (Object.keys(team[team_name]).length > 7) { return false; }

    for (var hid in team[team_name]) {
        if (user.hero_bag.heros[hid]) { continue; }
        valid = false;
        break;
    }

    if (!valid) { return false; }

    user.team[team_name][teamId] = team;
    player.markDirty(`team.${team_name}.${teamId}`);

    player.markFightForceChanged();
    getFightForce(player, team_name, teamId);

    return true;
};

function findOneUnusePosInTeam(player, team) {
    var usePosMap = {};

    for (var hid in team) {
        var pos = team[hid];
        usePosMap[pos] = true;
    }

    var index = -1;

    for (var i = 1; i <= 9; i++) {
        if (!usePosMap[i]) {
            index = i;
            break;
        }
    }

    return index;
};

exports.getFightTeam = getFightTeam;
/**
 * 获取玩家的战斗队伍信息
 * @param {*} player        玩家信息
 * @param {*} team_name     队伍名字
 * @param {*} team_idx      队伍编号
 * @param {*} is_attacker   是否攻击者
 */
function getFightTeam(player, team_name, team_idx, is_attacker) {
    var user = player.user;
    if (!user.team[team_name] || !user.team[team_name][team_idx]) { return null; }
    if (!user.hero_bag || !user.hero_bag.heros) { return null; }
    var team = user.team[team_name][team_idx];
    var tHeroInfoDict = {};
    var tFightForceDict = {};
    var tFightAttr = {};
    for (var tTeamPos in team) {
        var tBagPos = team[tTeamPos];
        var tHeroInfo = user.hero_bag.heros[tBagPos];
        if (!tHeroInfo) { continue; }
        tHeroInfoDict[tTeamPos] = tHeroInfo;
        tFightAttr[tTeamPos] = hero.getHeroAttr(player, tHeroInfo, team);
        tFightForceDict[tTeamPos] = getFightForce(player, team_name, team_idx, false, null);
    }
    return getPlayerTeam(is_attacker, team, tHeroInfoDict, tFightAttr, tFightForceDict);
}

/**
 * 该功能中对英雄的附加属性
 * @param {*} player    玩家信息
 * @param {*} hero      英雄信息
 * @param {*} team      所在队伍信息
 */
exports.hero_additional_attribute = function (player, hero, team) {
    if (!player || !player.user || !player.user.hero_bag || !player.user.hero_bag.heros) { return {} }

    var heros = player.user.hero_bag.heros;
    var tHeroBagPos = hero.bag_pos;
    var attrArr = cloneHeroInitAttr();
    for (var pos in team) {
        var tBagPos = team[pos];
        var hObj = heros[tBagPos];
        var combatConf = conf_mgr.getHeroCombatConf(hObj.rid, hObj.awake);
        var baseStarLv = combatConf['starBase'];
        var innateGroupId = combatConf['innateGroup'];
        var innateGroupCfg = conf_mgr.gConfInnateGroup[innateGroupId];
        var innateCfg = conf_mgr.gConfInnate;

        var activeCount = Math.min(+(conf_mgr.gConfGlobal['innateNum' + baseStarLv]), hObj.tier);            //已激活天赋条数         
        for (var k = 1; k <= activeCount; k++) {
            var innateId = innateGroupCfg['level' + k];
            var value = innateGroupCfg['value' + k];
            var attrType1 = innateCfg[innateId]['att1'];
            var attrType2 = innateCfg[innateId]['att2'];
            var addType = innateCfg[innateId]['type'];
            var targetType = innateCfg[innateId]['target'];
            var isAdd = false;

            if (targetType == 2) {                                      // 作用全体上阵武将
                isAdd = true;
            }
            else if (targetType == 1 && tBagPos == tHeroBagPos) {             // 作用于自己
                isAdd = true;
            }

            if (!isAdd) { continue; }

            if (addType == 1) {                    //固定值
                attrArr[attrType1] = attrArr[attrType1] + value;
                attrArr[attrType2] = attrArr[attrType2] + value;
            } else if (addType == 2) {                        //百分比
                attrArr[attrType1] = attrArr[attrType1] + Math.floor(baseAttrArr[attrType1] * value / 100);
                attrArr[attrType2] = attrArr[attrType2] + Math.floor(baseAttrArr[attrType2] * value / 100);
            }
        }
    }

    return attrArr;
};

/** 用户退出前重新计算战斗力 */
exports.player_exit = function (player) {
    var tTeam = player.user.team;
    for (var team_name in tTeam) {
        for (var tIdx in tTeam[team_name]) {
            getFightForce(player, team_name, tTeam[team_name][tIdx]);
        }
    }
}